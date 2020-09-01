import { NextFunction, Request, Response } from 'express'

export default function (error: any, request: Request, response: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }

  if (error.name === 'UnauthorizedError') {
    return response.status(403).send(error.message)
  }

  console.log(error.name)
  return response.send('Une erreur est survenue')
}
