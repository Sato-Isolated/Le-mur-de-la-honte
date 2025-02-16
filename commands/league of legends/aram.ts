/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /aram sur Discord. Cette commande permet d'afficher
 *  les données spécifiques d'un champion en mode ARAM (buffs, nerfs, autres informations),
 *  à partir d'un fichier JSON (champions.json) et d'un mapping (ChampionId).
 * 
 * Fonctionnement général :
 * 1. Vérifie que le nom du champion saisi est valide (présent dans ChampionId).
 * 2. Lit et parse les données JSON relatives aux champions (fichier champions.json).
 * 3. Récupère les informations ARAM du champion correspondant.
 * 4. Construit un Embed (titre, description, champs d'informations, icône, etc.).
 * 5. Répond à la commande en affichant l'Embed avec les données ARAM du champion.
 ********************************************************************************/

import { readFile } from 'fs/promises';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import path from 'path';
import logger from '../../utils/logger'; // Import du logger

/********************************************************************************
 * Interface  : ChampionData
 * Objet      : Représente la structure des données ARAM pour un champion.
 *
 * @property {string} damage_dealt - Les modifications de dégâts infligés en ARAM.
 * @property {string} damage_taken - Les modifications de dégâts subis en ARAM.
 * @property {string} other       - Autres informations (mana cost, CD, etc.).
 ********************************************************************************/
interface ChampionData {
    damage_dealt: string;
    damage_taken: string;
    other: string;
}

/********************************************************************************
 * Type       : Champions
 * Description: Type qui associe le nom d'un champion à son objet ChampionData.
 ********************************************************************************/
type Champions = Record<string, ChampionData>;

/********************************************************************************
 * Variable   : ChampionId
 * Type       : Map<string, number>
 * Description: Associe le nom d'un champion à son ID numérique, utilisé 
 *              pour récupérer l'icône du champion depuis CommunityDragon.
 ********************************************************************************/
export const ChampionId = new Map<string, number>([
    // [NomChamp, IDChamp]
    ["Aatrox", 266], ["Ahri", 103], ["Akali", 84], ["Akshan", 166], ["Alistar", 12],
    ["Amumu", 32], ["Anivia", 34], ["Annie", 1], ["Aphelios", 523], ["Ashe", 22],
    ["Aurelion Sol", 136], ["Azir", 268], ["Bard", 432], ["BelVeth", 200], ["Blitzcrank", 53],
    ["Brand", 63], ["Braum", 201], ["Caitlyn", 51], ["Camille", 164], ["Cassiopeia", 69],
    ["ChoGath", 31], ["Corki", 42], ["Darius", 122], ["Diana", 131], ["Dr. Mundo", 36],
    ["Draven", 119], ["Ekko", 245], ["Elise", 60], ["Evelynn", 28], ["Ezreal", 81],
    ["Fiddlesticks", 9], ["Fiora", 114], ["Fizz", 105], ["Galio", 3], ["Gangplank", 41],
    ["Garen", 86], ["Gnar", 150], ["Gragas", 79], ["Graves", 104], ["Gwen", 887],
    ["Hecarim", 120], ["Heimerdinger", 74], ["Illaoi", 420], ["Irelia", 39], ["Ivern", 427],
    ["Janna", 40], ["Jarvan IV", 59], ["Jax", 24], ["Jayce", 126], ["Jhin", 202],
    ["Jinx", 222], ["KaiSa", 145], ["Kalista", 429], ["Karma", 43], ["Karthus", 30],
    ["Kassadin", 38], ["Katarina", 55], ["Kayle", 10], ["Kayn", 141], ["Kennen", 85],
    ["KhaZix", 121], ["Kindred", 203], ["Kled", 240], ["KogMaw", 96], ["LeBlanc", 7],
    ["Lee Sin", 64], ["Leona", 89], ["Lillia", 876], ["Lissandra", 127], ["Lucian", 236],
    ["Lulu", 117], ["Lux", 99], ["Malphite", 54], ["Malzahar", 90], ["Maokai", 57],
    ["Maître Yi", 11], ["Milio", 902], ["Miss Fortune", 21], ["Mordekaiser", 82], ["Morgana", 25],
    ["Naafiri", 950], ["Nami", 267], ["Nasus", 75], ["Nautilus", 111], ["Neeko", 518],
    ["Nidalee", 76], ["Nilah", 895], ["Nocturne", 56], ["Nunu & Willump", 20], ["Olaf", 2],
    ["Orianna", 61], ["Ornn", 516], ["Pantheon", 80], ["Poppy", 78], ["Pyke", 555],
    ["Qiyana", 246], ["Quinn", 133], ["Rakan", 497], ["Rammus", 33], ["RekSai", 421],
    ["Rell", 526], ["Renata Glasc", 888], ["Renekton", 58], ["Rengar", 107], ["Riven", 92],
    ["Rumble", 68], ["Ryze", 13], ["Samira", 360], ["Sejuani", 113], ["Senna", 235],
    ["Seraphine", 147], ["Sett", 875], ["Shaco", 35], ["Shen", 98], ["Shyvana", 102],
    ["Singed", 27], ["Sion", 14], ["Sivir", 15], ["Skarner", 72], ["Sona", 37],
    ["Soraka", 16], ["Swain", 50], ["Sylas", 517], ["Syndra", 134], ["Tahm Kench", 223],
    ["Taliyah", 163], ["Talon", 91], ["Taric", 44], ["Teemo", 17], ["Thresh", 412],
    ["Tristana", 18], ["Trundle", 48], ["Tryndamere", 23], ["Twisted Fate", 4], ["Twitch", 29],
    ["Udyr", 77], ["Urgot", 6], ["Varus", 110], ["Vayne", 67], ["Veigar", 45],
    ["VelKoz", 161], ["Vex", 711], ["Vi", 254], ["Viego", 234], ["Viktor", 112],
    ["Vladimir", 8], ["Volibear", 106], ["Warwick", 19], ["Wukong", 62], ["Xayah", 498],
    ["Xerath", 101], ["Xin Zhao", 5], ["Yasuo", 157], ["Yone", 777], ["Yorick", 83],
    ["Yuumi", 350], ["Zac", 154], ["Zed", 238], ["Zeri", 221], ["Ziggs", 115],
    ["Zilean", 26], ["Zoé", 142], ["Zyra", 143]
]);

/**
 * Lit et parse le fichier JSON contenant les données ARAM des champions.
 * 
 * @param {string} filePath - Le chemin absolu vers le fichier champions.json.
 * @returns {Promise<Champions>} - Un objet Champions contenant les infos ARAM de chaque champion.
 * @throws {Error} - Lance une erreur si la lecture ou le parsing échouent.
 */
async function readChampionsData(filePath: string): Promise<Champions> {
    try {
        const data = await readFile(filePath, 'utf8');
        logger.info('Données des champions chargées avec succès.', { filePath });
        return JSON.parse(data);
    } catch (error) {
        logger.error('Erreur lors de la lecture du fichier JSON.', { error, filePath });
        throw new Error('Impossible de charger les données des champions.');
    }
}

/**
 * Vérifie si un nom de champion existe dans la Map ChampionId.
 * 
 * @param {string} name - Le nom du champion à vérifier.
 * @returns {boolean} - True si le champion est valide, sinon false.
 */
function isValidChampionName(name: string): boolean {
    return ChampionId.has(name);
}

/**
 * Commande /aram : Affiche les informations ARAM (buffs, nerfs, autres) d'un champion.
 * 
 * @param {CommandInteraction} interaction - L'interaction (slash command) initiée par l'utilisateur.
 * 
 * Workflow de la fonction :
 * 1. Récupère et vérifie la validité du nom du champion depuis l'interaction.
 * 2. Lit les données ARAM (fichier champions.json).
 * 3. Sélectionne les données du champion demandé.
 * 4. Crée un Embed (titre, description, icône, etc.) pour afficher les infos ARAM.
 * 5. Envoie l'Embed en réponse à l'utilisateur.
 */
export const Aram = async (interaction: CommandInteraction): Promise<void> => {
    logger.info('-----------------------------------------------');
    logger.info('Commande /aram reçue.', {
        user: interaction.user.tag,
        guild: interaction.guild?.name || 'DM',
    });

    // 1. Extraction du nom du champion depuis l'interaction
    const championName = interaction.options.get('champion')?.value as string | undefined;

    // Vérifie la validité du nom (orthographe et présence dans la Map)
    if (!championName || !isValidChampionName(championName)) {
        logger.warn('Champion introuvable ou nom invalide.', { championName });
        await interaction.reply({
            content: `Champion "${championName}" introuvable. Vérifiez l'orthographe.`,
            ephemeral: true,
        });
        logger.info('Commande /aram terminée avec avertissement.');
        logger.info('-----------------------------------------------');
        return;
    }

    // 2. Détermine le chemin du fichier champions.json
    const championsPath = path.join(__dirname, '../../champions.json');

    try {
        logger.info('Lecture des données des champions depuis le fichier JSON.', { championsPath });
        const champions = await readChampionsData(championsPath);
        logger.info('Données des champions lues avec succès.', { champions });

        // 3. Récupération des informations ARAM du champion
        const championData = champions[championName];
        logger.info('Champion data retrieved.', { championData });

        // Récupère l'ID numérique du champion (pour l'icône)
        const championId = ChampionId.get(championName);
        logger.info('Champion ID retrieved.', { championId });

        if (!championData || !championId) {
            logger.warn('Données pour le champion non disponibles.', { championName });
            await interaction.reply({
                content: `Les données pour "${championName}" ne sont pas disponibles.`,
                ephemeral: true,
            });
            logger.info('Commande /aram terminée avec avertissement.');
            logger.info('-----------------------------------------------');
            return;
        }

        // URL de l'icône du champion (CommunityDragon)
        const thumbnailUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;

        logger.info('Creating embed with champion data.', { championName, championData, championId, thumbnailUrl });

        // 4. Construction de l'Embed de réponse
        const embed = new EmbedBuilder()
            .setTitle(championName)
            .setURL(`https://www.leagueoflegends.com/fr-fr/champions/${championName.toLowerCase().replace(/\s+/g, '-')}`)
            .setDescription('Patch 14.23')
            .setColor(0x58A2BF)
            .addFields(
                { name: 'Dégâts Infligés', value: String(championData.damage_dealt), inline: true },
                { name: 'Dégâts Subis', value: String(championData.damage_taken), inline: true },
                { name: 'Autres Infos', value: String(championData.other) }
            )
            .setThumbnail(thumbnailUrl);

        logger.info('Embed created successfully.', { embed });

        // 5. Répond à la commande avec l'Embed
        logger.info('Réponse avec les données du champion prête à être envoyée.', {
            championName,
            user: interaction.user.tag,
        });
        await interaction.reply({ embeds: [embed] });
        logger.info('Commande /aram exécutée avec succès.');
        logger.info('-----------------------------------------------');
    } catch (error) {
        // Gestion d'erreurs : lecture du fichier JSON, parsing, etc.
        if (error instanceof Error) {
            logger.error(`Erreur lors du traitement de la commande /aram. Détails de l'erreur: ${error.message}`, { error });
        } else {
            logger.error('Erreur lors du traitement de la commande /aram.', { error });
        }
        await interaction.reply({
            content: 'Une erreur est survenue lors de la récupération des données des champions.',
            ephemeral: true,
        });
        logger.info('-----------------------------------------------');
    }
};
