/**
 * Point d'entrée du bot Discord.
 * 
 * Ce fichier contient :
 *  - L'initialisation du client Discord.
 *  - Le déploiement des commandes slash sur chaque serveur.
 *  - La gestion des interactions (commandes et autocomplétions).
 *  - La logique de chargement des données des champions (pour ARAM).
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import * as fs from 'fs';
import { BOT_TOKEN, CLIENT_ID } from './config';
import logger from './utils/logger'; // Import de Winston
import { addFail } from './commands/dofus/addFail';
import { removeFail } from './commands/dofus/removeFail';
import { leaderboard } from './commands/dofus/leaderboard';
import { Aram } from './commands/league of legends/aram';
import { HelpDofus } from './commands/help_dofus';
import { HelpLoL } from './commands/help_lol';
import { Startup } from './commands/dofus/startup';

/**
 * Chargement des données JSON des champions depuis un fichier local
 * (champions.json), et mise en cache dans `championNames`.
 */
let championNames: string[] = [];
try {
  const championsData = JSON.parse(fs.readFileSync('./champions.json', 'utf8'));
  championNames = Object.keys(championsData);
  logger.info(`Cache des champions chargé : ${championNames.length} champions.`);
} catch (error) {
  logger.error('Erreur lors du chargement des données des champions :', { error });
}

/**
 * Initialisation du client Discord
 * 
 * Le bot requiert les intentions (GatewayIntentBits) pour
 * - Guilds : pour écouter les interactions de type Slash Commands.
 * - GuildMembers : pour pouvoir suggérer des noms d'utilisateurs (autocomplétion).
 */
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

/**
 * Événement déclenché une seule fois à la connexion du bot.
 * - Logge la connexion avec Winston.
 * - Déploie dynamiquement les commandes slash pour chaque serveur sur lequel le bot est présent.
 */
client.once('ready', async () => {
  logger.info(`Connecté en tant que ${client.user?.tag}!`);

  // Création d'une instance de REST (version 10) pour enregistrer les commandes slash.
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

  try {
    // Récupère la liste des serveurs (guilds) où le bot est présent.
    const guilds = client.guilds.cache;

    // Parcourt chaque serveur pour y enregistrer les commandes.
    for (const [guildId, guild] of guilds) {
      // Création de la liste des commandes via SlashCommandBuilder.
      const commands = [
        new SlashCommandBuilder()
          .setName('helpdofus')
          .setDescription('Affiche la liste des commandes disponibles pour Dofus'),
        new SlashCommandBuilder()
          .setName('addfail')
          .setDescription('Ajoute un échec pour un utilisateur')
          .addStringOption((option) =>
            option
              .setName('name')
              .setDescription("Nom de l'utilisateur")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addIntegerOption((option) =>
            option
              .setName('amount')
              .setDescription("Quantité d'échecs à ajouter (minimum 1, maximum 2)")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName('removefail')
          .setDescription('Retire un échec pour un utilisateur')
          .addStringOption((option) =>
            option
              .setName('name')
              .setDescription("Nom de l'utilisateur")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addIntegerOption((option) =>
            option
              .setName('amount')
              .setDescription("Quantité d'échecs à retirer (optionnel)")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName('leaderboard')
          .setDescription('Affiche le classement des échecs'),
        new SlashCommandBuilder()
          .setName('startup')
          .setDescription('Configurer le canal pour les notifications'),
        new SlashCommandBuilder()
          .setName('helplol')
          .setDescription('Affiche la liste des commandes disponibles pour League of Legends'),
        new SlashCommandBuilder()
          .setName('aram')
          .setDescription('Affiche les buffs/nerfs du champion en ARAM')
          .addStringOption((option) =>
            option
              .setName('champion')
              .setDescription('nom du champion')
              .setAutocomplete(true)
              .setRequired(true)
          ),
      ].map((command) => command.toJSON());

      // Enregistrement des commandes dans le serveur spécifié.
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
        body: commands,
      });

      logger.info(`Commandes enregistrées pour le serveur ${guild.name}`);
    }

    logger.info('Toutes les commandes spécifiques ont été enregistrées.');
  } catch (error) {
    logger.error("Erreur lors de l'enregistrement des commandes :", { error });
  }
});

/**
 * Écoute les événements d'interaction.
 * 
 * Deux cas principaux :
 *  1) Autocomplétion (isAutocomplete) pour proposer des noms d'utilisateurs ou de champions.
 *  2) Commandes chat (isChatInputCommand) pour exécuter les fonctionnalités.
 */
client.on('interactionCreate', async (interaction) => {
  // Gère d'abord les autocomplétions.
  if (interaction.isAutocomplete()) {
    const commandName = interaction.commandName;
    const focusedValue = interaction.options.getFocused();

    // Autocomplétion pour les commandes addfail/removefail
    if (commandName === 'addfail' || commandName === 'removefail') {
      const guild = interaction.guild;
      if (!guild) return;

      // Récupération de la liste des membres du serveur (excluant les bots).
      const members = await guild.members.fetch();
      const memberNames = members
        .filter((member) => !member.user.bot)
        .map((member) => member.nickname || member.user.displayName);

      // Filtrage selon la saisie de l'utilisateur.
      const filtered = memberNames.filter((name) =>
        name.toLowerCase().startsWith(focusedValue.toLowerCase())
      );

      // On envoie les 25 premiers résultats possibles.
      await interaction.respond(
        filtered.slice(0, 25).map((name) => ({ name, value: name }))
      );
      return;
    }

    // Autocomplétion pour la commande aram
    if (commandName === 'aram') {
      // Filtre les champions dont le nom commence par la saisie de l'utilisateur.
      const filtered = championNames.filter((champion) =>
        champion.toLowerCase().startsWith(focusedValue.toLowerCase())
      );
      // Retourne les 25 premiers résultats.
      await interaction.respond(
        filtered.slice(0, 25).map((name) => ({ name, value: name }))
      );
      return;
    }
  }

  // On vérifie que l'interaction est bien une commande (Slash Command) avant de la traiter.
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;

    // Selon la commande reçue, on appelle le module correspondant.
    if (commandName === 'addfail') {
      await addFail(interaction);
    } else if (commandName === 'removefail') {
      await removeFail(interaction);
    } else if (commandName === 'leaderboard') {
      await leaderboard(interaction);
    } else if (commandName === 'aram') {
      await Aram(interaction);
    } else if (commandName === 'helpdofus') {
      await HelpDofus(interaction);
    } else if (commandName === 'helplol') {
      await HelpLoL(interaction);
    } else if (commandName === 'startup') {
      await Startup(interaction);
    }
  } catch (error) {
    logger.error("Erreur lors du traitement de l'interaction :", { error });
    await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
  }
});

/**
 * Connexion du bot à Discord grâce au jeton d'authentification.
 * 
 * Veillez à ce que votre fichier ./config.ts contienne un BOT_TOKEN valide.
 */
client.login(BOT_TOKEN);
