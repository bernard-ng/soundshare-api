# soundshare-api (study and reseach projet)

## The Problem :
working on a linux computer, I wanted to play my audio files from my phones (ios and android) without having to duplicate the files on other devices.

## Current Solution : 
I decided to distribute my files with an api rest on my local network. 
I just have to connect my other devices on the network to access my files.

To avoid a file reading for each http request, I created a json database which is basically a hash of the root folder structure of the files to distribute.
something like :

```json
{
  "name": "laurendaigle", 
  "stats": {"name":"LaurenDaigle"},
  "children": [
    {"name": "00 - you say (piano karaoke instrumental) lauren daigle.mp3.mp3", "hash": "e36fde6c4420ba2d915167ee9b67f69f"},
    {"name": "lauren daigle - everything (audio).mp3", "hash": "e35a1fee3659fa7de0262f3bceaf3d9b"},
    {"name": "lauren daigle - inevitable (audio).mp3", "hash": "a074ef4605856b2a7a890698685ac547"},
    {"name": "lauren daigle - look up child (audio).mp3", "hash": "ebd773b38dd94d5b57e41b317235d1d5"},
    ...
  ]
}
```

This avoids me to browse my files for each request, which increases performance, this database can also be stored on redis to be even faster. 
to generate the database just type the command :

```bash
$ yarn build
$ node dist/hash.js
```

this command will generate a ```database.json``` file at the root of the projet which will be the database used for the api.

create a ```.env``` conforming to ```.env.example``` and than run the following command to start the api server

```bash
$ yarn start
```
