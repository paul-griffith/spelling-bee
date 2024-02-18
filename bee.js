const synth = window.speechSynthesis;

let numWords = 0;
let practiceWords = [];
let currentWord = '';
let results = [];
let englishVoices = [];
let currentVoice = undefined;

function loadWordList() {
    numWords = Math.min(document.getElementById('numWords').value, wordList.length);
    practiceWords = wordList.toSorted(() => 0.5 - Math.random()).slice(0, numWords);
    if (practiceWords.length > 0) {
        startPractice();
    }
}

function startPractice() {
    document.getElementById('landing').classList.replace("show", "hide");
    document.getElementById('currentWord').classList.replace("hide", "show");
    nextWord();
    document.addEventListener('keydown', handleKeyPress);
}

function nextWord() {
    if (practiceWords.length > 0) {
        currentWord = practiceWords.pop();
        let wordDisplay = document.getElementById('wordDisplay');
        wordDisplay.classList.add("blur");
        wordDisplay.innerText = currentWord;
        say(currentWord);
        document.getElementById('controls').classList.replace("hide", "show");
        document.getElementById('reveal').classList.replace("hide", "show");
        let fetchDef = fetchWordDefinition(currentWord);
        fetchDef.then((definitions) => {
            const firstDefinition = definitions?.[0]?.["meanings"]?.flatMap(meaning => meaning["definitions"])?.[0];
            const definition = firstDefinition?.["definition"] ?? "N/A";
            const sentence = firstDefinition?.["example"] ?? "N/A";

            document.getElementById('definition').innerHTML = `<b>Definition: </b>${definition}`;
            document.getElementById('sentence').innerHTML = `<b>Sentence: </b>${sentence}`;
        });
    } else {
        finishPractice();
    }
}

function markWord(correct) {
    results.push({word: currentWord, correct: correct});
    nextWord();
}

function finishPractice() {
    document.removeEventListener('keydown', handleKeyPress);
    document.getElementById('controls').classList.replace("show", "hide");
    document.getElementById('currentWord').classList.replace("show", "hide");
    displayResults();
    say(`Good job! ${results.filter(result => result.correct).length} correct out of ${numWords}`);
}

function loadVoices() {
    englishVoices = synth.getVoices().filter(value => value.lang === 'en-US');

    for (let i = 0; i < englishVoices.length; i++) {
        const voice = englishVoices[i];

        const option = document.createElement("option");
        option.textContent = `${voice.name} (${voice.lang})`;
        option.value = i;
        document.getElementById("voiceSelector").appendChild(option);
    }
}

// in Google Chrome the voices are not ready on page load
if ("onvoiceschanged" in synth) {
    synth.onvoiceschanged = loadVoices;
} else {
    loadVoices();
}

function selectVoice() {
    currentVoice = englishVoices[document.getElementById("voiceSelector").value];
}

function say(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = currentVoice;
    utterance.rate = 0.8;
    synth.speak(utterance);
}

function repeatWord() {
    say(currentWord);
}

function revealWord() {
    document.getElementById("wordDisplay").classList.remove("blur");
    document.getElementById("reveal").classList.replace("show", "hide");
}

async function fetchWordDefinition(word) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) {
        return {};
    }
    return response.json();
}

function handleKeyPress(event) {
    if (event.key === 'ArrowRight') {
        markWord(true);
    } else if (event.key === 'ArrowLeft') {
        markWord(false);
    } else if (event.key === 'ArrowUp') {
        repeatWord();
    } else if (event.key === 'ArrowDown') {
        revealWord();
    }
}

function displayResults() {
    const correctWords = [
        "<b>Correct</b>",
        ...results.filter(result => result.correct).map(result => result.word),
    ];
    const incorrectWords = [
        "<b>Incorrect</b>",
        ...results.filter(result => !result.correct).map(result => result.word),
    ];
    document.getElementById('correct').innerHTML = correctWords.join('<br>');
    document.getElementById('incorrect').innerHTML = incorrectWords.join('<br>');
    document.getElementById('resultsTable').style.display = 'flex';
}
