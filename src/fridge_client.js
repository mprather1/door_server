import Mux from 'mux-demux'
import Reconnect from 'reconnect-net'
import DuplexEmitter from 'duplex-emitter'

const hostname = process.argv[2]
const port = Number(process.argv[3])
const doorTimeOutSeconds = Number(process.argv[4])
const maxTemperature = Number(process.argv[5])

const reconnect = Reconnect(onConnect).connect(port, hostname)

const sensors = {
  'door': handleDoor,
  'temperature': handleTemperature
}

function onConnect (socket) {
  const mx = Mux(onStream)
  socket.pipe(mx).pipe(socket)
  
  function onStream (stream) {
    const handle = sensors[stream.meta]
    if (! handle) {
      throw new Error('Unknown stream %j', stream.meta)
    }
    handle(DuplexEmitter(stream))
  }
}

function handleDoor (door) {
  let timeout
  let warned = false
  
  door.on('open', onDoorOpen)
  door.on('close', onDoorClose)
  
  function onDoorOpen () {
    timeout = setTimeout(onDoorTimeout, doorTimeOutSeconds * 1e3)
  }
  
  function onDoorClose () {
    if (warned) {
      warned = false
      console.log('closed now')
    }
    if (timeout) {
      clearTimeout(timeout)
    }
  }
  
  function onDoorTimeout () {
    warned = true
    console.error(
      'Door open for longer than %d seconds',
      doorTimeOutSeconds)
  }
}

function handleTemperature (temperature) {
  temperature.on('reading', onTemperatureReading)
  
  function onTemperatureReading (temp, units) {
    if (temp > maxTemperature) {
      console.error('Fridge is too hot: %d %s', temp, units)
    }
  }
}