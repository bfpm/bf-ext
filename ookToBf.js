module.exports = function(ookContent) {
	const split = ookContent.toLowerCase().split(' ');
	if(split.length/2 !== Math.floor(split.length/2)) throw new Error('Non-matching count');

	const instructionArray = [];
  for(let i = 0; i < split.length; i+=2) {
		if(split[i] === 'ook. ook.') instructionArray.push('+');
		else if(split[i] === 'ook! ook!') instructionArray.push('-');
		else if(split[i] === 'ook. ook?') instructionArray.push('>');
		else if(split[i] === 'ook? ook.') instructionArray.push('<');
		else if(split[i] === 'ook! ook?') instructionArray.push('[');
		else if(split[i] === 'ook? ook!') instructionArray.push(']');
		else if(split[i] === 'ook! ook.') instructionArray.push('.');
		else if(split[i] === 'ook. ook!') instructionArray.push(',');
	}

	return instructionArray;
}
