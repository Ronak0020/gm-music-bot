const Discord = require('discord.js');

module.exports = {
    name: 'help',
    cooldown: 5,
    description: "Shows this menu",
    async execute(client, message, args) {
        if(!args[0]) {
        const embed = new Discord.RichEmbed()
        .setTitle("Help Menu")
        .setTimestamp()
        .setFooter(client.user.username)
        .setDescription("Use `g!help <cmd name>` to gain command info!")
        .addField("GENERAL", "trial?")
        .addField("MUSIC", "`play`, `stop`, `pause`, `resume`, `queue`, `skip`, `volume`, `nowplaying`")
        .addField("MODERATION", "`kick`, `ban`, `softban`, `mute`, `tempmute`, `unmute`, `purge`, `addrole`, `takerole`, `createrole`, `deleterole`")
        .setColor("RANDOM")
        message.channel.send(embed.setAuthor(message.author.username, message.author.displayAvatarURL))
        }
        if (args[0]) {
            return getCMD(client, message, args[0]);
        }
    }
}
function getCMD(client, message, input) {
    const embed = new Discord.RichEmbed()

    const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(client.aliases.get(input.toLowerCase()));
    
    let info = `No information found for command **${input.toLowerCase()}**`;

    if (!cmd) {
        return message.channel.send(embed.setColor("RED").setDescription(info));
    }

    if (cmd.name) info = `**Command name**: ${cmd.name}`;
    if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `\`${a}\``).join(", ")}`;
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;
    if (cmd.usage) {
        info += `\n**Usage**: ${cmd.usage}`;
        embed.setFooter(`Syntax: <> = required, [] = optional`);
    }

    return message.channel.send(embed.setColor("GREEN").setDescription(info));
}