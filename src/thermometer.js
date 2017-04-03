import {EventEmitter} from 'events'

const thermometer = new EventEmitter()

export default thermometer

function emitLater () {
  setTimeout(() => {
    thermometer.emit('reading', Math.random() * 20, 'C')
    emitLater()
  }, Math.floor(Math.random() * 5000))
}

emitLater()