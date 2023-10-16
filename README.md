# group-oracle

An oracle mapping IPv4 /24 subnet into a group id

## Why?

In [SPARK](https://github.com/filecoin-station/spark), we want to use IPv4 as a scarce resource.
However, IP addresses are considered as a personal information. Extra considerations are required
to implement a collection process that's compliant with GDPR & CCPA.

Furthermore, SPARK measurements are recorded in IPFS & on chain and publicly available, which
amplifies the privacy problems.

At the same time, the SPARK protocol does not need to know the actual IPv4 /24 subnet. All we need
is a mapping function `oracle(ip_addres) -> group_id` that meets the following requirements:

- For the duration of a single SPARK round, the service returns:
  1. the same `group_id` value for all IPv4 addresses in the same /24 subnet
  2. different `group_id` values for IPv4 addresses in different /24 subnets

- The service does not collect IPv4 address (in logs, persistent storage, etc.)

The first requirement is "soft". If the service restarts during a SPARK round and then starts
issuing different group ids to the same subnets compared to group ids issues before the restart,
this behavior is acceptable as long as the restarts don't happen too often.

## Basic use

```
curl 'https://spark-group-oracle.fly.io/'
{"group": "SoMeId", "sig": "ECDSA signature" }
```

How to validate the signature JavaScript:

```js
await crypto.subtle.verify(
  'Ed25519',
  publicKey,
  // signature
  Buffer.from(body.sig, 'base64'),
  // payload signed
  Buffer.from(body.group)
)
```

## Development

Start the API service:

```bash
PRIVATE_KEY=YourPrivateKey npm start
```

Run tests and linters:

```bash
npm test
```

## Managing identities

Generate a new private & public key:

```bash
node bin/gen-keys.js
```

Use the private key to configure Fly.io secrets used for group-oracle deployment.

Use the public key to configure Fly.io secrets used by spark-evaluate deployment.

## Deployment

Pushes to `main` will be deployed automatically.

Perform manual devops using [Fly.io](https://fly.io):

```bash
$ fly deploy
```
