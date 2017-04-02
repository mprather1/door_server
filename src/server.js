import net from 'net'
import DuplexEmitter from 'duplex-emitter'
import door from './door'

const server = net.createServer()

server.on('connection', handleConnection)

server.listen(8000, () => {
  console.log('listening on %j', server.address())
})

// door state

let open = false
let lastEventTime

door.on('open', onOpen)
door.on('close', onClose)

function onOpen (time) {
  open = true
  lastEventTime = time
}

function onClose (time) {
  open = false
  lastEventTime = time
}

// handleConnections

var nextId = 0
var emitters = {}

function handleConnection (socket) {
  const remoteEmitter = DuplexEmitter(socket)
  let id = ++ nextId
  emitters[id] = remoteEmitter
  
  socket.once('close', onClose)
  socket.on('error', onError)
  
  if (lastEventTime) {
    remoteEmitter.emit(open ? 'open' : 'close', lastEventTime)
  }
  
  function onClose () {
    delete emitters[id]
  }

  function onError (err) {
    console.error('Error on connection: ' + err.message)
  }
}

door.on('open', broadcast('open'))
door.on('close', broadcast('close'))

function broadcast (event) {
  return function () {
    const args = Array.prototype.slice.call(arguments)
    args.unshift(event)

  
    Object.keys(emitters).forEach((emitterId) => {
      const emitter = emitters[emitterId]
      emitter.emit.apply(emitter, args)
    })
  }
}
