import { Client } from 'discord.js';
import express from 'express';

export function startWebDashboard(client: Client) {
	const app = express();

	app.get('/stats', (req, res) => {
		const guilds = client.guilds.cache.map((guild) => {
			return {
				name: guild.name,
				id: guild.id,
				memberCount: guild.memberCount,
				iconURL: guild.iconURL(),
				channels: guild.channels.cache.map((channel) => {
					return {
						name: channel.name,
						id: channel.id,
						type: channel.type,
					};
				}),
			};
		});

		const users = client.users.cache.map((user) => {
			return {
				username: user.username,
				id: user.id,
				discriminator: user.discriminator,
				avatarURL: user.avatarURL(),
				guilds: client.guilds.cache
					.filter((guild) => {
						return guild.members.cache.has(user.id);
					})
					.map((guild) => {
						return {
							id: guild.id,
						};
					}),
			};
		});

		res.json({
			guilds,
			users,
		});
	});

	app.listen(2424, () => {
		console.log('Web dashboard listening on port 2424!');
	});
}
