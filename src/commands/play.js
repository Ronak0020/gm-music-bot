const { Util } = require('discord.js');
const ytdl = require('ytdl-core');
const ytdlDiscord = require('ytdl-core-discord');
const snekfetch = require('snekfetch');

module.exports = {
	name: 'play',
	description: 'Play command.',
	usage: '[command name]',
	args: true,
	cooldown: 5,
	async execute(client, message, args) {
		const { voiceChannel } = message.member;
		if (!voiceChannel) return message.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
		const permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) return message.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
		if (!permissions.has('SPEAK')) return message.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');

		const query = args.join(" ");
        const { body } = await snekfetch
            .get('https://www.googleapis.com/youtube/v3/search')
            .query({
                part: 'snippet',
                type: 'video',
                maxResults: 1,
                q: query,
                key: process.env.key
            });
        if (!body.items.length) return message.channel.send('No results found for ' + query + ".");

		const serverQueue = message.client.queue.get(message.guild.id);
		const songInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${body.items[0].id.videoId}`);
		const song = {
			id: songInfo.video_id,
			title: Util.escapeMarkdown(songInfo.title),
			url: songInfo.video_url
		};

		if (serverQueue) {
			serverQueue.songs.push(song);
			console.log(serverQueue.songs);
			return message.channel.send(`✅ **${song.title}** has been added to the queue!`);
		}

		const queueConstruct = {
			textChannel: message.channel,
			voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		message.client.queue.set(message.guild.id, queueConstruct);
		queueConstruct.songs.push(song);

		const play = async song => {
			const queue = message.client.queue.get(message.guild.id);
			if (!song) {
				queue.voiceChannel.leave();
				message.client.queue.delete(message.guild.id);
				return;
			}

			const dispatcher = queue.connection.playOpusStream(await ytdlDiscord(song.url), { passes: 3 })
				.on('end', reason => {
					if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
					else console.log(reason);
					queue.songs.shift();
					play(queue.songs[0]);
				})
				.on('error', error => console.error(error));
			dispatcher.setVolumeLogarithmic(queue.volume / 5);
			queue.textChannel.send(`🎶 Start playing: **${song.title}**`);
		};

		try {
			const connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			message.client.queue.delete(message.guild.id);
			await voiceChannel.leave();
			return message.channel.send(`I could not join the voice channel: ${error}`);
		}
	}
};
