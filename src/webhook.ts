import { Client, MessageEmbed, WebhookClient } from 'discord.js';

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

	client.on('messageCreate', (message) => {
		if (message.author.bot) return;
		if (message.channel.type === 'DM') return;
		if (message.webhookId) return;
		webhookClient.send({
			embeds: [
				embed(
					`${message.author.username}#${message.author.discriminator} in ${message.channel.name}: ${message.content}`
				),
			],
		});
	});
}

function embed(text: string) {
	return new MessageEmbed().setColor('#0099ff').setTimestamp().setTitle(text);
}
