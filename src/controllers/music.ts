import path from 'path'
import fs from 'graceful-fs'
import { Request, Response } from 'express'

interface files {
    name: string,
    stats?: string,
    hash?: string,
    children: Array<files>
}

const database = path.resolve(process.cwd(), 'database.json')

export const index = async (request: Request, response: Response) => {
    fs.promises.readFile(database, 'utf8')
        .then(data => response.json(JSON.parse(data)))
        .catch(error => {
            console.error({ error })
            return response.json({ error: "error while reading database" })
        })
}

export const show = async (request: Request, response: Response) => {
    const rows = await fs.promises.readFile(database, 'utf8')
    const files = JSON.parse(rows) as files
    const directory = files.children.find(d => d.name === request.params.directory.toLowerCase())

    if (directory) {
        const hash = request.params.hash
        if (hash) {
            const file = directory?.children.find(f => f.hash === hash);

            if (file) {
                const path = `${process.env.APP_FILES_PATH}/${directory.name}/${file.name}`
                return response.json({ path })
            }
            return response.status(404).json({ error: 'file not found !' });
        }

        return response.json(directory)
    }
    return response.status(404).json({ error: 'directory not found !' });
}
