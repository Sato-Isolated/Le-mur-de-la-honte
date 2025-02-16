/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier met en place un logger basé sur Winston pour le bot Discord.
 *  Il permet d'enregistrer les logs :
 *   • En console (pour le suivi en temps réel).
 *   • Dans des fichiers journaliers (rotation automatique des logs).
 * 
 *  Winston-Daily-Rotate-File est utilisé pour gérer la rotation des logs,
 *  avec une conservation des logs pendant 14 jours et une taille maximale
 *  de 20 Mo par fichier.
 ********************************************************************************/

import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

/**
 * Création de l'instance du logger Winston.
 * 
 * • Le format est composé :
 *    - d'un timestamp (`YYYY-MM-DD HH:mm:ss`),
 *    - du niveau de log (`INFO`, `ERROR`, etc.),
 *    - du message de log.
 * 
 * • Les logs sont envoyés :
 *    - En console pour un suivi en temps réel.
 *    - Dans des fichiers journaliers (logs/app-YYYY-MM-DD.log).
 * 
 * • Configuration des fichiers :
 *    - Chaque fichier est limité à 20 Mo.
 *    - Les logs sont conservés pendant 14 jours.
 */
const logger = createLogger({
  level: 'info', // Niveau minimum de logs affichés

  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Format du timestamp
    format.printf(({ timestamp, level, message }) => 
      `${timestamp} [${level.toUpperCase()}]: ${message}`
    ) // Format du message final
  ),

  transports: [
    // Transport Console (Affichage en temps réel dans la console)
    new transports.Console(),

    // Transport Fichier (Rotation automatique des logs journaliers)
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log', // Chemin et nom du fichier
      datePattern: 'YYYY-MM-DD', // Formatage de la date dans le nom du fichier
      maxSize: '20m', // Taille maximale d'un fichier log (20 Mo)
      maxFiles: '14d', // Conservation des logs sur 14 jours
    }),
  ],
});

// Export du logger pour une utilisation dans tout le projet
export default logger;
