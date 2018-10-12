const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const database = './db/newyee.db';
const config = require('../config.json');
const votes = require('../votecache.js');

db = new sqlite3.Database(database);

const agree = '👍';
const disagree = '👎'


module.exports.run = async (bot, message, args) => {
    if(args.length <= 0){
        module.exports.checkBalance(message.author.id, message.guild.id, balance => {
            if (balance > 0) {
                module.exports.withdraw(message.author.id, message.guild.id, 1, success => {
                    if(success){
                        retrieveRandomMeme(message.guild.id, data => {
                            let member = message.guild.members.get(data.user_id);
                            return message.channel.send(data.link + " This tasty meme was brought to you buy `" + member.user.username + "`.")
                        })
                    } else {
                        return message.channel.send("You either don't have enough fake money, or something went terribly wrong.");
                    }
                });
            } else {
                return message.channel.send("Sorry, you don't have enough fake money. Here's a fake tear to make you fake happy. 😢");
            }
        });
    } else if (args[0] === 'add'){
        if (args.length < 2){
            return message.channel.send('Come on man, thats not even how you do this. `' + config.prefix + 'help meme` for more information.')
        } else {
            let memeLink = await args[1];
            checkMemeExistence(memeLink, message.guild.id, async (exists, user_id, status) => {
                if(!exists){
                    await message.delete()
                    let msg = await message.channel.send('Please vote on this meme submission. ' + memeLink)
                    await msg.react(agree);
                    await msg.react(disagree);
                    votes.cache[msg.id] = await {
                        votes: [],
                        submitter: message.author.id,
                        guild: message.guild.id,
                        link: memeLink,
                        total: 0
                    };
                } else {
                    user = bot.users.get(user_id)
                    await message.delete()
                    await message.channel.send("<" + memeLink + "> has already been submitted by " + user.username + ", and was " + status + ".")
                }
            })

            
        }
    } else if (args[0] === 'balance'){
        module.exports.checkBalance(message.author.id, message.guild.id, balance => {
            return message.channel.send('`' + message.author.username + "`, your balance is `" + balance + "`.")
        })
    } 
}

retrieveRandomMeme = function(guildId, callback){
    let sql = 'SELECT user_id, link FROM memes WHERE guild_id = ? and status = "approved" ORDER BY RANDOM() LIMIT 1';
    let params = [guildId];
    db.get(sql, params, (err, row) => {
        if (err){
            console.error(err.message)
        };

        return row ? callback({link: row.link, user_id: row.user_id}) : console.log('No results returned.');
    });
}

checkMemeExistence = function(link, guild_id, callback){
    let sql = 'SELECT user_id, status FROM memes WHERE guild_id = ? and link = ?';
    let params = [guild_id, link];
    db.get(sql, params, (err, row) => {
        if (err){
            console.error(err.message)
            message.channel.send("Somehow you royally fucked something up.");
        };

        return row ? callback(true, row.user_id, row.status) : callback(false);
    });
}

module.exports.help = {
    name: "meme",
    subcommands: [{
        name: "add",
        function: "Submit a meme to be peer reviewed.",
        usage: "meme add <http://link.to.meme/meme.gif>"
    },
    {
        name: "balance",
        function: "Check your balance of memebucks",
        usage: "meme balance"
    }],
    usage: config.prefix + "meme\n" + config.prefix +"meme <subcommand>",
    function: "View, or submit memes to be peer reviewed.",
    hidden: false
}



module.exports.checkBalance = function (userId, guildId, callback) {
    let sql = 'SELECT memebucks FROM users WHERE user_id = ? AND guild_id = ?';
    let params = [userId, guildId];
    db.get(sql, params, (err, row) => {
        if (err){return console.error(err.message)};

        return row ? callback(row.memebucks) : console.log('No results returned.');
    });
}

module.exports.withdraw = function(userId, guildId, amount, callback){
    module.exports.checkBalance(userId, guildId, balance => {
        if (balance >= amount) {
            let sql = 'UPDATE users SET memebucks = memebucks - ? WHERE user_id = ? AND guild_id = ?'
            let params = [amount, userId, guildId];
            db.run(sql, params, (err) => {
                if (err) {
                    console.log(err.message);
                    callback(false);
                }
            });
            callback(true)
        } else {
            callback(false)
        }
    });
}

module.exports.deposit = function(userId, guildId, amount){
    let sql = 'UPDATE users SET memebucks = memebucks + ? WHERE user_id = ? AND guild_id = ?'
    let params = [amount, userId, guildId];
    db.run(sql, params, (err) => {
        if (err) {
            console.log(err.message);
        }
    });
}


module.exports.approve = function(link, userId, guildId){
    let sql = 'INSERT INTO memes (link, user_id, guild_id, status) VALUES (?, ?, ?, "approved");'
    let params = [link, userId, guildId];
    db.run(sql, params, (err) => {
        if (err) {
            console.log(err.message);
        }
    });
}

module.exports.reject = function(link, userId, guildId){
    let sql = 'INSERT INTO memes (link, user_id, guild_id, status) VALUES (?, ?, ?, "rejected");'
    let params = [link, userId, guildId];
    db.run(sql, params, (err) => {
        if (err) {
            console.log(err.message);
        }
    });
}


