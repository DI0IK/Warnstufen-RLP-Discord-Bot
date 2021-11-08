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
			if (
				[
					'user-info',
					'guild-info',
					'guild-member-info',
					'guild-role-info',
					'guild-channel-info',
					'eval',
				].includes(i.commandName) ||
				i.user.id === process.env.OWNER_ID
			)
				return;
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
	const channels: {
		[parentId: string]: GuildChannel[];
		allTopLevel: GuildChannel[];
	} = {
		allTopLevel: [],
	};

	guild.channels.cache
		.filter((g) => !g.isThread())
		.sort((a, b) => {
			return (a as GuildChannel).position - (b as GuildChannel).position;
		})
		.forEach((channel) => {
			if (channel instanceof GuildChannel) {
				if (channel.parentId != null) {
					if (!channels[channel.parentId]) {
						channels[channel.parentId] = [];
					}
					channels[channel.parentId].push(channel);
				} else if (channel.type === 'GUILD_CATEGORY') {
					channels.allTopLevel.push(channel);
				} else {
					channels.allTopLevel.push(channel);
				}
			}
		});

	let channelsString = '';
	for (const parent of channels.allTopLevel) {
		if (parent.type === 'GUILD_CATEGORY') {
			channelsString += channelTypeCheck(parent) + '\n';
			for (const channel of channels[parent.id] || []) {
				channelsString += `> ${channelTypeCheck(channel)?.split('\n').join('\n> ')}\n`;
			}
		} else {
			channelsString += channelTypeCheck(parent) + '\n';
		}
	}

	return new MessageEmbed()
		.setTitle(`${guild.name} (${guild.id})`)
		.setColor('GREEN')
		.addField('Owner', guild.ownerId)
		.addField('Member count', guild.memberCount.toString())
		.addField('Channel count', guild.channels.cache.size.toString())
		.addField('Role count', guild.roles.cache.size.toString())
		.addField('Created At', `<t:${Math.round((guild.createdTimestamp || 0) / 1000)}:F>`)
		.addField(
			'Roles',
			guild.roles.cache
				.sort((a, b) => a.position - b.position)
				.map((r) => `${r.name} (${r.id})`)
				.join('\n')
				.substr(0, 1024) || 'None'
		)
		.setDescription('Channels:\n' + channelsString.substr(0, 4096) || 'None')
		.setImage(
			guild.iconURL({ size: 2048 }) ||
				'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Solid_blue.svg/768px-Solid_blue.svg.png'
		);
}

async function getUserEmbed(client: Client, userId: string) {
	const user = await client.users.fetch(userId);
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
		.addField('Bot', user.bot ? 'Yes' : 'No')
		.addField('Created At', `<t:${Math.round((user.createdTimestamp || 0) / 1000)}:F>`)
		.setImage(user.displayAvatarURL({ size: 2048 }));
}

async function getMemberEmbed(client: Client, guildId: string, userId: string) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return new MessageEmbed().setTitle('Unknown guild');
	}
	const member = await guild.members.fetch(userId);
	if (!member) {
		return new MessageEmbed().setTitle('Unknown member');
	}
	return new MessageEmbed()
		.setTitle(`${member.user.tag} (${member.user.id})`)
		.setColor('BLUE')
		.addField('Nickname', member.nickname || 'None')
		.addField('Bot', member.user.bot ? 'Yes' : 'No')
		.addField(
			'Nitro',
			member.premiumSinceTimestamp
				? `<t:${Math.round((member.premiumSinceTimestamp || 0) / 1000)}:F>`
				: 'None'
		)
		.addField(
			'Presence',
			member.presence?.activities
				.map((a) => `${a.type} ${a.name} ${a.details}`)
				.join('\n')
				.substr(0, 1024) || 'None'
		)
		.addField('Voice channel', member.voice.channelId || 'None')
		.addField(
			'Roles',
			member.roles.cache
				.sort((a, b) => a.position - b.position)
				.map((r) => `${r.name} (${r.id})`)
				.join('\n')
				.substr(0, 1024) || 'None'
		)
		.addField('Permissions', member.permissions.toArray().join('\n') || 'None')
		.addField('Joined At', `<t:${Math.round((member.joinedTimestamp || 0) / 1000)}:F>`)
		.setImage(member.displayAvatarURL({ size: 2048 }));
}

function getRoleEmbed(client: Client, guildId: string, roleId: string) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return new MessageEmbed().setTitle('Unknown guild');
	}
	const role = guild.roles.cache.get(roleId);
	if (!role) {
		return new MessageEmbed().setTitle('Unknown role');
	}
	return new MessageEmbed()
		.setTitle(`${role.name} (${role.id})`)
		.setColor('BLUE')
		.addField('Position', role.position.toString())
		.addField('Mentionable', role.mentionable ? 'Yes' : 'No')
		.addField('Hoisted', role.hoist ? 'Yes' : 'No')
		.addField('Color', role.color.toString(16))
		.addField('Created At', `<t:${Math.round((role.createdTimestamp || 0) / 1000)}:F>`)
		.setDescription(role.permissions.toArray(true).join('\n'));
}

function getChannelEmbed(client: Client, guildId: string, channelId: string) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return new MessageEmbed().setTitle('Unknown guild');
	}
	const channel = guild.channels.cache.get(channelId) as GuildChannel;
	if (!channel) {
		return new MessageEmbed().setTitle('Unknown channel');
	}
	if (channel.isText()) {
		return new MessageEmbed()
			.setTitle(`${channel.name} (${channel.id})`)
			.setColor('BLUE')
			.addField('Type', channel.type)
			.addField('Position', channel.position.toString())
			.addField('NSFW', channel.nsfw ? 'Yes' : 'No')
			.addField('Category', channel.parentId || 'None')
			.addField('Topic', channel.topic || 'None')
			.addField('Created At', `<t:${Math.round((channel.createdTimestamp || 0) / 1000)}:F>`);
	} else if (channel.isVoice()) {
		return new MessageEmbed()
			.setTitle(`${channel.name} (${channel.id})`)
			.setColor('BLUE')
			.addField('Type', channel.type)
			.addField('Position', channel.position.toString())
			.addField('Category', channel.parentId || 'None')
			.addField('Bitrate', channel.bitrate.toString())
			.addField('User limit', channel.userLimit.toString())
			.addField('User count', channel.members.size.toString())
			.addField('Created At', `<t:${Math.round((channel.createdTimestamp || 0) / 1000)}:F>`);
	} else {
		return new MessageEmbed()
			.setTitle(`${channel.name} (${channel.id})`)
			.setColor('BLUE')
			.addField('Type', channel.type)
			.addField('Position', channel.position.toString())
			.addField('Category', channel.parentId || 'None')
			.addField('Created At', `<t:${Math.round((channel.createdTimestamp || 0) / 1000)}:F>`);
	}
}

export function devCommandsInit(client: Client) {
	client.on('interactionCreate', (i) => {
		if (i.user.id !== process.env.OWNER_ID) return;
		if (i.isAutocomplete()) {
			if (
				![
					'user-info',
					'guild-info',
					'guild-member-info',
					'guild-role-info',
					'guild-channel-info',
					'eval',
				].includes(i.commandName)
			)
				return;
			const search = i.options.getFocused(true);
			if (!search) return;
			if (search.name === 'user') {
				let users = client.users.cache
					.filter((u) =>
						`${u.tag} (${u.id})`
							.toLowerCase()
							.includes((search.value as string).toLowerCase())
					)
					.map((u) => u);

				const guildId = i.options.getString('guild');
				if (guildId) {
					const guild = client.guilds.cache.get(guildId);
					if (!guild) return;
					const guildUsers = guild.members.cache.map((m) => m.user);
					users = guildUsers.filter((u) =>
						`${u.tag} (${u.id})`
							.toLowerCase()
							.includes((search.value as string).toLowerCase())
					);
				}

				i.respond(
					users.slice(0, 25).map((u) => {
						return {
							name: `${u.tag} (${u.id})`,
							value: u.id,
						};
					})
				);
			}
			if (search.name === 'guild') {
				const guilds = client.guilds.cache.filter((g) =>
					`${g.name} (${g.id})`.toLowerCase().includes((search.value as string).toLowerCase())
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
			if (search.name === 'role') {
				const guildId = i.options.getString('guild');
				if (!guildId) return;
				const guild = client.guilds.cache.get(guildId);
				if (!guild) return;
				const roles = guild.roles.cache.filter((r) =>
					`${r.name} (${r.id})`.toLowerCase().includes((search.value as string).toLowerCase())
				);

				i.respond(
					roles.first(25).map((r) => {
						return {
							name: `${r.name} (${r.id})`,
							value: r.id,
						};
					})
				);
			}
			if (search.name === 'channel') {
				const guildId = i.options.getString('guild');
				if (!guildId) return;
				const guild = client.guilds.cache.get(guildId);
				if (!guild) return;
				const channels = guild.channels.cache.filter(
					(c) =>
						!c.isThread() &&
						channelTypeCheck(c)
							.toLowerCase()
							?.includes((search.value as string).toLowerCase())
				);

				i.respond(
					channels.first(25).map((c) => {
						return {
							name: channelTypeCheck(c as GuildChannel),
							value: c.id,
						};
					})
				);
			}
			if (search.name === 'code') {
				const code = search.value as string;
				const autocomplete = i.options.getBoolean('autocomplete', true);
				if (!autocomplete)
					return i.respond([
						{
							name: code || '---',
							value: code || '---',
						},
					]);

				let props = code.split('.');
				if (props.length < 1)
					return i.respond([
						{
							name: code || '---',
							value: code || '---',
						},
					]);

				let searched = props.pop() || '';

				try {
					let obj = eval(props.join('.'));
					if (!obj)
						return i.respond([
							{
								name: code || '---',
								value: code || '---',
							},
						]);
					const preSearchString = code.substring(0, code.lastIndexOf('.'));
					i.respond(
						[
							...Object.getOwnPropertyNames(obj)
								.filter((k) => k.toLowerCase().includes(searched.toLowerCase()))
								.map((k) => {
									return {
										name: `${preSearchString}.${k}`,
										value: `${preSearchString}.${k}`,
									};
								}),
							...Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
								.filter((k) => k.toLowerCase().includes(searched.toLowerCase()))
								.map((k) => {
									return {
										name: `${preSearchString}.${k}`,
										value: `${preSearchString}.${k}`,
									};
								}),
						].slice(0, 25)
					);
				} catch (e) {
					i.respond([
						{
							name: code || '---',
							value: code || '---',
						},
					]);
				}
			}
		}
		if (i.isCommand()) {
			if (i.commandName === 'user-info') {
				getUserEmbed(client, i.options.getString('user') as string).then((e) =>
					i.reply({
						embeds: [e],
						ephemeral: true,
					})
				);
				return;
			}
			if (i.commandName === 'guild-info') {
				i.reply({
					embeds: [getServerEmbed(client, i.options.getString('guild') as string)],
					ephemeral: true,
				});
				return;
			}
			if (i.commandName === 'guild-member-info') {
				getMemberEmbed(
					client,
					i.options.getString('guild') as string,
					i.options.getString('user') as string
				).then((e) => i.reply({ embeds: [e], ephemeral: true }));
				return;
			}
			if (i.commandName === 'guild-role-info') {
				i.reply({
					embeds: [
						getRoleEmbed(
							client,
							i.options.getString('guild') as string,
							i.options.getString('role') as string
						),
					],
					ephemeral: true,
				});
				return;
			}
			if (i.commandName === 'guild-channel-info') {
				i.reply({
					embeds: [
						getChannelEmbed(
							client,
							i.options.getString('guild') as string,
							i.options.getString('channel') as string
						),
					],
					ephemeral: true,
				});
				return;
			}
			if (i.commandName === 'eval') {
				(async () => {
					const code = i.options.getString('code', true);
					const ephemeral = i.options.getBoolean('ephemeral') || true;

					const embed = new MessageEmbed();

					try {
						const result = await eval(code);

						embed.setTitle('Eval Success');
						embed.setDescription(`\`\`\`js\n${result}\n\`\`\``);
					} catch (e) {
						embed.setTitle('Eval Error');
						embed.setDescription(`\`\`\`js\n${e}\n\`\`\``);
					}

					i.reply({
						embeds: [embed],
						ephemeral: ephemeral,
					});
				})();
			}
		}
	});
}

function channelTypeCheck(channel: GuildChannel) {
	let type = channel.type;
	if (type === 'GUILD_CATEGORY') return `📂 ${channel.name} (${channel.id})`;
	if (type === 'GUILD_TEXT') return `💬 ${channel.name} (${channel.id})`;
	if (type === 'GUILD_VOICE')
		return `🔊 ${channel.name} (${channel.id}) ${channel.members.size} Users`;
	if (type === 'GUILD_NEWS') return `📰 ${channel.name} (${channel.id})`;
	if (type === 'GUILD_STORE') return `🛒 ${channel.name} (${channel.id})`;
	if (type === 'GUILD_STAGE_VOICE')
		return `🔊 ${channel.name} (${channel.id}) ${channel.members.size} Users`;
	return `${channel.name} (${channel.id})`;
}
