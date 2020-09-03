import fs, { Stats, Dirent } from 'graceful-fs'
import path from 'path'
import md5 from 'md5'
import dotenv from 'dotenv'

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  encoding: 'utf8',
  debug: true
})

class Hasher {

  constructor (private path: string) {
  }

  async hash () {
    console.log(`creating hash over ${this.path}`)

    return fs.promises.lstat(this.path)
      .then(stats => {
        stats.name = this.path
        return stats
      })
      .then(stats => this.browse(stats, this.path))
      .then(result => result)
      .catch(error => {
        console.error('Fatal error:', error)
        throw error
      })
  }

  async browse (stats: Dirent, dirname: string): Promise<any> {
    if (stats.isDirectory()) {
      const folderPath = (this.path === stats.name) ? this.path : path.join(dirname, stats.name)

      return fs.promises.readdir(folderPath, { withFileTypes: true }).then(files => {
        const children = files.sort().map(child => {
          return this.browse(child, folderPath)
        })

        return Promise.all(children).then(children => {
          return new HashedFolder(stats, children.filter(c => typeof c !== 'undefined'))
        })
      })
    } else if (stats.isFile()) {
      return new Promise((resolve, reject) => {
        return resolve(new HashedFile(stats))
      })
    }

    console.error('browse cannot handle ', stats)
    return Promise.reject()
  }
}

class HashedFolder {
  private name: string
  private children: Array<HashedFolder>
  private stats: string

  constructor (stats: Dirent, children: Array<HashedFolder>) {
    this.name = stats.name.toLowerCase()
    this.children = children
    this.stats = JSON.stringify(stats)
  }

  toString (padding = ''): string {
    const first = `${padding}{"name": "${this.name}", "stats": ${this.stats},\n`
    padding += '  '
    return `${first}${padding}"children": ${this.childrenToString(padding)}},`
  }

  childrenToString (padding = ''): string {
    const length = this.children.length

    if (length === 0) {
      return '[]'
    } else {
      const nextPadding = padding + '  '
      const children = this.children.map((child, index) => {
        if (index + 1 === length && !child.children) {
          return child.toString(nextPadding).replace('},', '}')
        }
        return child.toString(nextPadding)
      }).join('\n')
      return `[\n${children}\n${padding}]`
    }
  }
}

class HashedFile {
  private name: string
  private hash: string

  constructor (stats: Dirent) {
    const name = stats.name.toLowerCase()
    this.name = name
    this.hash = md5(name)
  }

  toString (padding = ''): string {
    return `${padding}{"name": "${this.name}", "hash": "${this.hash}"},`
  }
}

const hasher = new Hasher(process.env.APP_FILES_PATH as string)
hasher.hash()
  .then(hash => {
    fs.promises.writeFile(path.resolve(process.cwd(), 'database.json'), hash.toString())
      .then(() => console.log('hash created'))
      .catch(error => console.error({ error }))
  })
  .catch(error => console.error({ error }))
