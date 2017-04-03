import net from 'net'
import DuplexEmitter from 'duplex-emitter'
import Mux from 'mux-demux'
import door from './door'
import thermometer from './thermometer'

const server = net.createServer()

server.on('connection', handleConnection)

server.listen(8000, () => {
  console.log('door server listening on %j', server.address())
})

var sensors = [
  {
    name: 'door',
    events: ['open', 'close'],
    emitter: door,
    remotes: {},
    nextId: 0,
    lastEvent: undefined
  },
  {
    name: 'temperature',
    events: ['reading'],
    emitter: thermometer,
    remotes: {},
    nextId: 0,
    lastEvent: undefined
  }
]

function handleConnection (socket) {
  const mx = Mux()
  
  socket.on('error', onError)
  mx.on('error', onError)
  
  socket.pipe(mx).pipe(socket)
  
  sensors.forEach(attachSensor)
  
  function attachSensor (sensor) {
    var stream = mx.createWriteStream(sensor.name)
    const remoteEmitter = DuplexEmitter(stream)
    
    stream.once('close', onClose)
    stream.on('erreor', onError)
    mx.on('error', onError)
    
    var id = ++ sensor.nextId
    sensor.remotes[id] = remoteEmitter
    
    if (sensor.lastEvent) {
      remoteEmitter.emit.apply(remoteEmitter, sensor.lastEvent)
    }
    
    function onClose () {
      delete sensor.remotes[id]
    }
  }
  
  function onError (err) {
    socket.destroy()
    console.error('Error on connection: ' + err.message)
  }
}

sensors.forEach(function (sensor) {
  sensor.events.forEach(function (event) {
    sensor.emitter.on(event, broadcast(event, sensor.remotes))
    
    sensor.emitter.on(event, function () {
      var args = Array.prototype.slice.call(arguments)
      args.unshift(event)
      sensor.lastEvent = args
    })
  })
})

function broadcast (event, remotes) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    args.unshift(event)
    
    Object.keys(remotes).forEach((emitterId) => {
      const remote = remotes[emitterId]
      remote.emit.apply(remote, args)
    })
  }
}