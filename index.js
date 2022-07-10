const XMLHttpRequest = require('xhr2');
const intl = require('intl');
const { PassthroughValidator } = require('@sapphire/shapeshift');
const { time, count } = require('console');
const Discord = require('discord.js');
const config = require("./key.json")
const fs = require('fs');

const miliToSec = 1000;
const secPerTurn = 30;
const rounds = 10;
const gameTypes = ["!flags", "!capitals", "!population"];


var inGame = false;
var now = new Date();
var lastSavedTime = new Date();
var correctAnswer = [""];
var currentGame = {};
var actionInterval;
var geoChannel;
var data;

//const intents = new Discord.Intents(8);

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"]});

client.on("ready", function() {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "https://restcountries.com/v3.1/all", true); 
	xhttp.send();
	xhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			data = JSON.parse(this.responseText);
			return;
		}
	}
    console.log("online!!\n");
    return;
});



client.on("messageCreate", (message) => {
    if (message.author.bot) {return;}

    if (message.channel.name != "geo-trivia") {return;}

    message.content = message.content.toLowerCase();

    geoChannel = message.channel;

    now = new Date();

    console.log(`Message: "${message.content}" recieved from user: ${message.author.username} at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);


    if (!inGame && gameTypes.includes(message.content)) {
        inGame = true;
        console.log("starting new game");
        startGame(message.author.username, message.content.slice(1));
        return;
    } else {
        if (message.author.username != currentGame.player) {
            return;
        }

        for (let i = 0; i < correctAnswer.length; i++) {
            if (message.content.toLowerCase() == correctAnswer[i].toLowerCase()) {
                currentGame.score++;
                currentGame.turn++;
                geoChannel.send("Thats correct!");
                poseQuestion();
            } else {
                currentGame.turn++;
                geoChannel.send("Thats incorrect!");
                geoChannel.send(`correct answer(s) was/were: ${correctAnswer}`);
                poseQuestion();
            } 
        }
        
    }
});

function startGame(Author, gameType) {
    currentGame = {
        gameStart : new Date(),
        player    : Author,
        type      : gameType,
        score     : 0,
        turn      : 0,
    };

    actionInterval = setInterval(endInterval, secPerTurn * miliToSec);
    poseQuestion();
}

function endInterval() {
    geoChannel.send("Times up!");
    geoChannel.send(`correct answer was: ${correctAnswer}`);
    currentGame.turn++;
    poseQuestion();
}

function resetInterval() {
    clearInterval(actionInterval);
    actionInterval = setInterval(endInterval, secPerTurn * miliToSec);
}

function poseQuestion() {
    if (currentGame.turn >= rounds) {
        endGame();
        return;
    }


    switch(currentGame.type) {
        case "flags":
            flagGameTurn();
            break;

        case "capitals":
            capitalsGameTurn();
            break;

        case "population":
            populationGameTurn();
            break;

        default:
            geoChannel.send("unknown error occured, Nick screwed up somehow");
            endGame();
            break;
    }
    resetInterval();
}

function endGame() {
    geoChannel.send(`\`\`\`ending game with: "${currentGame.player}", Final Score: ${currentGame.score} / ${rounds}\`\`\``);
    inGame = false;
    clearInterval(actionInterval);
    let data = currentGame;

    fs.readFile('Data.json', function (err, readData) {
        if (readData == "") {
            var json = [];
        } else {
            var json = JSON.parse(readData)
        }
        
        json.push(data)
    
        fs.writeFile("Data.json", JSON.stringify(json, null, 2), function(err){
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
            console.log();
          });
    });
}

function flagGameTurn() {
    let countryIndex = Math.floor(Math.random() * (data.length - 0) + 0);
    let country = data[countryIndex];

    correctAnswer = [country.name.common];
    console.log("correct answer: " + correctAnswer);


    console.log();

    geoChannel.send("What country is this?");
    geoChannel.send(country.flags.png);
    return;
}

function capitalsGameTurn() {
    let countryIndex = Math.floor(Math.random() * (data.length - 0) + 0);
    let country = data[countryIndex];
    
    correctAnswer = country.capital;
    console.log("correct answer: " + correctAnswer);

    console.log();

    geoChannel.send("what is the capital of: " + country.name.common);
    geoChannel.send(country.flags.png);
}

function populationGameTurn() {
    let countryIndex = Math.floor(Math.random() * (data.length - 0) + 0);
    let country = data[countryIndex];
    let population = country.population;

    geoChannel.send(`what is the population of: ${country.name.common}`);
    geoChannel.send(country.flags.png);

    correctAnswer = [(Math.floor(Math.random() * (3 - 1) + 1)).toString()];

    geoChannel.send("is it:");
    for (let i = 1; i < 4; i++) {
        if (i == correctAnswer[0]) {
            let Population = (country.population).toLocaleString('en-us', { minimumFractionDigits: 0});
            geoChannel.send(`${i}: ${Population}`);
        } else {
            let randModifier = Math.floor(Math.random() * (country.population - (-country.population)) + (-country.population))
            let possiblePopulation = (country.population + randModifier != 0 ? country.population + randModifier : country.population + randModifier + 1).toLocaleString('en-us', { minimumFractionDigits: 0});
            geoChannel.send(`${i}: ${possiblePopulation}`);
        }
    }
}


client.login(config.token);