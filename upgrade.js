var fs = require('fs');
var readline = require('readline');
var badWords = require('./dictionary/bad-words.json').badwords;

var badWordMap = {};

for (var index in badWords)
    badWordMap[badWords[index]] = true;

console.log('TYPE THE YOU THINK ARE IT MIGHT BE');
console.log('NOT REGISTERED BAD WORDS.');
console.log("IF YOU TYPE THE 'SAVE' SO WILL BE JSON CHANGED.\n");

var line = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

line.on('line', (input) => {
    if (input.toLowerCase() == 'save') {
        let sortedBadWordMap = {};

        Object.keys(badWordMap).sort().forEach(function(key) {
            sortedBadWordMap[key] = badWordMap[key];
        });

        let list = [];
        for (var index in sortedBadWordMap) list.push(index);
        fs.writeFile('./dictionary/bad-words.json', JSON.stringify({
            badwords: list
        }, null, 4));
        console.log('[DICTIONARY UPGRADED]');
        return;
    }

    if (typeof(badWordMap[input]) == 'undefined') {
        badWordMap[input] = true;
        console.log('[NEW WORD FOUNDED]');
    } else {
        console.log('[WORD HAS ALREADY FOUNDED]');
    }
});
