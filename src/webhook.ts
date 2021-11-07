import { Client, MessageEmbed, TextChannel, WebhookClient } from 'discord.js';

export function webhookClientInit(client: Client) {
	const webhookClient = new WebhookClient({
		url: process.env.DISCORD_WEBHOOK_URL as string,
	});

	client.on('guildCreate', (guild) => {
		webhookClient.send({
			embeds: [embed(`Joined new guild: ${guild.name}`)],
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
						`${i.user.tag} used command: ${i.commandName} District: ${i.options.getString(
							'landkreis'
						)} in Channel: ${(client.channels.cache.get(i.channelId) as TextChannel)?.name}`
					),
				],
			});
		}
	});
}

function embed(text: string) {
	return new MessageEmbed().setColor('#0099ff').setTimestamp().setTitle(text);
}
