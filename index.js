const { PassthroughValidator } = require('@sapphire/shapeshift');
const { time } = require('console');
const Discord = require('discord.js');
const config = require("./key.json")
const fs = require('fs');

const miliToSec = 1000;
const secPerTurn = 60;
const rounds = 10;

var inGame = false;
var now = new Date();
var lastSavedTime = new Date();
var correctAnswer = "";
var currentGame = {};
var actionInterval;
var geoChannel;

//const intents = new Discord.Intents(8);

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"]});

client.on("ready", function() {
    console.log("online!!\n"); 
    return;
});



client.on("messageCreate", (message) => {
    if (message.author.bot) {return;}

    if (message.channel.name != "geo-trivia") {return;}

    geoChannel = message.channel;

    now = new Date();

    console.log(`Message: "${message.content}" recieved from user: ${message.author.username} at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);

    if (!inGame) {
        inGame = true;
        console.log("starting new game");
        startGame(message.author.username, "", message.channel);
        return;
    } else {
        //playgame
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

    actionInterval = setInterval(endInterval, 1 * miliToSec);
}

function endInterval() {
    geoChannel.send("Times up!");
    currentGame.turn++;
    poseQuestion();
}

function poseQuestion() {
    if (currentGame.turn >= rounds) {
        endGame();
    }
}

function endGame() {
    geoChannel.send(`\`\`\`ending game with: "${currentGame.player}", Final Score: ${currentGame.score} / ${rounds}\`\`\``);
    inGame = false;
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
          });
    });

    clearInterval(actionInterval);
}

client.login(config.token);