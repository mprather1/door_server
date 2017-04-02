import {EventEmitter} from 'events'

const door = new EventEmitter()

export default door

let open = false

function emitLater () {
  setTimeout(() => {
    open = ! open
    let event = open ? 'open' : 'close'
    door.emit(event, Date.now())
    
    emitLater()
  }, Math.floor(Math.random() * 5000))
}

emitLater()