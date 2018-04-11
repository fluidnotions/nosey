const argv = require('minimist')(process.argv.slice(2))
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
var _ = require('lodash')

let sneezeConfig = {};
if (argv.isbase) {
  sneezeConfig = { isbase: true };
}
let joinConfig = {};
if (argv.name) {
  joinConfig = { name: argv.name };
}

console.log("Starting...")

const ipfs = new IPFS({
  repo: `./orbitdb/ipfs/${joinConfig.name}`,
  start: true,
  EXPERIMENTAL: {
    pubsub: true,
  },
  config: {
    Bootstrap: []
  }
})

var sneeze = require('sneeze')(sneezeConfig)
sneeze.join(joinConfig)


const userId = 1
const creatures = ['one', 'two', 'three']

//eg: /ip4/104.236.176.52/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z
const buildIpfsMultiAddressString = (evt, ipfsIdentity) => {
  let sneezeIpDetails = evt.identifier$.split('~')[0];
  let host = sneezeIpDetails.split(':')[0];
  console.log(`[sneeze] ip:${host} port:${sneezeIpDetails.split(':')[1]}`)
  return `/ip4/${host}/tcp/4001/ipfs/${ipfsIdentity.id}`
}

const connectPeer = (sneezeEvt) => {
  return ipfs.id()
    .then((err, identity) => {
      if (err) {
        throw err
      }
      console.log("self identity: ", identity)
      return ipfs.swarm.connect(buildIpfsMultiAddressString(sneezeEvt, identity))
    })
    .then(() => console.log('Woohoo, added a peer to my swarm!'))
    .catch(error => console.error('Failed to connect!', error))
}

const disconnectPeer = (sneezeEvt) => {
  return ipfs.id()
    .then((err, identity) => {
      if (err) {
        throw err
      }
      console.log("self identity: ", identity)
      return ipfs.swarm.disconnect(buildIpfsMultiAddressString(sneezeEvt, identity))
    })
    .then(() => console.log('Woohoo, removed a peer to my swarm!'))
    .catch(error => console.error('Failed to disconnect!', error))
}

ipfs.on('error', (err) => console.error(err))
ipfs.on('ready', async () => {

  sneeze.on('add', (evt) => {
    // console.log('add', evt)
    connectPeer(evt)
  })
  sneeze.on('remove', (evt) => {
    // console.log('remove', evt)
    disconnectPeer(evt)
  })

  try {
    const orbitdb = new OrbitDB(ipfs, `./orbitdb/example`)

  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})





