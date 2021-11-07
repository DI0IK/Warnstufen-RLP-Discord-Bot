import { Client, MessageEmbed, TextChannel, WebhookClient } from 'discord.js';

export function webhookClientInit(client: Client) {
	const webhookClient = new WebhookClient({
		url: process.env.DISCORD_WEBHOOK_URL as string,
	});

	client.on('guildCreate', (guild) => {
		webhookClient.send({
			embeds: [
				new MessageEmbed()
					.setTitle('Guild joined')
					.setDescription(`${guild.name} (${guild.id})`)
					.setColor('GREEN')
					.addField('Owner', guild.ownerId)
					.addField('Member count', guild.memberCount.toString())
					.addField('Channel count', guild.channels.cache.size.toString())
					.addField('Created At', `<t:${Math.round((guild.createdTimestamp || 0) / 1000)}:T>`)
					.addField('Now', `<t:${Math.round(new Date().getTime() / 1000)}:T>`),
			],
		});
	});
	client.on('guildDelete', (guild) => {
		webhookClient.send({
			embeds: [
				new MessageEmbed()
					.setTitle('Guild left')
					.setDescription(`${guild.name} (${guild.id})`)
					.setColor('RED')
					.addField('Owner', guild.ownerId)
					.addField('Member count', guild.memberCount.toString())
					.addField('Channel count', guild.channels.cache.size.toString())
					.addField('Created At', `<t:${Math.round((guild.createdTimestamp || 0) / 1000)}:T>`)
					.addField('Now', `<t:${Math.round(new Date().getTime() / 1000)}:T>`),
			],
		});
	});
	client.on('interactionCreate', (i) => {
		if (i.isCommand()) {
			if (['user-info', 'guild-info', 'guild-member-info'].includes(i.commandName)) return;
			webhookClient.send({
				embeds: [
					new MessageEmbed()
						.setTitle('Command used')
						.setDescription(`${i.user.username} (${i.user.id})`)
						.setColor('BLUE')
						.addField('Command', i.commandName)
						.addField(
							'Guild',
							(client.guilds.cache.get(i.guildId)?.name || 'Unknown') + ` (${i.guildId})`
						)
						.addField(
							'Channel',
							((client.channels.cache.get(i.channelId) as TextChannel)?.name || 'Unknown') +
								` (${i.channelId})`
						)
						.addField('User', `${i.user.username} (${i.user.id})`)
						.addField('Now', `<t:${Math.round(new Date().getTime() / 1000)}:T>`),
				],
			});
		}
	});
	client.on('inviteCreate', (i) => {
		webhookClient.send({
			embeds: [
				new MessageEmbed()
					.setTitle('Invite created')
					.setDescription(i.url)
					.setColor('GREEN')
					.addField('Channel', `${i.channel.name} (${i.channel.id})`)
					.addField('Guild', `${i.guild?.name || 'Unknown'} (${i.guild?.id || 'Unknown'})`)
					.addField(
						'User',
						`${i.inviter?.username || 'Unknown'} (${i.inviter?.id || 'Unknown'})`
					)
					.addField('Created At', `<t:${Math.round((i.createdTimestamp || 0) / 1000)}:T>`)
					.addField('Now', `<t:${Math.round(new Date().getTime() / 1000)}:T>`),
			],
		});
	});
}

function getServerEmbed(client: Client, guildId: string) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return new MessageEmbed().setTitle('Unknown guild');
	}
	return new MessageEmbed()
		.setTitle(guild.name)
		.setDescription(`${guild.name} (${guild.id})`)
		.setColor('GREEN')
		.addField('Owner', guild.ownerId)
		.addField('Member count', guild.memberCount.toString())
		.addField('Channel count', guild.channels.cache.size.toString())
		.addField('Role count', guild.roles.cache.size.toString())
		.addField('Created At', `<t:${Math.round((guild.createdTimestamp || 0) / 1000)}:T>`)
		.addField('Roles', guild.roles.cache.map((r) => r.name).join('\n') || 'None')
		.addField('Channels', guild.channels.cache.map((c) => c.name).join('\n') || 'None');
}

async function getUserEmbed(client: Client, userId: string) {
	const user = client.users.cache.get(userId) || (await client.users.fetch(userId));
	if (!user) {
		return new MessageEmbed().setTitle('Unknown user');
	}
	return new MessageEmbed()
		.setTitle(user.tag)
		.setDescription(`${user.tag} (${user.id})`)
		.setColor('BLUE')
		.addField(
			'Knows mutal guilds',
			client.guilds.cache
				.filter((g) => g.members.cache.has(userId))
				.map((g) => g.name)
				.join('\n') || 'None'
		)
		.addField('Created At', `<t:${Math.round((user.createdTimestamp || 0) / 1000)}:T>`);
}

async function getMemberEmbed(client: Client, guildId: string, userId: string) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return new MessageEmbed().setTitle('Unknown guild');
	}
	const member = guild.members.cache.get(userId) || (await guild.members.fetch(userId));
	if (!member) {
		return new MessageEmbed().setTitle('Unknown member');
	}
	return new MessageEmbed()
		.setTitle(member.user.tag)
		.setDescription(`${member.user.tag} (${member.user.id})`)
		.setColor('BLUE')
		.addField('Nickname', member.nickname || 'None')
		.addField('Joined At', `<t:${Math.round((member.joinedTimestamp || 0) / 1000)}:T>`)
		.addField('Roles', member.roles.cache.map((r) => r.name).join('\n') || 'None')
		.addField('Permissions', member.permissions.toArray().join('\n') || 'None');
}

export function devCommandsInit(client: Client) {
	client.on('interactionCreate', (i) => {
		if (i.user.id !== process.env.OWNER_ID) return;
		if (i.isAutocomplete()) {
			if (!['user-info', 'guild-info', 'guild-member-info'].includes(i.commandName)) return;
			const search = i.options.getFocused(true);
			if (!search) return;
			if (search.name === 'user') {
				const users = client.users.cache.filter(
					(u) =>
						u.id.includes(search.value as string) || u.tag.includes(search.value as string)
				);

				i.respond(
					users.map((u) => {
						return {
							name: `${u.tag} (${u.id})`,
							value: u.id,
						};
					})
				);
			}
			if (search.name === 'guild') {
				const guilds = client.guilds.cache.filter(
					(g) =>
						g.id.includes(search.value as string) || g.name.includes(search.value as string)
				);

				i.respond(
					guilds.map((g) => {
						return {
							name: `${g.name} (${g.id})`,
							value: g.id,
						};
					})
				);
			}
		}
		if (i.isCommand()) {
			if (i.commandName === 'user-info') {
				getUserEmbed(client, i.options.getString('user') as string).then((e) =>
					i.reply({
						embeds: [e],
					})
				);
				return;
			}
			if (i.commandName === 'guild-info') {
				i.reply({
					embeds: [getServerEmbed(client, i.options.getString('guild') as string)],
				});
				return;
			}
			if (i.commandName === 'guild-member-info') {
				getMemberEmbed(
					client,
					i.options.getString('guild') as string,
					i.options.getString('user') as string
				).then((e) => i.reply({ embeds: [e] }));
				return;
			}
		}
	});
}
