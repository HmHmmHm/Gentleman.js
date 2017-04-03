var badWords = [];
var normalWords = "";

var checkLoad = false;

var Utils = {
    escape: (text) => {
        return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },

    replaceAll: (message, search, replace) => {
        return message.replace(new RegExp(search, 'gi'), replace);
    },

    wordToArray: word => {
        let wordArray = [];
        for (let i = 0; i <= word.length - 1; i++) {
            wordArray[i] = word[i];
        }
        return wordArray;
    }
};

class Gentleman {
    static load() {
        let preBadWords = require('./dictionary/bad-words.json').badwords;
        for (var index in preBadWords) {
            badWords.push(Utils.wordToArray(preBadWords[index]));

        }
        normalWords = require('./dictionary/normal-words.json').dictionary;
    }

    static isBad(message){
        return Gentleman.find(message) != null;
    }

    static find(message, needMultipleCheck) {
        if (!checkLoad) {
            checkLoad = true;
            Gentleman.load();
        }

        let unsafeMessage = message;
        let foundedBadWords = [];

        for (let index in normalWords) {
            if (unsafeMessage.length == 0) break;
            unsafeMessage = Utils.replaceAll(unsafeMessage, normalWords[index], '');
        }

        for (let index1 in badWords) {
            let badWord = badWords[index1];

            let wordLength = badWord.length;
            let findCount = {};

            for (let index2 in badWord) {
                let badOneCharacter = String(badWord[index2]).toLowerCase();
                for (let index3 in unsafeMessage) {
                    let unsafeOneCharacter = String(unsafeMessage[index3]).toLowerCase();
                    if (badOneCharacter == unsafeOneCharacter) {
                        findCount[badOneCharacter] = true;
                        break;
                    }
                }

                if (wordLength == Object.keys(findCount).length) {
                    if(needMultipleCheck != true) return badWord.join('');
                    foundedBadWords.push(badWord.join(''));
                }
            }
        }

        if(needMultipleCheck != true) return null;
        return foundedBadWords;
    }

    static fix(message, replaceCharacter){
        let fixedMessage = message;
        let foundedBadWords = Gentleman.find(message, true);

        replaceCharacter = (replaceCharacter === undefined) ? '*' : replaceCharacter;
        for(let index1 in foundedBadWords){
            let foundedBadWord = Utils.wordToArray(foundedBadWords[index1]);

            for(let index2 in foundedBadWord){
                let foundedBadOneCharacter = foundedBadWord[index2];
                fixedMessage = Utils.replaceAll(fixedMessage, foundedBadOneCharacter, replaceCharacter);
            }
        }
        return fixedMessage;
    }
}

module.exports = Gentleman;
