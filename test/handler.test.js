import http from 'node:http'
import { once } from 'node:events'
import assert, { AssertionError } from 'node:assert'
import createDebug from 'debug'
import { createHandler } from '../lib/handler.js'

const debug = createDebug('test')

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  'Ed25519',
  true,
  ['sign', 'verify']
)

describe('Oracle API handler', () => {
  let baseUrl
  let server

  before(async () => {
    const handler = await createHandler({
      privateKey,
      logger: {
        info (...args) { debug(...args) },
        error (...args) { console.error(...args) }
      }
    })
    server = http.createServer(handler)
    server.listen()
    await once(server, 'listening')
    baseUrl = `http://127.0.0.1:${server.address().port}`
    server.unref()
  })

  after(async () => {
    server.closeAllConnections()
    server.close()
  })

  describe('GET /', () => {
    it('returns a group id with signature', async () => {
      const res = await fetch(baseUrl)
      await assertResponseStatus(res, 200)
      const body = await res.json()
      assert.deepStrictEqual(Object.keys(body), ['group', 'sig'])

      assert.ok(
        await crypto.subtle.verify(
          'Ed25519',
          publicKey,
          // signature
          Buffer.from(body.sig, 'base64'),
          // payload signed
          Buffer.from(body.group)
        ),
        'signature match'
      )
    })
  })
})

const assertResponseStatus = async (res, status) => {
  if (res.status !== status) {
    throw new AssertionError({
      actual: res.status,
      expected: status,
      message: await res.text()
    })
  }
}
