const keypress = require('keypress');
const EventEmitter = require('events').EventEmitter;

class EventArray extends EventEmitter {
  constructor(array) {
    super();
    this.array = array || [];
  }

  get(i) {
    return this.array[i];
  }
  set(i, val) {
    this.array[i] = val;
  }

  get length() {
    return this.array.length;
  }

  get raw() {
    return this.array;
  }
}

Object.getOwnPropertyNames(Array.prototype)
.filter(f => typeof Array.prototype[f] === 'function' && typeof EventArray[f] === 'undefined')
.forEach(f => {
  EventArray.prototype[f] = function() {
    const val = this.array[f].apply(this.array, arguments);
    this.emit(f, Object.values(arguments));
    return val;
  }
});

module.exports = class KeyQueue {
  constructor(tick) {
		this.tick = tick;
		this.flag = false;
		this.keyQueue = new EventArray();

		if(this.tick != null) {
			setInterval(() => {
				if(this.flag === false) this.keyQueue.push('\u0000');
				this.flag = false;
			}, this.tick);
		}

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
      // console.log(key);
      // console.log(ch.charCodeAt(0));
			this.flag = true;
      this.keyQueue.push(ch);
      if(key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
        process.exit();
      }
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  getInput() {
    if(this.keyQueue.length > 0) {
      let kC = this.keyQueue.shift().charCodeAt(0);
      return Promise.resolve(kC);
    } else {
      return new Promise((resolve, reject) => {
        this.keyQueue.once('push', added => {
          let kC = this.keyQueue.shift().charCodeAt(0);
          resolve(kC);
        });
      });
    }
  }

  stop() {
    process.stdin.pause();
  }
}
