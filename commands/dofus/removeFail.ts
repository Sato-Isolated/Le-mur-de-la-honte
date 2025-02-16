/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /removefail sur Discord. Cette commande permet
 *  de retirer un ou deux échecs à un utilisateur, de mettre à jour la base de
 *  données en conséquence et d'envoyer un message dans le salon configuré.
 * 
 * Fonctionnement général :
 * 1. Récupère les paramètres : nom d'utilisateur, nombre d'échecs à retirer.
 * 2. Valide le contexte (exécuté dans un serveur, canal configuré, etc.).
 * 3. Met à jour les échecs de l'utilisateur dans la base de données (si trouvé).
 * 4. Envoie un message résumé de la mise à jour dans le canal désigné.
 ********************************************************************************/

import { 
  CommandInteraction, 
  CommandInteractionOptionResolver, 
  TextChannel, 
  ChannelType 
} from 'discord.js';
import { User } from '../../database/models';
import { ChannelConfigManager } from '../../utils/ChannelConfigManager';
import logger from '../../utils/logger'; // Import du logger
import { Sequelize, Op } from 'sequelize';

/**
 * Instance du gestionnaire de configuration de canal.
 * Permet de récupérer le salon configuré pour ce serveur.
 */
const channelManager = new ChannelConfigManager();

// Messages prédéfinis pour différents cas d'usage
const USER_NOT_FOUND_MESSAGE = (userName: string) => `L'utilisateur ${userName} n'existe pas.`;
const NO_FAILS_MESSAGE = (userName: string) => `${userName} n'a pas d'échecs à retirer.`;
const SUCCESS_MESSAGE = (userName: string, nbFail: number, removedFails: number) => 
  `${removedFails} échec${removedFails > 1 ? 's' : ''} a été retiré pour ${userName}. Total : ${nbFail}.`;
const ERROR_MESSAGE = 'Erreur lors du retrait de l\'échec.';

/**
 * Commande /removefail : Retire un ou deux échecs à un utilisateur.
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord ayant déclenché la commande.
 * 
 * Étapes principales :
 * 1. Vérifie que la commande est exécutée sur un serveur et que le salon est configuré.
 * 2. Recherche l'utilisateur ciblé dans la base de données.
 * 3. Retire le nombre d'échecs spécifié, dans la limite de ce qui est disponible.
 * 4. Envoie un message de confirmation dans le canal configuré et un accusé de réception (éphemeral) à l'auteur.
 */
export const removeFail = async (interaction: CommandInteraction): Promise<void> => {
  // Extraction et nettoyage du nom de l'utilisateur
  const userNameInput = (interaction.options as CommandInteractionOptionResolver).getString('name', true)?.trim();
  // Nombre d'échecs à retirer (1 ou 2)
  const failCount = (interaction.options as CommandInteractionOptionResolver).getInteger('amount') || 1;

  // Ligne de séparation pour les logs
  logger.info('-----------------------------------------------');
  logger.info(`Commande /removefail reçue - User: ${interaction.user.tag}, Guild: ${interaction.guild?.name || 'DM'}, Target: ${userNameInput}, FailCount: ${failCount}`);

  // Vérification de la présence du paramètre "name"
  if (!userNameInput) {
    await interaction.reply({ content: "Le nom de l'utilisateur est requis.", ephemeral: true });
    logger.warn('Nom d’utilisateur manquant.');
    return;
  }

  // Vérification du nombre d'échecs à retirer (1 <= failCount <= 2)
  if (failCount < 1 || failCount > 2) {
    logger.warn(`Validation échouée - Nombre d'échecs invalide. User: ${userNameInput}, FailCount: ${failCount}`);
    await interaction.reply({ content: 'Le nombre d\'échecs doit être entre 1 et 2.', ephemeral: true });
    return;
  }

  // Contexte : doit être exécuté dans un serveur
  const guildId = interaction.guildId;
  if (!guildId) {
    logger.warn(`Commande exécutée hors serveur - User: ${userNameInput}`);
    await interaction.reply({ content: 'Cette commande doit être exécutée dans un serveur.', ephemeral: true });
    return;
  }

  // Récupération du canal configuré pour ce serveur
  const channelId = channelManager.getChannelIdForGuild(guildId);
  if (!channelId) {
    logger.warn(`Aucun canal configuré pour ce serveur - GuildID: ${guildId}`);
    await interaction.reply({
      content: "Aucun canal configuré pour ce serveur. Veuillez utiliser la commande `/startup` pour en configurer un.",
      ephemeral: true,
    });
    return;
  }

  // Vérification du type et de l'existence du canal configuré
  const targetChannel = interaction.guild?.channels.cache.get(channelId) as TextChannel;
  if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
    logger.error(`Canal configuré invalide ou inaccessible - ChannelID: ${channelId}, GuildID: ${guildId}`);
    await interaction.reply({
      content: "Le canal configuré n'est pas valide ou n'est pas accessible.",
      ephemeral: true,
    });
    return;
  }

  try {
    // Recherche en base de l'utilisateur pour ce serveur
    logger.info(`Recherche de l'utilisateur dans la base de données - User: ${userNameInput}, GuildID: ${guildId}`);
    const user = await User.findOne({
      where: {
        guildId,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('name')),
            userNameInput.toLowerCase()
          ),
        ],
      },
    });

    // Si l'utilisateur n'existe pas
    if (!user) {
      logger.info(`Utilisateur introuvable - User: ${userNameInput}, GuildID: ${guildId}`);
      await interaction.reply({ content: USER_NOT_FOUND_MESSAGE(userNameInput), ephemeral: true });
      return;
    }

    // Retrait des échecs si l'utilisateur en a au moins un
    if (user.nb_fail > 0) {
      const oldNbFail = user.nb_fail;
      user.nb_fail = Math.max(0, user.nb_fail - failCount); // Empêche d'aller en négatif
      await user.save();

      logger.info(`Mise à jour des échecs réussie - User: ${userNameInput}, OldFails: ${oldNbFail}, NewFails: ${user.nb_fail}, RemovedFails: ${failCount}, GuildID: ${guildId}`);

      // Prépare le message de confirmation
      const response = SUCCESS_MESSAGE(user.name, user.nb_fail, failCount);

      // Envoi du message dans le canal configuré
      await targetChannel.send(response);
      logger.info(`Message envoyé dans le canal configuré - ChannelID: ${channelId}, GuildID: ${guildId}, User: ${user.name}, NewFails: ${user.nb_fail}`);

      // Réponse éphemeral dans le canal d'origine
      await interaction.reply({
        content: `Les échecs ont été retirés pour ${user.name} et le message a été envoyé dans ${targetChannel.name}.`,
        ephemeral: true,
      });
    } else {
      // Aucun échec à retirer
      logger.info(`Aucun échec à retirer pour l'utilisateur - User: ${user.name}, GuildID: ${guildId}`);
      await interaction.reply({ content: NO_FAILS_MESSAGE(user.name), ephemeral: true });
    }
  } catch (error) {
    // Gestion des erreurs (connexion DB, etc.)
    logger.error(`Erreur lors du traitement de la commande /removefail - Error: ${(error as Error).message}, User: ${userNameInput}, GuildID: ${guildId}`);
    await interaction.reply({ content: ERROR_MESSAGE, ephemeral: true });
  }

  logger.info('-----------------------------------------------');
};
