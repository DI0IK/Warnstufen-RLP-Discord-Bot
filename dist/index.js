var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import Discord from 'discord.js';
import dotenv from 'dotenv';
import deploy from './deploy.js';
import Data from './data.js';
dotenv.config();
var client = new Discord.Client({
    intents: [],
});
client.on('ready', function () {
    var _a;
    console.log("Logged in as " + ((_a = client.user) === null || _a === void 0 ? void 0 : _a.tag) + "!");
    deploy(client);
});
client.login(process.env.DISCORD_TOKEN);
client.on('interactionCreate', function (interaction) { return __awaiter(void 0, void 0, void 0, function () {
    var districts, search_1, district, year, month, day, date, data, districtData, dateData, colors, embed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!interaction.isAutocomplete()) return [3 /*break*/, 2];
                return [4 /*yield*/, Data.getDistricts()];
            case 1:
                districts = _a.sent();
                search_1 = interaction.options.getFocused();
                interaction.respond(districts
                    .filter(function (d) { return d.includes(search_1); })
                    .slice(0, 25)
                    .map(function (district) {
                    return {
                        name: district,
                        value: district,
                    };
                }));
                return [2 /*return*/];
            case 2:
                if (!interaction.isCommand()) return [3 /*break*/, 4];
                if (!(interaction.commandName === 'warnstufe')) return [3 /*break*/, 4];
                district = interaction.options.getString('landkreis');
                if (!district) {
                    interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setTitle('Fehler')
                                .setDescription('Bitte gib einen Landkreis an.'),
                        ],
                    });
                    return [2 /*return*/];
                }
                year = interaction.options.getInteger('jahr');
                month = interaction.options.getInteger('monat');
                day = interaction.options.getInteger('tag');
                if (year && (!month || !day)) {
                    interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setTitle('Fehler')
                                .setDescription('Bitte geben Sie einen Monat und einen Tag an um die Jahreseingabe zu verwenden.'),
                        ],
                    });
                    return [2 /*return*/];
                }
                if (month && !day) {
                    interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setTitle('Fehler')
                                .setDescription('Bitte geben Sie einen Tag an um die Monateingabe zu verwenden.'),
                        ],
                    });
                    return [2 /*return*/];
                }
                date = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), day || new Date().getDate());
                return [4 /*yield*/, Data.getData()];
            case 3:
                data = _a.sent();
                districtData = data[district];
                if (!districtData) {
                    interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setTitle('Fehler')
                                .setDescription("Es wurden keine Daten f\u00FCr " + district + " gefunden."),
                        ],
                    });
                    return [2 /*return*/];
                }
                dateData = districtData[date.toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                })];
                if (!dateData) {
                    interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed().setTitle('Fehler').setDescription("Es wurden keine Daten f\u00FCr " + district + " am " + date.toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            }) + " gefunden."),
                        ],
                    });
                    return [2 /*return*/];
                }
                colors = ['#e6e600', '#ffa500', '#ff0000'];
                embed = new Discord.MessageEmbed()
                    .setTitle("Warnstufe f\u00FCr " + district + " am " + date.toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }))
                    .setDescription("Warnstufe " + dateData.Warnstufe)
                    .addField('Inzidenz letzte 7 Tage', dateData.Inzidenz7Tage.toString())
                    .addField('Hospitalisierung letzte 7 Tage', dateData.Hospitalisierung7Tage.toString())
                    .addField('Intensivbetten Belegt (%)', dateData.IntensivbettenProzent.toString())
                    .addField('Informationen:', 'Alle Angaben ohne Gewähr. [Datenquelle](https://lua.rlp.de/fileadmin/lua/Downloads/Corona/Listen/Leitindikatoren_Corona-Warnstufen.xlsx) [API](https://www.warnzahl-rlp.de/)')
                    .setColor(colors[dateData.Warnstufe - 1]);
                interaction.reply({
                    embeds: [embed],
                });
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
