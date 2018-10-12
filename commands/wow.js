const Discord = require('discord.js');
const config = require('../config.json');
let isReady = true;

module.exports.run = async (bot, message, args) => {
    if (isReady) {
        isReady = false;

        wowNum = Math.floor(Math.random() * 26) + 1;
        file = `./wows/${wowNum}.mp3`
        console.log(file)
        let voiceChannel = message.member.voiceChannel;
        if (voiceChannel){
            voiceChannel.join().then(connection => {
                const dispatcher = connection.playFile(file);
                dispatcher.on("end", end => {
                    voiceChannel.leave();
                });
            }).catch(err => {
                console.error(err);
            });
        }
        isReady = true;
    }
}

module.exports.help = {
    name: "wow",
    subcommands: [],
    usage: config.prefix + "wow",
    function: "Play a clip of Owen Wilson saying 'wow'.",
    hidden: true
}

