var badWords = [];
var normalWords = [];
var softSearchWords = [];

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
    },

    lengthSplit: (message, limit) => {
        if (message.length <= limit) return [message];

        let fixedMessage = [];
        let fullMessageLength = message.length;
        let currentLength = 0;

        let splitList = [];
        while (true) {
            if (currentLength == fullMessageLength) {
                if (currentLength != 0 && splitList.length != 0) {
                    fixedMessage.push(splitList.join(''));
                    splitList = [];
                }
                break;
            }
            if (currentLength != 0 && currentLength % limit == 0 && splitList.length != 0) {
                fixedMessage.push(splitList.join(''));
                splitList = [];
            }
            splitList.push(message[currentLength]);
            currentLength++;
        }

        return fixedMessage;
    }
};

class Gentleman {
    static load() {
        let preBadWords = require('./dictionary/bad-words.json').badwords;
        for (var index in preBadWords)
            badWords.push(Utils.wordToArray(preBadWords[index]));
        normalWords = require('./dictionary/normal-words.json').dictionary;
        softSearchWords = require('./dictionary/soft-search-words.json').badwords;
    }

    static isBad(message) {
        return Gentleman.find(message, false).length != 0;
    }

    static find(message, needMultipleCheck, splitCheck) {
        var totalResult = [];
        
        //OTHER LANGUAGE BAD WORDS FIND ALGORITHM
        for (var otherLangBadWordsIndex in softSearchWords){
            let otherLangBadWord = softSearchWords[otherLangBadWordsIndex];
            if(message.search(otherLangBadWord) != -1){
                totalResult.push(otherLangBadWord);
                if(!needMultipleCheck) return totalResult;
            }
        }

        //KR BAD WORDS FIND ALGORITHM
        if (splitCheck === undefined) splitCheck = 15;
        var messages = (splitCheck != 0) ? Utils.lengthSplit(message, splitCheck) : [message];

        for (var index1 = 0; index1 <= messages.length - 1; index1++) {
            let currentResult = Gentleman.nativeFind(messages[index1], needMultipleCheck);

            if (needMultipleCheck) {
                for (var index2 = 0; index2 <= currentResult.length - 1; index2++)
                    if (currentResult !== null)
                        totalResult.push(currentResult[index2]);
            } else {
                if (currentResult !== null)
                    totalResult.push(currentResult);
            }
        }
        return totalResult;
    }

    static nativeFind(message, needMultipleCheck) {
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
                    if (needMultipleCheck != true) return badWord.join('');
                    foundedBadWords.push(badWord.join(''));
                }
            }
        }

        if (needMultipleCheck != true) return null;
        return foundedBadWords;
    }

    static fix(message, replaceCharacter) {
        let fixedMessage = message;
        let foundedBadWords = Gentleman.find(message, true);

        replaceCharacter = (replaceCharacter === undefined) ? '*' : replaceCharacter;
        for (let index1 in foundedBadWords) {
            let foundedBadWord = Utils.wordToArray(foundedBadWords[index1]);

            for (let index2 in foundedBadWord) {
                let foundedBadOneCharacter = foundedBadWord[index2];
                fixedMessage = Utils.replaceAll(fixedMessage, foundedBadOneCharacter, replaceCharacter);
            }
        }
        return fixedMessage;
    }
}

module.exports = Gentleman;
