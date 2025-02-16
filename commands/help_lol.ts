/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier gère la commande /helplol sur Discord. Cette commande fournit
 *  un embed listant les différentes commandes disponibles pour la partie League
 *  of Legends du bot, ainsi qu'une brève description de chacune.
 ********************************************************************************/

import { CommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * Commande /helplol : Affiche la liste des commandes spécifiques à League of Legends.
 * 
 * @param {CommandInteraction} interaction - L'interaction Discord liée à la commande /helplol.
 */
export const HelpLoL = async (interaction: CommandInteraction): Promise<void> => {
  // Création d'un Embed pour présenter les commandes LoL
  const embed = new EmbedBuilder()
    .setTitle('Help - League of Legends')
    .setDescription('Voici la liste des commandes disponibles du bot pour League of Legends')
    .setColor(0x97DBFC) // Couleur (hex: #97DBFC)
    .addFields({
      name: '/aram <champion>',
      value: 'Affiche les informations ARAM (buffs et nerfs) pour le champion spécifié.'
    })
    .setThumbnail('https://i.imgur.com/dijtXOJ.png'); // Illustration pour l'Embed

  // Envoi de l'Embed en réponse à la commande
  await interaction.reply({ embeds: [embed] });
};
