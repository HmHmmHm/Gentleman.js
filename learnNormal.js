var fs = require('fs');
var readline = require('readline');
var normalWords = require('./dictionary/normal-words.json').dictionary;

var normalWordMap = {};

for (var index in normalWords)
    normalWordMap[normalWords[index]] = true;

console.log('TYPE THE YOU THINK ARE IT MIGHT BE');
console.log('NOT REGISTERED NORMAL WORDS.');
console.log("IF YOU TYPE THE 'SAVE' SO WILL BE JSON CHANGED.\n");

var line = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

line.on('line', (input) => {
    if (input.toLowerCase() == 'save') {
        let sortednormalWordMap = {};

        Object.keys(normalWordMap).sort().forEach(function(key) {
            sortednormalWordMap[key] = normalWordMap[key];
        });

        let list = [];
        for (var index in sortednormalWordMap) list.push(index);
        fs.writeFile('./dictionary/normal-words.json', JSON.stringify({
            dictionary: list
        }, null, 4));
        console.log('[DICTIONARY UPGRADED]');
        return;
    }

    if (typeof(normalWordMap[input]) == 'undefined') {
        normalWordMap[input] = true;
        console.log('[NEW WORD FOUNDED]');
    } else {
        console.log('[WORD HAS ALREADY FOUNDED]');
    }
});
