import { Client, MessageEmbed, TextChannel, WebhookClient } from 'discord.js';

export function webhookClientInit(client: Client) {
	const webhookClient = new WebhookClient({
		url: process.env.DISCORD_WEBHOOK_URL as string,
	});

	client.on('guildCreate', (guild) => {
		webhookClient.send({
			embeds: [embed(`Joined guild: ${guild.name}`)],
		});
	});
	client.on('guildDelete', (guild) => {
		webhookClient.send({
			embeds: [embed(`Left guild: ${guild.name}`)],
		});
	});
	client.on('interactionCreate', (i) => {
		if (i.isCommand()) {
			webhookClient.send({
				embeds: [
					embed(
						`${i.user.tag} ran a Command\nCommand: ${
							i.commandName
						}\nDistrict: ${i.options.getString('landkreis')}\nChannel: ${
							(client.channels.cache.get(i.channelId) as TextChannel)?.name
						} (${i.channelId})`
					),
				],
			});
		}
	});
}

function embed(text: string) {
	return new MessageEmbed()
		.setColor('#0099ff')
		.setDescription(text)
		.addField('\u200b', `<t:${Math.round(new Date().getTime() / 1000)}:R>`);
}
