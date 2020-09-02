const fs = require('graceful-fs'),
    debug = require('debug'),
    minimatch = require('minimatch'),
    path = require('path'),
    md5 = require('md5'),
    dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
    encoding: 'utf8',
    debug: true
})

const options = {
    files: {
        exclude: [],
        include: [],
        matchBasename: true,
        matchPath: false,
        ignoreBasename: false,
        ignoreRootName: false
    },
    folders: {
        exclude: [],
        include: [],
        matchBasename: true,
        matchPath: false,
        ignoreBasename: false,
        ignoreRootName: false
    }
};

function hashElement(name, dir) {
    return parseParameters(arguments)
        .then(({ basename, dir, options }) => {
            options.skipMatching = true;
            return fs.promises.lstat(path.join(dir, basename))
                .then(stats => { stats.name = basename; return stats; })
                .then(stats => hashElementPromise(stats, dir, true));
        })
        .then(result => result)
        .catch(reason => {
            console.error('Fatal error:', reason);
            throw reason;
        });
}

function hashElementPromise(stats, dirname, isRootElement = false) {
    if (stats.isDirectory()) {
        return hashFolderPromise(stats, dirname, isRootElement);
    } else if (stats.isFile()) {
        return hashFilePromise(stats, dirname, isRootElement);
    } else {
        console.error('hashElementPromise cannot handle ', stats);
        return
    }
}

function hashFolderPromise(stats, dir, isRootElement = false) {
    const folderPath = path.join(dir, stats.name);
    let ignoreBasenameOnce = options.ignoreBasenameOnce;
    delete options.ignoreBasenameOnce;

    if (options.skipMatching) {
        delete options.skipMatching;
    }

    return fs.promises.readdir(folderPath, { withFileTypes: true }).then(files => {
        const children = files.sort().map(child => {
            return hashElementPromise(child, folderPath, options);
        });

        return Promise.all(children).then(children => {
            if (ignoreBasenameOnce) options.ignoreBasenameOnce = true;
            const hash = new HashedFolder(stats, children.filter(notUndefined), isRootElement);
            return hash;
        });
    });
}

function hashFilePromise(stats, dir, isRootElement = false) {
    return new Promise((resolve, reject) => {
        const hashedFile = new HashedFile(stats);
        return resolve(hashedFile);
    });
}

function parseParameters(args) {
    let basename = args[0], dir = args[1];

    if (!isString(basename)) {
        return Promise.reject(new TypeError('First argument must be a string'));
    }

    if (!isString(dir)) {
        dir = path.dirname(basename);
        basename = path.basename(basename);
    }

    options.files.exclude = reduceGlobPatterns(options.files.exclude);
    options.files.include = reduceGlobPatterns(options.files.include);
    options.folders.exclude = reduceGlobPatterns(options.folders.exclude);
    options.folders.include = reduceGlobPatterns(options.folders.include);

    return Promise.resolve({ basename, dir, options });
}

const HashedFolder = function HashedFolder(stats, children, isRootElement = false) {
    this.name = stats.name.toLowerCase();
    this.children = children;
    this.stats = JSON.stringify(stats)
};

HashedFolder.prototype.toString = function (padding = '') {
    const first = `${padding}{"name": "${this.name}", "stats": ${this.stats},\n`;
    padding += '  ';
    return `${first}${padding}"children": ${this.childrenToString(padding)}},`;
};

HashedFolder.prototype.childrenToString = function (padding = '') {
    const length = this.children.length;

    if (length === 0) {
        return '[]';
    } else {
        const nextPadding = padding + '  ';
        const children = this.children.map((child, index) => {
            if (index + 1 === length && !child.children) {
                return child.toString(nextPadding).replace('},', '}');
            }
            return child.toString(nextPadding)
        }).join('\n');
        return `[\n${children}\n${padding}]`;
    }
};

const HashedFile = function HashedFile(stats) {
    const name = stats.name.toLowerCase()
    this.name = name
    this.hash = md5(name)
};

HashedFile.prototype.toString = function (padding = '') {
    return `${padding}{"name": "${this.name}", "hash": "${this.hash}"},`
};

function isFunction(any) {
    return typeof any === 'function';
}

function isString(str) {
    return typeof str === 'string' || str instanceof String;
}

function notUndefined(obj) {
    return typeof obj !== 'undefined';
}

function reduceGlobPatterns(globs) {
    if (isFunction(globs)) {
        return globs;
    }
    else if (!globs || !Array.isArray(globs) || globs.length === 0) {
        return undefined;
    } else {
        // combine globs into one single RegEx
        const regex = new RegExp(globs.reduce((acc, exclude) => {
            return acc + '|' + minimatch.makeRe(exclude).source;
        }, '').substr(1));
        return param => regex.test(param);
    }
}

console.log(`creating hash over ${process.env.APP_FILES_PATH}`);
hashElement(process.env.APP_FILES_PATH)
    .then(hash => {
        fs.writeFile(path.resolve(process.cwd(), 'database.json'), hash.toString(), (error) => {
            if (error) return console.log(error);
            console.log('hash created');
        })
    })
    .catch(error => console.error('hashing failed:', error));
