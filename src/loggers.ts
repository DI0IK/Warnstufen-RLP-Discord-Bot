import { Client, GuildChannel, MessageEmbed, TextChannel, WebhookClient } from 'discord.js';

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
		.setTitle(`${guild.name} (${guild.id})`)
		.setColor('GREEN')
		.addField('Owner', guild.ownerId)
		.addField('Member count', guild.memberCount.toString())
		.addField('Channel count', guild.channels.cache.size.toString())
		.addField('Role count', guild.roles.cache.size.toString())
		.addField('Created At', `<t:${Math.round((guild.createdTimestamp || 0) / 1000)}:T>`)
		.addField(
			'Roles',
			guild.roles.cache
				.sort((a, b) => a.position - b.position)
				.map((r) => `${r.name} (${r.id})`)
				.join('\n')
				.substr(0, 1024) || 'None'
		)
		.setDescription(
			'Channels:\n' +
				guild.channels.cache
					.filter((g) => !g.isThread())
					.sort((a, b) => (a as GuildChannel).rawPosition - (b as GuildChannel).rawPosition)
					.map(
						(c) =>
							(c.parentId ? ' ' : '') +
							(c.isText()
								? '📄'
								: c.isVoice()
								? '🔊'
								: c.type === 'GUILD_CATEGORY'
								? '📁'
								: '📝') +
							` ${c.name} (${c.id})`
					)
					.join('\n')
					.substr(0, 4096) || 'None'
		);
}

async function getUserEmbed(client: Client, userId: string) {
	const user = client.users.cache.get(userId) || (await client.users.fetch(userId));
	if (!user) {
		return new MessageEmbed().setTitle('Unknown user');
	}
	return new MessageEmbed()
		.setTitle(`${user.tag} (${user.id})`)
		.setColor('BLUE')
		.addField(
			'Knows mutal guilds',
			client.guilds.cache
				.filter((g) => g.members.cache.has(userId))
				.map((g) => `${g.name} (${g.id})`)
				.join('\n')
				.substr(0, 1024) || 'None'
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
		.setTitle(`${member.user.tag} (${member.user.id})`)
		.setColor('BLUE')
		.addField('Nickname', member.nickname || 'None')
		.addField('Joined At', `<t:${Math.round((member.joinedTimestamp || 0) / 1000)}:T>`)
		.addField(
			'Roles',
			member.roles.cache
				.sort((a, b) => a.position - b.position)
				.map((r) => `${r.name} (${r.id})`)
				.join('\n')
				.substr(0, 1024) || 'None'
		)
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
				let users = client.users.cache.filter(
					(u) =>
						u.id.includes(search.value as string) ||
						u.tag.includes(search.value as string) ||
						`${u.tag} (${u.id})`.includes(search.value as string)
				);

				const guildId = i.options.getString('guild');
				if (guildId) {
					const guild = client.guilds.cache.get(guildId);
					if (!guild) return i.respond([]);
					const guildUsers = guild.members.cache.map((m) => m.user.id);
					users = users.filter((u) => guildUsers.includes(u.id));
				}

				i.respond(
					users.first(25).map((u) => {
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
						g.id.includes(search.value as string) ||
						g.name.includes(search.value as string) ||
						`${g.name} (${g.id})`.includes(search.value as string)
				);

				i.respond(
					guilds.first(25).map((g) => {
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
