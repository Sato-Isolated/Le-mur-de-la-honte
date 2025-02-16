/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /startup du bot. Cette commande permet de définir
 *  le canal par défaut (dans lequel seront envoyés les messages du bot) pour le
 *  serveur où elle est exécutée. Le canal est enregistré dans un fichier JSON
 *  (channel_ids.json) afin de mémoriser la configuration.
 * 
 * Fonctionnement général :
 * 1. Vérifie que la commande est exécutée dans un serveur (pas en MP).
 * 2. Vérifie que le canal actuel est un salon texte valide.
 * 3. Enregistre l'ID du canal dans un fichier JSON (channel_ids.json).
 * 4. Répond à l'utilisateur pour confirmer la configuration réussie.
 ********************************************************************************/

import { CommandInteraction, TextChannel, ChannelType } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../utils/logger'; // Import du logger

// Définition du chemin du fichier JSON où sont stockés les canaux configurés
const configFilePath = path.join(__dirname, 'channel_ids.json');

/**
 * Écrit ou met à jour l'ID du canal configuré pour un serveur spécifique dans le fichier JSON.
 * 
 * @param {string} guildId   - L'ID du serveur Discord.
 * @param {string} channelId - L'ID du canal Discord sélectionné pour ce serveur.
 */
const writeChannelIdToFile = (guildId: string, channelId: string): void => {
  try {
    // Lecture du fichier existant ou création d'un objet vide si le fichier n'existe pas
    const data = fs.existsSync(configFilePath)
      ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
      : {};

    // Vérifie si le canal actuel est déjà enregistré
    if (data[guildId] === channelId) {
      logger.info('Le canal est déjà configuré pour ce serveur.', { guildId, channelId });
      return;
    }

    // Met à jour la configuration du canal pour ce serveur
    data[guildId] = channelId;

    // Écrit les modifications dans le fichier JSON
    fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2), 'utf8');
    logger.info('ID du canal enregistré avec succès.', { guildId, channelId });
  } catch (error) {
    // En cas d'erreur (droits d'écriture, JSON mal formé, etc.)
    logger.error('Erreur lors de l\'écriture dans le fichier JSON.', { error, guildId, channelId });
  }
};

/**
 * Commande /startup
 * 
 * Permet de définir le canal actuel (où la commande est exécutée) comme canal
 * par défaut pour les notifications et les messages du bot.
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord liée à la commande /startup.
 * 
 * Étapes principales :
 * 1. Vérifie que la commande est lancée dans un serveur (pas en DM).
 * 2. Vérifie que le canal d'exécution est un salon texte.
 * 3. Stocke l'ID du canal dans un fichier JSON (channel_ids.json) pour persister la config.
 * 4. Répond à l'utilisateur pour confirmer le canal configuré.
 */
export const Startup = async (interaction: CommandInteraction): Promise<void> => {
  // Séparateur pour la lisibilité des logs
  logger.info('-----------------------------------------------');
  logger.info(`Commande /startup reçue - User: ${interaction.user.tag}, Guild: ${interaction.guild?.name || 'DM'}`);

  // 1. Vérifie la présence d'un serveur (interaction.guild)
  const guild = interaction.guild;
  if (!guild) {
    logger.warn('Commande exécutée hors d\'un serveur.', { user: interaction.user.tag });
    await interaction.reply({
      content: 'Cette commande doit être exécutée dans un serveur.',
      ephemeral: true,
    });
    return;
  }

  // 2. Vérifie que le canal d'exécution est un salon texte
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    logger.warn('Canal spécifié invalide ou inaccessible.', { guildId: guild.id, channelId: channel?.id });
    await interaction.reply({
      content: "Le canal spécifié n'est pas valide ou n'est pas accessible.",
      ephemeral: true,
    });
    return;
  }

  const channelId = channel.id;
  const guildId = guild.id;

  logger.info('Configuration du canal pour le serveur.', {
    guildId,
    channelId,
    channelName: channel.name,
    user: interaction.user.tag,
  });

  // 3. Enregistre l'ID du canal dans le fichier JSON
  writeChannelIdToFile(guildId, channelId);

  logger.info('Commande /startup exécutée avec succès.', { guildId, channelId, channelName: channel.name });

  // 4. Envoie une réponse de confirmation à l'utilisateur
  await interaction.reply({
    content: `Le canal configuré pour ce serveur est : ${channel.name} (ID : ${channelId})`,
    ephemeral: true,
  });

  logger.info('-----------------------------------------------');
};
