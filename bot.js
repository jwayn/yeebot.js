const Discord = require('discord.js');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const database = './db/newyee.db';
const votes = require('./votecache.js');
const meme = require('./commands/meme.js')

db = new sqlite3.Database(database);

const auth = require('./auth.json');
const config = require('./config.json');

const voteThreshold = 1;

const agree = '👍';
const disagree = '👎'

const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();

let gatherCommands = function (){
    fs.readdir('./commands/', (err, files) => {
        if(err) console.log(err);

        let commands = files.filter(file => file.split(".").pop() === 'js');
        if(commands.length <= 0){
            console.log("No commands present.");
            return;
        }

        commands.forEach((file) => {
            let properties = require(`./commands/${file}`);
            console.log(`${file} loaded.`);
            bot.commands.set(properties.help.name, properties)
        });
    });
}

let addUsersToDB = function(memberId, guildId){
    let sql = 'INSERT OR IGNORE INTO users (user_id, guild_id, memebucks) VALUES (?, ?, 100);'
    let params = [memberId, guildId]
    
    db.run(sql, params, (err) => {
        if(err) {
            console.log(err.message);
        }
    })
}

addGuildsToDB = (guildId) => {
    let sql = 'INSERT OR IGNORE INTO guilds (guild_id) VALUES (?);'
    let params = [guildId]

    db.run(sql, params, (err) => {
        if(err) {
            console.log(err.message);
        }
    })
}

gatherCommands();

bot.on("ready", async () => {
    console.log("Bot is ready.");

    bot.guilds.forEach(function(guild){
        addGuildsToDB(guild.id);
        guild.members.forEach(function(member, memberId){
            addUsersToDB(memberId, guild.id)
            
        })
    })
});

bot.on("message", async message => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") {
        console.log(message.author.id);
        if (message.author.id === '169253862975340544') {
            if(message.content.startsWith(config.prefix + "say")){
                let messageArray = message.content.split(' ');
                let serverID = messageArray[1];
                let channelID = messageArray[2];
                let speech = messageArray.slice(3).join(" ");

                let channel = bot.guilds.get(serverID).channels.get(channelID)

                return channel.send(speech);
            }
        }
    }

    let messageArray = message.content.split(' ');
    let command = messageArray[0];

    if (command.substr(0, config.prefix.length) === config.prefix) {
        let args = messageArray.slice(1);
        let checkCommand = bot.commands.get(command.slice(config.prefix.length));
        if(checkCommand) {
            checkCommand.run(bot, message, args)
        } else {
            bot.commands.get('help').run(bot, message, args="struggle");
        };
    }
});


bot.on("messageReactionAdd", async(messageReaction, user) => {
    if (messageReaction.emoji.name === agree || messageReaction.emoji.name === disagree){
        if (user.id != bot.user.id){
            console.log("\nReaction being added.")

            let allReactions = messageReaction.message.reactions;
            allReactions.forEach(reaction => {
                console.log("REACTION NAME: " + reaction.emoji.name);
                if (reaction.emoji.name === agree || reaction.emoji.name === disagree){
                    if(reaction.emoji != messageReaction.emoji){
                        reaction.remove(user)
                    }
                }
            });

            removeUserVote(user.id, messageReaction.message.id)
            
            if (messageReaction.emoji.name === agree){
                await addUserVote(user.id, messageReaction.message.id, 'agree', messageReaction.message.channel)
            } else if (messageReaction.emoji.name === disagree){
                await addUserVote(user.id, messageReaction.message.id, 'disagree', messageReaction.message.channel)
            }
            
            console.log(`Votes for ${messageReaction.message.id}: ` + votes.cache[messageReaction.message.id].total)
            
        }
    }
});

bot.on("messageReactionRemove", async(messageReaction, user) => {
    if (messageReaction.emoji.name === agree || messageReaction.emoji.name === disagree){
        console.log("\nReaction being removed.")
        if (user.id != bot.user.id){
            if(checkForUserVote(user.id, messageReaction.message.id)){
                removeUserVote(user.id, messageReaction.message.id)

                let allReactions = messageReaction.message.reactions;
                allReactions.forEach(reaction => {
                    if (reaction.emoji.name === agree || reaction.emoji.name === disagree){
                        if(reaction.emoji != messageReaction.emoji){
                            reaction.users.forEach(rctnUser => {
                                if (rctnUser.id === user.id){
                                    if (reaction.emoji.name === agree){
                                        addUserVote(user.id, messageReaction.message.id, 'disagree', messageReaction.message.channel)
                                    } else if (reaction.emoji.name === disagree){
                                        addUserVote(user.id, messageReaction.message.id, 'agree', messageReaction.message.channel)
                                    }
                                }
                            })
                        }
                    }
                });
            }
        }
    }
    console.log(`Votes for ${messageReaction.message.id}: ` + votes.cache[messageReaction.message.id].total)
})

checkForUserVote = (user_id, message_id) => {
    console.log(`Checking to see if ${user_id} has voted already.`)
    if (votes.cache[message_id].votes){
        for(vote in votes.cache[message_id].votes){
            let id = votes.cache[message_id].votes[vote].id;
            if(id === user_id){
                console.log(`${user_id} has voted already.`)
                return true;
            }
        }
        console.log(`${user_id} has not voted already.`)
        return false;
    } 
}

addUserVote = (user_id, message_id, vote, channel) => {
    votes.cache[message_id].votes.push({
        id: user_id,
        vote: vote
    })
    votes.cache[message_id].total += 1;
    evaluateVotes(message_id, channel)
}

/*
alterUserVote = (user_id, message_id, vote) => {
    let messageVotes = votes.cache[message_id].votes
    for(vote in messageVotes){
        let id = messageVotes[vote].id;
        if(id === user_id){
            messageVotes[vote].vote = vote;
        }
    }
    evaluateVotes(message_id, channel)
}
*/

removeUserVote = (user_id, message_id) => {
    let messageVotes = votes.cache[message_id].votes
    for(vote in messageVotes){
        let id = messageVotes[vote].id;
        if(id === user_id){
            let index = messageVotes.indexOf(vote)
            messageVotes.splice(index, 1);
            votes.cache[message_id].total -= 1;
        }
    }
}

evaluateVotes = async (message_id, channel) => {
    let messageVotes = votes.cache[message_id].votes;
    let total = votes.cache[message_id].total;
    let link = votes.cache[message_id].link;
    let submitter = votes.cache[message_id].submitter
    let guild = votes.cache[message_id].guild

    let aprvCount = 0;
    let rjctCount = 0;

    console.log("Total: " + total)
    console.log("Threshold: " + voteThreshold)
    console.log("Link: " + link)
    console.log("Submitter: " + submitter)
    console.log("Guild: " + guild)

    submitterUser = bot.users.get(submitter);

    if (total >= voteThreshold){
        console.log("Voting is over.");

        for(let vote in await messageVotes){
            console.log()
            if (messageVotes[vote].vote === 'agree'){
                await aprvCount++;
            } else if (messageVotes[vote].vote === 'disagree'){
                await rjctCount++;
            }
        }

        console.log("Approvals: " + aprvCount);
        console.log("Rejections: " + rjctCount);


        if (aprvCount >= rjctCount) {
            await meme.approve(link, submitter, guild)
            await meme.deposit(submitter, guild, 10)
            await channel.send("your link <" + link + "> has been approved.", {reply: submitterUser});
            channel.fetchMessage(message_id).then(message => {
                message.delete();
            })
        } else if (aprvCount < rjctCount){
            await meme.reject(link, submitter, guild)
            
            await channel.send("your link <" + link + "> has been rejected.", {reply: submitterUser});
            channel.fetchMessage(message_id).then(message => {
                message.delete();
            })
        }
    }
    
}

bot.login(auth.token);