/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier charge les variables d'environnement stockées dans un fichier 
 *  `.env` et les exporte en tant que constantes accessibles dans l'application.
 * 
 *  • BOT_TOKEN  : Token du bot Discord (obligatoire pour l'authentification).
 *  • CLIENT_ID  : ID du bot Discord (nécessaire pour certaines commandes).
 *  • GUILD_ID   : ID du serveur Discord (utilisé pour l'enregistrement des commandes).
 ********************************************************************************/

import { config } from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env
config();

/**
 * Token du bot Discord.
 * Récupéré depuis le fichier `.env` et utilisé pour l'authentification.
 */
export const BOT_TOKEN: string = process.env.BOT_TOKEN as string;

/**
 * ID unique du bot Discord.
 * Utilisé pour enregistrer les commandes slash au niveau global ou guild.
 */
export const CLIENT_ID: string = process.env.CLIENT_ID as string;

/**
 * ID du serveur Discord (facultatif).
 * Peut être utilisé pour l'enregistrement des commandes spécifiques à une guild.
 */
export const GUILD_ID: string = process.env.GUILD_ID as string;
