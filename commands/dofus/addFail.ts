/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /addfail sur Discord. Cette commande permet
 *  d'ajouter un ou plusieurs échecs (jusqu'à 2 maximum) à un utilisateur,
 *  d'enregistrer ces échecs dans la base de données, de gérer les "milestones"
 *  d'échecs (messages spéciaux à certains paliers), et de poster un message
 *  dans le salon configuré à cet effet.
 * 
 * 1. Récupère le nom et le nombre d'échecs à ajouter depuis l'interaction.
 * 2. Vérifie la validité du contexte (serveur, canal configuré, etc.).
 * 3. Met à jour les données de l'utilisateur en base ou crée un nouvel enregistrement.
 * 4. Gère l'affichage des "milestones" si un palier d'échecs est atteint.
 * 5. Envoie un message dans le canal configuré (et un accusé dans le canal de la commande).
 ********************************************************************************/

import { CommandInteraction, CommandInteractionOptionResolver, ChannelType, TextChannel, EmbedBuilder } from 'discord.js';
import { User } from '../../database/models';
import { milestones } from '../../utils/milestonesMessages';
import { ChannelConfigManager } from '../../utils/ChannelConfigManager';
import logger from '../../utils/logger'; // Import du logger Winston
import { Op, Sequelize } from 'sequelize';

const channelManager = new ChannelConfigManager();

// Constante : message d'erreur générique
const ERROR_MESSAGE = 'Erreur lors de l\'ajout de l\'échec.';

// Fonction : Génère un message de succès personnalisé en fonction du nom d'utilisateur et du nombre d'échecs total
const SUCCESS_MESSAGE = (userName: string, nbFail: number) =>
  `${userName} a maintenant ${nbFail} échecs.`;

/**
 * Ajoute un ou plusieurs échecs à un utilisateur (jusqu'à 2 maximum).
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord qui déclenche la commande /addfail.
 * 
 * Workflow de la fonction :
 * 1. Extraction des options (nom d'utilisateur, nombre d'échecs).
 * 2. Validation du contexte (commande lancée en serveur, canal configuré, etc.).
 * 3. Recherche ou création de l'utilisateur ciblé dans la base de données.
 * 4. Incrément du nombre d'échecs et enregistrement.
 * 5. Vérification des milestones atteints et préparation du message Embed.
 * 6. Envoi du message Embed dans le canal configuré et confirmation (éphemeral) dans le canal d'origine.
 */
export const addFail = async (interaction: CommandInteraction): Promise<void> => {
  // --- 1. Extraction des options de la commande ---
  const userName = (interaction.options as CommandInteractionOptionResolver).getString('name', true);
  const failCount = (interaction.options as CommandInteractionOptionResolver).getInteger('amount') || 1;

  // Séparateur visuel dans les logs pour chaque commande
  logger.info('-----------------------------------------------');
  logger.info(`Commande /addfail reçue - User: ${interaction.user.tag}, Guild: ${interaction.guild?.name || 'DM'}, Target: ${userName}, FailCount: ${failCount}`);

  // Vérification du nombre d'échecs saisi (entre 1 et 2 inclus)
  if (failCount < 1 || failCount > 2) {
    logger.warn(`Validation échouée - Nombre d'échecs non valide. User: ${userName}, FailCount: ${failCount}`);
    await interaction.reply({ content: 'Le nombre d\'échecs doit être entre 1 et 2.', ephemeral: true });
    return;
  }

  // --- 2. Validation du contexte ---
  const guildId = interaction.guildId;
  if (!guildId) {
    // La commande n'est pas exécutée dans un serveur
    logger.warn(`Commande exécutée en dehors d'un serveur - User: ${userName}`);
    await interaction.reply({ content: 'Cette commande doit être exécutée dans un serveur.', ephemeral: true });
    return;
  }

  // Récupération du canal configuré pour ce serveur
  const channelId = channelManager.getChannelIdForGuild(guildId);

  if (!channelId) {
    // Aucun canal n'a été configuré via la commande /startup
    logger.warn(`Aucun canal configuré - GuildID: ${guildId}`);
    await interaction.reply({
      content: "Aucun canal configuré pour ce serveur. Veuillez utiliser la commande `/startup` pour en configurer un.",
      ephemeral: true,
    });
    return;
  }

  // Vérification que le canal configuré est un salon textuel valide
  const targetChannel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
  if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
    // Le canal configuré n'existe plus ou n'est pas de type textuel
    logger.error(`Canal invalide ou inaccessible - ChannelID: ${channelId}, GuildID: ${guildId}`);
    await interaction.reply({
      content: "Le canal configuré n'est pas valide ou n'est pas accessible.",
      ephemeral: true,
    });
    return;
  }

  try {
    // --- 3. Recherche ou création de l'utilisateur dans la base ---
    logger.info(`Recherche ou création de l'utilisateur - User: ${userName}, GuildID: ${guildId}`);
    const [user, created] = await User.findOrCreate({
      where: {
        guildId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('name')),
            userName.toLowerCase()
          ),
        ],
      },
      defaults: {
        name: userName, // On force le champ "name" pour éviter un NOT NULL
        nb_fail: 0,
      },
    });

    // On loggue si l'utilisateur vient d'être créé ou s'il existait déjà
    if (created) {
      logger.info(`Nouvel utilisateur créé - User: ${userName}, GuildID: ${guildId}`);
    } else {
      logger.info(`Utilisateur existant trouvé - User: ${userName}, GuildID: ${guildId}, CurrentFails: ${user.nb_fail}`);
    }

    // --- 4. Incrément du nombre d'échecs ---
    const oldNbFail = user.nb_fail;
    user.nb_fail += failCount;

    logger.info(`Mise à jour des échecs - User: ${userName}, OldFails: ${oldNbFail}, NewFails: ${user.nb_fail}, AddedFails: ${failCount}, GuildID: ${guildId}`);

    // Sauvegarde en base
    await user.save();

    // --- 5. Vérification des milestones ---
    /**
     * On identifie la liste des milestones atteints
     * (ceux qui se situent entre l'ancienne valeur (exclusive) et la nouvelle (inclusive)).
     */
    const milestonesReached = Object.keys(milestones)
      .map(Number)
      .filter((milestone) => milestone > oldNbFail && milestone <= user.nb_fail)
      .sort((a, b) => a - b);

    if (milestonesReached.length > 0) {
      logger.info(`Milestones atteintes - User: ${userName}, Milestones: ${milestonesReached.join(', ')}`);
    }

    // Préparation du message dédié aux milestones atteints
    const milestoneMessages = milestonesReached.map(
      (milestone) => `**${user.nb_fail} Échecs** 🎉 - ${milestones[milestone]}`
    ).join('\n');

    // Construction de la réponse finale à afficher
    const response = milestoneMessages
      ? `${SUCCESS_MESSAGE(user.name, user.nb_fail)}\n\n${milestoneMessages}`
      : SUCCESS_MESSAGE(user.name, user.nb_fail);

    // Création d'un Embed stylé pour l'affichage des informations
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(response)
      .setFooter({
        text: `Commande exécutée par ${interaction.user.displayName} • /addfail`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    // --- 6. Envoi du message dans le canal configuré ---
    await targetChannel.send({ embeds: [embed] });

    // Si le canal courant n'est pas le même que le canal configuré, on envoie un accusé de réception dans le canal d'origine
    if (interaction.channelId !== targetChannel.id) {
      await interaction.reply({
        content: `Les échecs ont été ajoutés pour ${userName} et le message a été envoyé dans ${targetChannel.name}.`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Les échecs ont été ajoutés pour ${userName}.`,
        ephemeral: true,
      });
    }

    logger.info(`Commande exécutée avec succès - User: ${userName}, NewFails: ${user.nb_fail}, TargetChannel: ${targetChannel.name}, GuildID: ${guildId}`);
    logger.info('-----------------------------------------------');
  } catch (error) {
    /**
     * En cas d'erreur lors de la mise à jour ou de la création
     * (par exemple un problème de base de données),
     * on log l'erreur et on envoie un message d'erreur éphemeral à l'utilisateur.
     */
    const errorMessage = (error as Error).message;
    logger.error(`Erreur lors du traitement de la commande /addfail - Error: ${errorMessage}, User: ${userName}, GuildID: ${guildId}`);
    logger.info('-----------------------------------------------');
    await interaction.reply({ content: ERROR_MESSAGE, ephemeral: true });
  }
};
