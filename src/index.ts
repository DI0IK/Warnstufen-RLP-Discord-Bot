import Discord from 'discord.js';
import dotenv from 'dotenv';
import { AutoPoster } from 'topgg-autoposter';
import deploy from './deploy.js';
import Data from './data.js';
import { createGraph } from './graph.js';
import { devCommandsInit, webhookClientInit } from './loggers.js';
dotenv.config();

const client = new Discord.Client({
	intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('ready', () => {
	console.log(`Logged in as ${client.user?.tag}!`);

	client.user?.setActivity('Slash Befehlen', { type: 'LISTENING' });

	deploy(client);

	webhookClientInit(client);

	devCommandsInit(client);

	AutoPoster(process.env.TOPGG_TOKEN as string, client);
});

client.login(process.env.DISCORD_TOKEN);

client.on('interactionCreate', async (interaction) => {
	if (interaction.isAutocomplete()) {
		if (!['warnstufe', 'warnstufe-graph'].includes(interaction.commandName)) return;
		const districts = await Data.getDistricts();
		const search = interaction.options.getFocused();
		interaction.respond(
			districts
				.filter((d) => d.includes(search as string))
				.slice(0, 25)
				.map((district) => {
					return {
						name: district,
						value: district,
					};
				})
		);
		return;
	}

	if (interaction.isCommand()) {
		if (interaction.commandName === 'warnstufe') {
			const district = interaction.options.getString('landkreis');

			if (!district) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription('Bitte gib einen Landkreis an.'),
					],
				});
				return;
			}

			const year = interaction.options.getInteger('jahr');
			const month = interaction.options.getInteger('monat');
			const day = interaction.options.getInteger('tag');

			if (year && (!month || !day)) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription(
								'Bitte geben Sie einen Monat und einen Tag an um die Jahreseingabe zu verwenden.'
							),
					],
				});
				return;
			}

			if (month && !day) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription(
								'Bitte geben Sie einen Tag an um die Monateingabe zu verwenden.'
							),
					],
				});
				return;
			}

			const date = new Date(
				year || new Date().getFullYear(),
				month || new Date().getMonth(),
				day || new Date().getDate()
			);

			const data = await Data.getData();
			const districtData = data[district];
			if (!districtData) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription(`Es wurden keine Daten für ${district} gefunden.`),
					],
				});
				return;
			}
			const dateData =
				districtData[
					date.toLocaleDateString('de-DE', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
					})
				];

			if (!dateData) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed().setTitle('Fehler').setDescription(
							`Es wurden keine Daten für ${district} am ${date.toLocaleDateString('de-DE', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
							})} gefunden.`
						),
					],
				});
				return;
			}

			const colors: `#${number | string}${number | string}${number | string}${number | string}${
				| number
				| string}${number | string}`[] = ['#e6e600', '#ffa500', '#ff0000'];

			const embed = new Discord.MessageEmbed()
				.setTitle(
					`Warnstufe für ${district} am ${date.toLocaleDateString('de-DE', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
					})}`
				)
				.setDescription(`Warnstufe ${dateData.Warnstufe}`)
				.addField('Inzidenz letzte 7 Tage', dateData.Inzidenz7Tage.toString())
				.addField('Hospitalisierung letzte 7 Tage', dateData.Hospitalisierung7Tage.toString())
				.addField('Intensivbetten Belegt (%)', dateData.IntensivbettenProzent.toString())
				.addField(
					'Informationen:',
					'Alle Angaben ohne Gewähr. [Datenquelle](https://lua.rlp.de/fileadmin/lua/Downloads/Corona/Listen/Leitindikatoren_Corona-Warnstufen.xlsx) [API](https://www.warnzahl-rlp.de/)'
				)
				.setColor(colors[dateData.Warnstufe - 1]);

			interaction.reply({
				embeds: [embed],
			});
		}
		if (interaction.commandName === 'warnstufe-graph') {
			const district = interaction.options.getString('landkreis');

			if (!district) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription('Bitte gib einen Landkreis an.'),
					],
				});
				return;
			}

			const data = await Data.getData();
			const districtData = data[district];
			if (!districtData) {
				interaction.reply({
					embeds: [
						new Discord.MessageEmbed()
							.setTitle('Fehler')
							.setDescription(`Es wurden keine Daten für ${district} gefunden.`),
					],
				});
				return;
			}

			const dates = Object.keys(districtData);
			const datesData = dates.map((date) => districtData[date]);

			const colors = [
				{
					color: '#e6e600',
					minValue: 0,
				},
				{
					color: '#ffa500',
					minValue: 1,
				},
				{
					color: '#ff0000',
					minValue: 2,
				},
			];

			let image = await createGraph(dates, datesData, colors);

			interaction.reply({
				files: [image],
			});
		}
	}
});

client.on('messageCreate', (message) => {
	if (message.mentions.members?.some((mem) => mem.id === client.user?.id)) {
		message.channel.send({
			embeds: [
				new Discord.MessageEmbed().setDescription(
					`Bitte nutze [diesen Invite](${process.env.DISCORD_INVITE}) um mich einzuladen oder die Slash Befehle zu aktivieren.`
				),
			],
		});
	}
});
