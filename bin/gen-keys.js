console.log('Generating a new key pair')

const { privateKey, publicKey } = await crypto.subtle.generateKey(
  'Ed25519',
  true,
  ['sign', 'verify']
)

const exportKeyForImport = async (key) => {
  const data = JSON.stringify(
    await crypto.subtle.exportKey('jwk', key)
  )
  const bytes = Buffer.from(data, 'utf-8')
  return bytes.toString('base64')
}

const exportedPrivateKey = await exportKeyForImport(privateKey)
const exportedPublicKey = await exportKeyForImport(publicKey)

console.log('PRIVATE KEY\n%s', exportedPrivateKey)
console.log('PUBLIC KEY\n%s', exportedPublicKey)

// NOTE(bajtos) There is no need to run this code as part of our CI. I found it useful while
// figuring out how to generate, export and import keys, and also how to sign & verify the payload.
// I am keeping this code around for the future where we may want to change the algorithm used
// for the signing identity.
if (process.env.TEST) {
  const assert = await import('node:assert')

  const priv = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(Buffer.from(exportedPrivateKey, 'base64').toString('utf-8')),
    'Ed25519',
    true,
    ['sign']
  )

  const pub = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(Buffer.from(exportedPublicKey, 'base64').toString('utf-8')),
    'Ed25519',
    true,
    ['verify']
  )

  const payload = Buffer.from('hello world')
  const sign1 = await crypto.subtle.sign('Ed25519', priv, payload)
  const sign2 = await crypto.subtle.sign('Ed25519', privateKey, payload)
  assert.strictEqual(
    Buffer.from(sign1).toString('hex'),
    Buffer.from(sign2).toString('hex')
  )

  assert.ok(await crypto.subtle.verify('Ed25519', publicKey, sign1, payload))
  assert.ok(await crypto.subtle.verify('Ed25519', pub, sign2, payload))
}
