import http from 'node:http'
import { once } from 'node:events'
import { createHandler } from '../index.js'
import Sentry from '@sentry/node'
import fs from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const {
  PORT = 8080,
  HOST = '127.0.0.1',
  PRIVATE_KEY,
  SENTRY_ENVIRONMENT = 'development'
} = process.env

const pkg = JSON.parse(
  await fs.readFile(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      'package.json'
    ),
    'utf8'
  )
)

Sentry.init({
  dsn: 'https://bfdcbde3cbb19c7ca010b407cb9d7337@o1408530.ingest.sentry.io/4506058839162880',
  release: pkg.version,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: 0.1
})

if (!PRIVATE_KEY) {
  throw new Error('Env var PRIVATE_KEY is required')
}

const privateKey = await crypto.subtle.importKey(
  'jwk',
  JSON.parse(Buffer.from(PRIVATE_KEY, 'base64').toString('utf-8')),
  'Ed25519',
  true,
  ['sign']
)
const handler = await createHandler({ privateKey, logger: console })
const server = http.createServer(handler)
console.log('Starting the http server on host %j port %s', HOST, PORT)
server.listen(PORT, HOST)
await once(server, 'listening')
console.log(`http://${HOST}:${PORT}`)
