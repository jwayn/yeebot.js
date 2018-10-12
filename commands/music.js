const Discord = require('discord.js');
const config = require('../config.json');
const YTDL = require('ytdl-core');
let isReady = true;

module.exports.run = async (bot, message, args) => {
    if (isReady) {
        isReady = false;

        if (args.length > 0){
            file = args[0]
            console.log(file)
            let voiceChannel = message.member.voiceChannel;
            if (voiceChannel){
                voiceChannel.join().then(connection => {
                    const dispatcher = connection.playStream(YTDL(file, {filter: "audioonly"}));
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
}

module.exports.help = {
    name: "music",
    subcommands: [{
        name: "play",
        function: "Add music to the queue for this server.",
        usage: "music play <http://youtube.link/tovideo>"
    },
    {
        name: "queue",
        function: "Display the current queue of music.",
        usage: "music queue"
    },
    ],
    usage: config.prefix + "music <youtube link>",
    function: "Play audio from a youtube video into the channel that you're currently in.",
    hidden: false
}

