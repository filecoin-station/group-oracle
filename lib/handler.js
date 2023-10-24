import { json } from 'http-responders'
import { mapRequestToInetGroup } from './inet-grouping.js'

export const createHandler = async ({ privateKey, logger }) => {
  return (req, res) => {
    const start = new Date()
    logger.info(`${req.method} ${req.url} ...`)
    handler(req, res, privateKey, logger)
      .catch(err => errorHandler(res, err, logger))
      .then(() => {
        logger.info(`${req.method} ${req.url} ${res.statusCode} (${new Date() - start}ms)`)
      })
  }
}

const handler = async (req, res, privateKey, logger) => {
  if (req.url !== '/' || req.method !== 'GET') {
    return notFound(res)
  }

  const group = mapRequestToInetGroup(req)
  const sig = await crypto.subtle.sign('Ed25519', privateKey, Buffer.from(group))
  json(res, {
    group,
    sig: Buffer.from(sig).toString('base64')
  })
}

const errorHandler = (res, err, logger) => {
  if (err instanceof SyntaxError) {
    res.statusCode = 400
    res.end('Invalid JSON Body')
  } else if (err.statusCode) {
    res.statusCode = err.statusCode
    res.end(err.message)
  } else {
    logger.error(err)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
}

const notFound = (res) => {
  res.statusCode = 404
  res.end('Not Found')
}
