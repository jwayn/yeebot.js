const Discord = require('discord.js');
const config = require('../config.json');

module.exports.run = async (bot, message, args) => {

    let embed = new Discord.RichEmbed()
            .setAuthor('❓Help!')
            .setThumbnail('https://i.imgur.com/J4koljU.png');

    if(args.length > 0){
        let command = bot.commands.get(args[0]);
        if(command && !command.help.hidden) {
            let helpSubcommands = '';

            embed.addField("It looks like you're trying to find help with **" + command.help.name + "**!",
            '**' + config.prefix + command.help.name + "**: " + command.help.function)
            .addField("Usage", command.help.usage)

            if(command.help.subcommands.length > 0){
                command.help.subcommands.forEach(subcommand => {
                    helpSubcommands += '**' + subcommand.name + '**: \n' + 
                    '\t>>**Function**: ' + subcommand.function + '\n' +
                    '\t>>**Usage**: `' + config.prefix + subcommand.usage + '`\n'
                });
                embed.addField("Subcommands", helpSubcommands)
            }
            return message.channel.send(embed);
        } else {
            let helpCommands = '';
            bot.commands.forEach(command => {
                console.log(command);
                if(!command.help.hidden){
                    helpCommands += '**' + config.prefix + command.help.name + '**: ' + command.help.function + '\n'
                }
            });
            embed.setAuthor("That command doesn't exist, ya dummy!")
            .addField("It looks like you're really strugglin' to use this pretty basic bot.", "Type `" + config.prefix + 'help <command>` for more information on that command.')
            .addField("Commands", helpCommands)
            return message.channel.send(embed);
        }
    } else {
        let helpCommands = '';
        bot.commands.forEach(command => {
            if(!command.help.hidden){
                helpCommands += '**' + config.prefix + command.help.name + '**: ' + command.help.function + '\n'
            }
        });
        embed.addField("It looks like you're trying to find help!", "Type `" + config.prefix + 'help <command>` for more information on that command.')
        .addField("Commands", helpCommands)
        return message.channel.send(embed);
    }
}

module.exports.help = {
    name: "help",
    subcommands: [],
    usage: config.prefix + "help, " + config.prefix +"help <command>",
    function: "List more information about commands, or a command in particular.",
    hidden: false
}