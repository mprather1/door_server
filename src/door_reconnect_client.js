import Reconnect from 'reconnect-net'
import DuplexEmitter from 'duplex-emitter'

const hostname = process.argv[2]
const port = process.argv[3]
const timeoutSeconds = Number(process.argv[4])

let timeout
let warned = false

var reconnect = Reconnect(onConnect).connect(port, hostname)

reconnect.on('disconnect', () => {
  console.log('disconnected')
})

function onConnect (socket) {
  console.log('connected')
  const remoteEmitter = DuplexEmitter(socket)
  
  remoteEmitter.on('open', onOpen)
  remoteEmitter.on('close', onClose)
}

function onOpen () {
  timeout = setTimeout(onTimeout, timeoutSeconds * 1e3)
}

function onClose () {
  if (warned) {
    warned = false
    console.log('closed now')
  }
  if (timeout) {
    clearTimeout(timeout)
  }
}

function onTimeout () {
  warned = true
  console.error(
    'Door open for more thatn %d seconds',
    timeoutSeconds)
}