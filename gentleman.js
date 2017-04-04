var fs = require('fs');

//사전데이터들을 배열형태로 저장해서 보관합니다. (json)
var badWords = [];
var normalWords = [];
var softSearchWords = [];

//빠른 비속어단어 확인을 위해 사전에
//단어목록을 한글자씩 조각내놓고 사용합니다.
var parsedBadWords = [];

//유동적인 비속어 목록 관리를 위해 이미 배열에
//특정 단어가 존재하는지를 확인하기위해 해시맵을 사용합니다.
var badWordsMap = {};
var normalWordsMap = {};
var softSearchWordsMap = {};

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
    },

    sortMap: (inputMap) => {
        let sortedMap = {};

        Object.keys(inputMap).sort().forEach((key) => {
            sortedMap[key] = inputMap[key];
        });

        return sortedMap;
    }
};

class Gentleman {

    static load(inputBadwords, inputDictionary, inputSoftSearchWords, disableAutoParse) {
        badWords = inputBadwords;
        normalWords = inputDictionary;
        softSearchWords = inputSoftSearchWords;

        if (disableAutoParse != false) {
            Gentleman.parse(badWords);
            Gentleman.mapping();
        }
    }

    static loadFile(badWordsPath, normalWordsPath, softSearchWordsPath) {
        let data = {
            badWords: require(badWordsPath).badwords,
            normalWords: require(normalWordsPath).dictionary,
            softSearchWords: require(softSearchWordsPath).badwords
        };
        Gentleman.load(data.badWords, data.normalWords, data.softSearchWords);
    }

    static defaultLoad() {
        let data = Gentleman.getDefaultData();
        Gentleman.load(data.badWords, data.normalWords, data.softSearchWords);
    }

    static parse() {
        parsedBadWords = [];
        for (let index in badWords)
            parsedBadWords.push(Utils.wordToArray(badWords[index]));
    }

    static mapping() {
        badWordsMap = {};
        normalWordsMap = {};
        softSearchWordsMap = {};

        for (let index in badWords)
            badWordsMap[badWords[index]] = true;
        for (let index in normalWords)
            normalWordsMap[normalWords[index]] = true;
        for (let index in softSearchWords)
            softSearchWordsMap[softSearchWords[index]] = true;
    }

    static sortBadWordsMap() {
        badWordsMap = Utils.sortMap(badWordsMap);
        badWords = [];
        for (var index in badWordsMap) badWords.push(index);
    }

    static sortNormalWordsMap() {
        normalWordsMap = Utils.sortMap(normalWordsMap);
        normalWords = [];
        for (var index in normalWordsMap) normalWords.push(index);
    }

    static sortSoftSearchWordsMap() {
        softSearchWordsMap = Utils.sortMap(softSearchWordsMap);
        softSearchWords = [];
        for (var index in softSearchWordsMap) softSearchWords.push(index);
    }

    static sortAll() {
        Gentleman.sortBadWordsMap();
        Gentleman.sortNormalWordsMap();
        Gentleman.sortSoftSearchWordsMap();
    }

    static getDefaultData() {
        return {
            badWords: require('./dictionary/bad-words.json').badwords,
            normalWords: require('./dictionary/normal-words.json').dictionary,
            softSearchWords: require('./dictionary/soft-search-words.json').badwords
        };
    }

    static getLoadedData() {
        return {
            badWords: badwords,
            normalWords: normalWords,
            softSearchWords: softSearchWords
        }
    }

    static saveAllData(badWordsPath, normalWordsPath, softSearchWordsPath, isAsync) {
        Gentleman.saveBadWordsData(badWordsPath, isAsync);
        Gentleman.saveNormalWordsData(normalWordsPath, isAsync);
        Gentleman.saveSoftSearchWordsData(softSearchWordsPath, isAsync);
    }

    static saveBadWordsData(path, isAsync) {
        Gentleman.sortBadWordsMap();

        let data = JSON.stringify({
            badwords: badWords
        }, null, 4);

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data);
    }

    static saveNormalWordsData(path, isAsync) {
        Gentleman.sortNormalWordsMap();

        let data = JSON.stringify({
            dictionary: normalWords
        }, null, 4);

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data);
    }

    static saveSoftSearchWordsData(path, isAsync) {
        Gentleman.sortSoftSearchWordsMap();

        let data = JSON.stringify({
            badwords: softSearchWords
        }, null, 4);

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data);
    }

    static isBad(message) {
        return Gentleman.find(message, false).length != 0;
    }

    static find(message, needMultipleCheck, splitCheck) {
        var totalResult = [];

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
        let unsafeMessage = message.toLowerCase();
        let foundedBadWords = [];

        for (let index in normalWords) {
            if (unsafeMessage.length == 0) break;
            unsafeMessage = Utils.replaceAll(unsafeMessage, normalWords[index], '');
        }

        //OTHER LANGUAGE BAD WORDS FIND ALGORITHM
        for (var otherLangBadWordsIndex in softSearchWords) {
            let otherLangBadWord = softSearchWords[otherLangBadWordsIndex];
            if (unsafeMessage.search(otherLangBadWord) != -1) {
                foundedBadWords.push(otherLangBadWord);
                if (!needMultipleCheck) return foundedBadWords;
            }
        }

        //KR BAD WORDS FIND ALGORITHM
        for (let index1 in parsedBadWords) {
            let badWord = parsedBadWords[index1];

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

    static isExistNormalWord(word) {
        return (typeof(normalWordsMap[word]) != 'undefined');
    }

    static addNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (word.length == 0) continue;

            if (Gentleman.isExistNormalWord(word)) continue;

            normalWordsMap[word] = true;
            normalWords.push(word);
        }
    }

    static deleteNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (!Gentleman.isExistNormalWord(word)) continue;

            delete(normalWordsMap[word]);

            for (let mapIndex = normalWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (normalWords[mapIndex] === word) {
                    normalWords.splice(mapIndex, 1);
                    break;
                }
            }
        }
    }

    static isExistBadWord(word) {
        return (typeof(badWordsMap[word]) != 'undefined');
    }

    static addBadWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (word.length == 0) continue;

            if (Gentleman.isExistBadWord(word)) continue;

            badWordsMap[word] = true;
            badWords.push(word);
        }
    }

    static deleteBadWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (!Gentleman.isExistBadWord(word)) continue;

            delete(badWordsMap[word]);

            for (let mapIndex = badWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (badWords[mapIndex] === word) {
                    badWords.splice(mapIndex, 1);
                    break;
                }
            }
        }
    }

    static isExistSoftSearchWord(word) {
        return (typeof(softSearchWordsMap[word]) != 'undefined');
    }

    static addSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (word.length == 0) continue;

            if (Gentleman.isExistSoftSearchWord(word)) continue;

            softSearchWordsMap[word] = true;
            softSearchWords.push(word);
        }
    }

    static deleteSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex];
            if (!Gentleman.isExistSoftSearchWord(word)) continue;

            delete(softSearchWordsMap[word]);

            for (let mapIndex = softSearchWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (softSearchWords[mapIndex] === word) {
                    softSearchWords.splice(mapIndex, 1);
                    break;
                }
            }
        }
    }
}

module.exports = Gentleman;
