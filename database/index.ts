/******************************************************************************** 
 * Description :
 * -----------
 *  Ce fichier initialise une instance de Sequelize pour une base de données SQLite,
 *  en spécifiant :
 *   • Le dialecte (sqlite).
 *   • Le chemin vers le fichier de stockage (database.sqlite).
 *   • Le niveau de logs.
 *   • Les paramètres du pool de connexions et la stratégie de retry.
 ********************************************************************************/

import { Sequelize } from 'sequelize';

/**
 * Instance de Sequelize connectée à une base de données SQLite.
 * 
 * @property {string} dialect  - Le dialecte de la base de données (sqlite).
 * @property {string} storage  - Le chemin vers le fichier SQLite.
 * @property {boolean} logging - Désactivation des logs de requêtes SQL (false).
 * @property {object} pool     - Paramètres de pool (nombre de connexions, temps max, etc.).
 * @property {object} retry    - Paramètres de re-tentative de connexion en cas d'échec.
 */
export const sequelize = new Sequelize({
  // Définition du dialecte à utiliser : SQLite
  dialect: 'sqlite',

  // Chemin où sera stockée la base de données SQLite
  storage: 'database.sqlite',

  // Désactive les logs des requêtes SQL dans la console
  logging: false,

  // Configuration du pool de connexions
  pool: {
    // Nombre maximum de connexions simultanées dans le pool
    max: 5,
    // Nombre minimum de connexions simultanées dans le pool
    min: 0,
    // Temps maximum (en ms) pendant lequel le pool attend avant de lancer une erreur
    // si aucune connexion n'est disponible
    acquire: 30000,
    // Temps maximum (en ms) pendant lequel une connexion peut rester inactive
    // avant d'être libérée
    idle: 10000,
  },

  // Configuration des tentatives de reconnexion
  retry: {
    // Nombre maximum de tentatives de reconnexion en cas d'échec
    max: 3,
  },
});
