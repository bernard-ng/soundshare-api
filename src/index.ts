import path from 'path'
import dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import ErrorMiddleware from './middlewares/error'

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  encoding: 'utf8',
  debug: true
})

const app = express()
const port = process.env.APP_PORT || 3000

app.get('/home', (request: Request, response: Response) => response.send('hello'))
app.get('*', (request: Request, response: Response) => response.redirect('/home'))

app.use(ErrorMiddleware)
app.listen(port, () => console.log(`soundshare api is up and running on port : ${port}`))
