/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /leaderboard sur Discord. Cette commande 
 *  permet d'afficher un classement (avec pagination) des utilisateurs en 
 *  fonction de leur nombre d'échecs, et de l'envoyer dans le salon configuré.
 * 
 * Fonctionnement général :
 * 1. Vérifie la validité du contexte (exécuté dans un serveur, canal configuré, etc.).
 * 2. Récupère les utilisateurs triés par nombre d'échecs décroissant.
 * 3. Génère un embed pour chaque page, avec un système de pagination (boutons "Précédent" / "Suivant").
 * 4. Envoie le classement dans le canal configuré, avec des boutons de navigation si nécessaire.
 ********************************************************************************/

import {
  CommandInteraction,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
} from 'discord.js';
import { User } from '../../database/models';
import { userTitles } from '../../utils/userTitlesMessages';
import { ChannelConfigManager } from '../../utils/ChannelConfigManager';
import logger from '../../utils/logger'; // Import du logger Winston

/**
 * Instancie la gestion des salons configurés.
 */
const channelManager = new ChannelConfigManager();

/** Le titre principal du leaderboard. */
const LEADERBOARD_TITLE = 'Classement du mur de la honte <:pepe_cringe:1311706915633496165>';

/** Le nombre d'utilisateurs à afficher par page. */
const USERS_PER_PAGE = 10;

/**
 * Retourne un titre basé sur le nombre d'échecs de l'utilisateur.
 * @param {number} failCount - Le nombre d'échecs de l'utilisateur.
 * @returns {string} Titre approprié selon la config dans userTitles.
 */
const getUserTitle = (failCount: number): string => {
  // Récupération et tri des paliers (clés de userTitles) pour trouver le titre approprié
  const thresholds = Object.keys(userTitles)
    .map((key) => parseInt(key))
    .sort((a, b) => a - b);

  // Parcourt les paliers dans l'ordre décroissant pour trouver le plus haut palier atteint
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (failCount >= thresholds[i]) {
      return userTitles[thresholds[i]];
    }
  }

  return 'Explorateur des Fails';
};

/**
 * Commande /leaderboard : Affiche le classement des utilisateurs selon leur nombre d'échecs.
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord ayant déclenché la commande.
 * 
 * Étapes principales :
 * 1. Vérifie la légitimité de l'appel (exécuté en serveur, salon configuré).
 * 2. Récupère en base tous les utilisateurs du serveur, triés par nombre d'échecs.
 * 3. Génère l'affichage (Embed) et active la pagination (boutons "Précédent"/"Suivant") si nécessaire.
 * 4. Envoie le résultat dans le canal configuré et un accusé de réception à l'initiateur de la commande.
 */
export const leaderboard = async (interaction: CommandInteraction): Promise<void> => {
  const guildId = interaction.guildId;

  // Ligne de séparation pour les logs
  logger.info('-----------------------------------------------');
  logger.info(`Commande /leaderboard reçue - User: ${interaction.user.tag}, Guild: ${interaction.guild?.name || 'DM'}`);

  // 1. Vérification : doit être dans un serveur (pas en MP)
  if (!guildId) {
    logger.warn(`Commande exécutée hors d'un serveur - UserID: ${interaction.user.id}`);
    await interaction.reply({
      content: 'Cette commande doit être exécutée dans un serveur.',
      ephemeral: true,
    });
    return;
  }

  try {
    // Vérifie qu'un canal est configuré pour ce serveur
    const channelId = channelManager.getChannelIdForGuild(guildId);

    if (!channelId) {
      logger.warn(`Aucun canal configuré pour ce serveur - GuildID: ${guildId}`);
      await interaction.reply({
        content: "Aucun canal configuré pour ce serveur. Veuillez utiliser la commande `/startup` pour en configurer un.",
        ephemeral: true,
      });
      return;
    }

    // Vérifie la validité du canal configuré
    const targetChannel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
      logger.error(`Le canal configuré est invalide ou inaccessible - GuildID: ${guildId}, ChannelID: ${channelId}`);
      await interaction.reply({
        content: "Le canal configuré n'est pas valide ou n'est pas accessible.",
        ephemeral: true,
      });
      return;
    }

    // 2. Récupère la liste des utilisateurs (avec nb_fail) pour le classement
    logger.info(`Récupération des utilisateurs pour le classement - GuildID: ${guildId}`);
    const users = await User.findAll({
      where: { guildId },
      order: [['nb_fail', 'DESC']],
    });

    // Vérifie s'il y a au moins un utilisateur
    if (users.length === 0) {
      logger.info(`Aucun utilisateur enregistré dans le classement - GuildID: ${guildId}`);
      await interaction.reply('Aucun utilisateur enregistré.');
      return;
    }

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    let currentPage = 0;

    // Calcul du nombre total d'échecs, pour l'afficher en pied de page
    const totalFails = users.reduce((sum, user) => sum + user.nb_fail, 0);

    /**
     * Génère un Embed pour la page donnée.
     * @param {number} page - Index de la page (0-based).
     * @returns {EmbedBuilder} - L'embed prêt à être affiché.
     */
    const generateEmbed = (page: number): EmbedBuilder => {
      // Détermine la tranche d'utilisateurs à afficher
      const start = page * USERS_PER_PAGE;
      const end = start + USERS_PER_PAGE;
      const usersInPage = users.slice(start, end);

      // Crée un Embed
      const embed = new EmbedBuilder()
        .setTitle(LEADERBOARD_TITLE)
        .setColor('#FF0000')
        .setFooter({ text: `Page ${page + 1} sur ${totalPages} | Total des échecs : ${totalFails}` });

      // Remplit le champ "fields" de l'embed pour chaque utilisateur dans la tranche
      usersInPage.forEach((user, index) => {
        const rank = start + index + 1; // Position réelle dans le classement
        // Détermine l'émoji à afficher selon le rang
        const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '👤';
        const title = getUserTitle(user.nb_fail);
        const failWord = user.nb_fail === 1 ? 'échec' : 'échecs';
        embed.addFields({
          name: `${emoji} ${rank}. ${user.name}`,
          // Exemple si on veut afficher le titre : `${title} - **${user.nb_fail}** ${failWord}`
          value: `**${user.nb_fail}** ${failWord}`,
          inline: false,
        });
      });

      return embed;
    };

    /**
     * Génère une ligne de boutons (Précédent / Suivant) pour la pagination.
     * @param {number} page - Index de la page courante.
     * @returns {ActionRowBuilder<ButtonBuilder>} - Un conteneur d'éléments (ici, 2 boutons).
     */
    const generateButtons = (page: number): ActionRowBuilder<ButtonBuilder> => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('◀️ Précédent')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶️ Suivant')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );
    };

    // Préparation des boutons seulement si plus d'une page
    const components = totalPages > 1 ? [generateButtons(currentPage)] : [];

    // 3. Envoie du classement dans le canal configuré
    logger.info(`Envoi du classement dans le canal configuré - GuildID: ${guildId}, ChannelID: ${channelId}`);
    const message = await targetChannel.send({
      embeds: [generateEmbed(currentPage)],
      components,
    });

    // Envoie un message éphemeral à la personne ayant exécuté la commande, pour l'informer du succès
    await interaction.reply({
      content: `Le classement a été envoyé dans ${targetChannel.name}.`,
      ephemeral: true,
    });

    // 4. Si plus d'une page, on active le système de pagination
    if (totalPages > 1) {
      logger.info(`Activation de la pagination pour le classement - TotalPages: ${totalPages}, GuildID: ${guildId}`);
      const collector = message.createMessageComponentCollector({
        time: 60000, // Durée pendant laquelle les boutons sont actifs (en ms)
      });

      collector.on('collect', async (buttonInteraction) => {
        // Vérifie que seul l'auteur de la commande puisse utiliser la pagination
        if (buttonInteraction.user.id !== interaction.user.id) {
          logger.warn(`Tentative d'interaction non autorisée sur la pagination - UserID: ${buttonInteraction.user.id}, GuildID: ${guildId}`);
          await buttonInteraction.reply({
            content: "Vous ne pouvez pas contrôler cette pagination.",
            ephemeral: true,
          });
          return;
        }

        // Gestion du changement de page
        if (buttonInteraction.customId === 'previous' && currentPage > 0) {
          currentPage--;
        } else if (buttonInteraction.customId === 'next' && currentPage < totalPages - 1) {
          currentPage++;
        }

        logger.info(`Mise à jour de la pagination - CurrentPage: ${currentPage + 1}, TotalPages: ${totalPages}, User: ${buttonInteraction.user.tag}`);

        // Met à jour l'embed et les boutons
        await buttonInteraction.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      collector.on('end', async () => {
        logger.info(`Pagination terminée, désactivation des boutons - GuildID: ${guildId}`);
        // Désactive les boutons après la fin du timer
        await message.edit({ components: [] });
      });
    }
  } catch (error) {
    // En cas d'erreur (DB, permissions, etc.), on log et on informe l'utilisateur
    logger.error(`Erreur lors de la récupération du classement - GuildID: ${guildId}, Error: ${(error as Error).message}`);
    await interaction.reply('Erreur lors de la récupération du classement.');
  }

  logger.info('-----------------------------------------------');
};
