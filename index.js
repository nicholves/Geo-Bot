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


    if (!inGame && message.content == "!stats") {
        sendStats(message.author.username);
    }
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
    currentGame = {};
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

function sendStats(username) {
    geoChannel.send("\`\`\`Stats for user " + ` ${username}:\`\`\``);


    fs.readFile('Data.json', 'utf8', function(err, data){
        console.log(data);
        let json = JSON.parse(data);

        let points = 0;
        let gamesPlayed = 0;
        let possiblePoints = 0;

        let pointsCat = {"flags":0.0, "capitals":0.0, "population":0.0};

        let possiblePointsCat = {"flags":0.0, "capitals":0.0, "population":0.0};

        for (let game of json) {
            if (game.player !== username) {
                continue;
            }

            points += game.score;
            possiblePoints += game.turn;
            gamesPlayed++;

            pointsCat[game.type] += game.score;
            possiblePointsCat[game.type] += game.turn;
        }

        if (possiblePoints == 0) {
            geoChannel.send("\tYou have not played any games and thus have no stats available");
            return;
        }

        geoChannel.send(`\tTotal correct answers: ${points}`);
        geoChannel.send(`\tOverall acuracy: ${parseInt(points / possiblePoints * 100)}%`);
        geoChannel.send(`\tGames played: ${gamesPlayed}`);

        let cats = {};
        for (let category in possiblePointsCat) {
            try {
                //javascript is dumb for this
                if (possiblePointsCat[category] == 0) {
                    cats[category] = 0.0;
                    continue;
                }
                cats[category] = pointsCat[category] / possiblePointsCat[category];
            } catch {
                cats[category] = 0.0;
            }
        }

        let best = 0;
        let bestCat;
        for (let category in cats){
            if (cats[category] >= best) {
                best = cats[category];
                bestCat = category;
            }
        }

        geoChannel.send(`\tBest category: ${bestCat}, average acurracy: ${parseInt(cats[bestCat]  * 100)}%`);

        let worst = 100;
        let worstCat;
        for (let category in cats){
            if (cats[category] <= worst) {
                worst = cats[category];
                worstCat = category;
            }
        }

        geoChannel.send(`\tWorst category: ${worstCat}, average acurracy: ${parseInt(cats[worstCat]  * 100)}%`);
    });
}


client.login(config.token);