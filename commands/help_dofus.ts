/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /helpdofus sur Discord. Cette commande fournit
 *  un embed listant les différentes commandes disponibles pour la partie Dofus
 *  du bot, ainsi qu'une brève description de chacune.
 ********************************************************************************/

import { CommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * Commande /helpdofus : Affiche la liste des commandes spécifiques à Dofus.
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord liée à la commande /helpdofus.
 */
export const HelpDofus = async (interaction: CommandInteraction): Promise<void> => {
  // Création d'un Embed pour présenter les commandes Dofus
  const embed = new EmbedBuilder()
    .setTitle('Help - Dofus')
    .setDescription('Voici la liste des commandes disponibles du bot pour Dofus')
    .setColor(0x97DBFC) // Couleur au format hexadécimal (0xRRGGBB) ou numéraire
    .addFields(
      {
        name: '/addfail <utilisateur> <quantité>',
        value: 'Ajoute un ou plusieurs challenges ratés à un utilisateur.\n' +
               "• La quantité peut être 1 ou 2 (par défaut 1 si non spécifié).\n" +
               "• La liste des utilisateurs se met à jour toutes les 10 minutes."
      },
      {
        name: '/removefail <utilisateur> <quantité>',
        value: 'Retire un ou plusieurs challenges ratés d’un utilisateur.\n' +
               "• La quantité peut être 1 ou 2 (par défaut 1 si non spécifié).\n" +
               "• La liste des utilisateurs se met à jour toutes les 10 minutes."
      },
      {
        name: '/leaderboard',
        value: 'Affiche le mur de la honte, c’est-à-dire le classement des échecs enregistrés.'
      }
    )
    .setThumbnail('https://i.imgur.com/k1dikcw.png'); // Petite image illustrant l'Embed

  // Envoi de l'Embed en réponse à la commande
  await interaction.reply({ embeds: [embed] });
};
