import { ApplicationCommandData, Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

export default async function deploy(client: Client) {
	if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not set');
	if (!process.env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not set');

	const Rest = new REST({
		version: '9',
	}).setToken(client.token || process.env.DISCORD_TOKEN);

	const Commands: ApplicationCommandData[] = [
		{
			name: 'warnstufe',
			description: 'Warnstufe eines Landkreises oder einer Kreisstadt abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'landkreis',
					description: 'Landkreis',
					type: 3,
					autocomplete: true,
					required: true,
				},
				{
					name: 'tag',
					description: 'Tag des Monats (Monat muss gesetzt sein)',
					type: 4,
					required: false,
					autocomplete: false,
				},
				{
					name: 'monat',
					description: 'Monat (Tag muss gesetzt werden)',
					type: 4,
					required: false,
					autocomplete: false,
					choices: [
						{
							name: 'Januar',
							value: 0,
						},
						{
							name: 'Februar',
							value: 1,
						},
						{
							name: 'März',
							value: 2,
						},
						{
							name: 'April',
							value: 3,
						},
						{
							name: 'Mai',
							value: 4,
						},
						{
							name: 'Juni',
							value: 5,
						},
						{
							name: 'Juli',
							value: 6,
						},
						{
							name: 'August',
							value: 7,
						},
						{
							name: 'September',
							value: 8,
						},
						{
							name: 'Oktober',
							value: 9,
						},
						{
							name: 'November',
							value: 10,
						},
						{
							name: 'Dezember',
							value: 11,
						},
					],
				},
				{
					name: 'jahr',
					description: 'Jahr (Monat und Tag müssen gesetzt sein)',
					type: 4,
					required: false,
					autocomplete: false,
				},
			],
		},
		{
			name: 'warnstufe-graph',
			description:
				'Warnstufe eines Landkreises oder einer Kreisstadt abfragen und als Grafik darstellen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'landkreis',
					description: 'Landkreis',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
		{
			name: 'eval',
			description: 'Einen Code ausführen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'code',
					description: 'Code',
					type: 3,
					autocomplete: false,
					required: true,
				},
				{
					name: 'ephemeral',
					description: 'Ephemeral',
					type: 4,
					autocomplete: false,
					required: false,
				},
			],
		},
	];

	const devCommands: ApplicationCommandData[] = [
		{
			name: 'user-info',
			description: 'Informationen zu einem Nutzer abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'user',
					description: 'Nutzer',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
		{
			name: 'guild-info',
			description: 'Informationen zu einem Server abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'guild',
					description: 'Server',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
		{
			name: 'guild-member-info',
			description: 'Informationen zu einem Servermitglied abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'guild',
					description: 'Server',
					type: 3,
					autocomplete: true,
					required: true,
				},
				{
					name: 'user',
					description: 'Benutzer',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
		{
			name: 'guild-channel-info',
			description: 'Informationen zu einem Serverkanal abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'guild',
					description: 'Server',
					type: 3,
					autocomplete: true,
					required: true,
				},
				{
					name: 'channel',
					description: 'Kanal',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
		{
			name: 'guild-role-info',
			description: 'Informationen zu einer Serverrolle abfragen',
			defaultPermission: true,
			type: 1,
			options: [
				{
					name: 'guild',
					description: 'Server',
					type: 3,
					autocomplete: true,
					required: true,
				},
				{
					name: 'role',
					description: 'Rolle',
					type: 3,
					autocomplete: true,
					required: true,
				},
			],
		},
	];

	await Rest.put(Routes.applicationCommands(client.user!.id || process.env.DISCORD_CLIENT_ID), {
		body: Commands,
	});

	await Rest.put(
		Routes.applicationGuildCommands(
			client.user!.id || process.env.DISCORD_CLIENT_ID,
			'714890515539165304'
		),
		{
			body: devCommands,
		}
	);

	console.log('Commands successfully deployed');
}
