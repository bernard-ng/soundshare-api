import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import morgan from 'morgan'
import express, {Request, Response} from 'express'
import ErrorMiddleware from './middlewares/error'

import * as MusicController from './controllers/music'

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  encoding: 'utf8',
  debug: true
})

const app = express()
const port = process.env.APP_PORT || 3000
const host = process.env.APP_HOST || '0.0.0.0'

// middlewares
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

// routes
app.get('/music', MusicController.index)
app.get('/music/:directory/:hash?', MusicController.show)
app.get('*', (request: Request, response: Response) => response.redirect('/music'))

app.use(ErrorMiddleware)
app.listen(port as number, host, () => console.log(`soundshare api is up and listening => ${host}:${port}`))
