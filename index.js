const fs = require('fs');
const minimist = require('minimist');

const KeyQueue = require('./KeyQueue.js');
const keyQueue = new KeyQueue();

const transcoder = require('./transcoder');

function validateBrackets(instructions) {
  return instructions.reduce((a, e) => {
    if(e === '[') return ++a;
    else if(e === ']') return --a;
    else return a;
  }, 0) === 0;
}

function condense(instructions) {
  const newSet = [];
  let isCellChange = false;
  let isCellMove = false;
  let elementCounter = 0;
  instructions.forEach((e, i, a) => {
    if(isCellChange) {
      if(e === '+' || e === '-') {
        elementCounter += (e === '+' ? 1 : -1);
      } else {
        if(elementCounter !== 0) {
          newSet.push('+', elementCounter);
          elementCounter = 0;
        }
        isCellChange = false;
      }
    } else if(isCellMove) {
      if(e === '>' || e === '<') {
        elementCounter += (e === '>' ? 1 : -1);
      } else {
        if(elementCounter !== 0) {
          newSet.push('>', elementCounter);
          elementCounter = 0;
        }
        isCellMove = false;
      }
    }

    if(e === '+' || e === '-') {
      if(isCellChange) return;
      isCellChange = true;
      elementCounter = (e === '+' ? 1 : -1);
    } else if(e === '>' || e === '<') {
      if(isCellMove) return;
      isCellMove = true;
      elementCounter = (e === '>' ? 1 : -1);
    } else {
      newSet.push(e);
    }
  });
  return newSet;
}

async function init() {
  const argv = minimist(process.argv.slice(2), {alias: {'input': 'i', 'length': 'l', 'debug': 'd', 'speed': 's'}, default: {'input': 'main.b', 'length': 30000, 'speed': 0}});
  argv.l = (typeof argv.l === 'number' && argv.l > 0) ? argv.l : 30000;
  argv.s = (typeof argv.s === 'number' && argv.s >= 0) ? argv.s : 0;

  const contents = condense(fs.readFileSync(argv.i, 'utf8').split('').filter(e => ['+', '-', '.', ',', '[', ']', '>', '<'].includes(e)));

  if(!validateBrackets(contents)) throw new Error('Non matching brackets');

  const tape = Buffer.alloc(argv.l, 0);

  const loopStack = [];

  let progCount = 0;
  let tapeCount = 0;

  if(argv.d) console.log('tapeCount |', 'tape |', 'instruction |', 'next instruction |', 'instruction length |', 'program counter');

  while(progCount < contents.length) {
    const instruction = contents[progCount];
    const next = contents[progCount + 1];
    if(argv.d) console.log(tapeCount, tape[tapeCount], instruction, next, contents.length, progCount);
    if(instruction === '+') {
      tape[tapeCount] += next;
      progCount++;
    } else if(instruction === '>') {
      tapeCount = (tapeCount + (tape.length * Math.abs(next)) + next) % tape.length;
      progCount++;
    } else if(instruction === '[') {
      if(tape[tapeCount] === 0) {
        progCount = contents.indexOf(']', progCount);
      } else {
        loopStack.push(progCount);
      }
    } else if(instruction === ']') {
      if(tape[tapeCount] !== 0) {
        progCount = loopStack[loopStack.length - 1];
      } else {
        loopStack.pop();
      }
    } else if(instruction === '.') {
      // console.log(transcoder.asciiToUnicode(tape[tapeCount]));
      process.stdout.write(String.fromCharCode(transcoder.asciiToUnicode(tape[tapeCount])));
    } else if(instruction === ',') {
      tape[tapeCount] = transcoder.unicodeToAscii(await keyQueue.getInput());
    }
    progCount++;
    if(argv.s > 0) {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, argv.s);
      });
    }
  }
  keyQueue.stop();
}
init().catch(error => {
  return console.error(error);
});
