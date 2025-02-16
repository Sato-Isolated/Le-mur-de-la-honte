/********************************************************************************
 * Description :
 * -----------
 *  Cette classe gère la configuration du canal (channel) où le bot envoie ses
 *  messages pour chaque serveur (guild). Les informations sont enregistrées
 *  dans un fichier JSON (channel_ids.json).
 * 
 * Méthodes principales :
 *  1. getChannelIdForGuild   : Récupère l'ID du canal configuré pour un serveur.
 *  2. setChannelIdForGuild   : Définit l'ID du canal pour un serveur.
 *  3. removeChannelIdForGuild: Supprime la configuration du canal pour un serveur.
 * 
 *  Les méthodes loadConfig() et saveConfig() assurent la persistance des
 *  données dans le fichier JSON spécifié.
 ********************************************************************************/

import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger'; // Import du logger

/**
 * Classe ChannelConfigManager
 * ---------------------------
 * Gère le canal configuré pour chaque serveur (guild).
 */
export class ChannelConfigManager {
  // Le chemin vers le fichier de configuration (channel_ids.json)
  private configFilePath: string;

  /**
   * Constructeur
   * Initialise la classe et définit le chemin du fichier JSON contenant la config.
   */
  constructor() {
    this.configFilePath = path.join(__dirname, '..', 'commands', 'dofus', 'channel_ids.json');
    logger.info('-----------------------------------------------');
    logger.info('ChannelConfigManager initialisé.', { configFilePath: this.configFilePath });
    logger.info('-----------------------------------------------');
  }

  /**
   * getChannelIdForGuild
   * --------------------
   * Récupère l'ID du canal configuré pour un serveur donné.
   * 
   * @param {string} guildId - L'ID du serveur Discord.
   * @returns {string | null} - L'ID du canal si configuré, sinon null.
   */
  public getChannelIdForGuild(guildId: string): string | null {
    logger.info('-----------------------------------------------');
    try {
      const data = this.loadConfig();
      const channelId = data[guildId] || null;
      logger.info('ID du canal récupéré pour le serveur.', { guildId, channelId });
      return channelId;
    } catch (error) {
      logger.error('Erreur lors de la récupération du canal pour le serveur.', { guildId, error });
      return null;
    } finally {
      logger.info('-----------------------------------------------');
    }
  }

  /**
   * setChannelIdForGuild
   * --------------------
   * Définit l'ID d'un canal pour un serveur et le sauvegarde dans le fichier JSON.
   * 
   * @param {string} guildId   - L'ID du serveur Discord.
   * @param {string} channelId - L'ID du canal textuel Discord à enregistrer.
   */
  public setChannelIdForGuild(guildId: string, channelId: string): void {
    logger.info('-----------------------------------------------');
    try {
      const data = this.loadConfig();
      data[guildId] = channelId;
      this.saveConfig(data);
      logger.info('Canal configuré pour le serveur.', { guildId, channelId });
    } catch (error) {
      logger.error('Erreur lors de la configuration du canal pour le serveur.', { guildId, channelId, error });
    } finally {
      logger.info('-----------------------------------------------');
    }
  }

  /**
   * removeChannelIdForGuild
   * -----------------------
   * Supprime la configuration d'un canal pour un serveur donné.
   * 
   * @param {string} guildId - L'ID du serveur Discord.
   */
  public removeChannelIdForGuild(guildId: string): void {
    logger.info('-----------------------------------------------');
    try {
      const data = this.loadConfig();
      if (data[guildId]) {
        delete data[guildId];
        this.saveConfig(data);
        logger.info('Canal supprimé pour le serveur.', { guildId });
      } else {
        logger.warn('Aucun canal configuré à supprimer pour le serveur.', { guildId });
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression du canal pour le serveur.', { guildId, error });
    } finally {
      logger.info('-----------------------------------------------');
    }
  }

  /**
   * loadConfig
   * ----------
   * Charge la configuration depuis le fichier JSON.
   * 
   * @returns {Record<string, string>} - Un objet dont les clés sont les IDs de guild
   *                                     et la valeur l'ID de canal configuré.
   */
  private loadConfig(): { [key: string]: string } {
    logger.info('-----------------------------------------------');
    try {
      if (fs.existsSync(this.configFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
        logger.info('Fichier de configuration chargé avec succès.', { configFilePath: this.configFilePath });
        return data;
      }
      logger.warn('Fichier de configuration inexistant, création d\'une structure vide.', { configFilePath: this.configFilePath });
      return {};
    } catch (error) {
      logger.error('Erreur lors du chargement du fichier de configuration.', { configFilePath: this.configFilePath, error });
      return {};
    } finally {
      logger.info('-----------------------------------------------');
    }
  }

  /**
   * saveConfig
   * ----------
   * Sauvegarde la configuration (objet) dans le fichier JSON.
   * 
   * @param {Record<string, string>} data - L'objet contenant la config actuelle (guildId -> channelId).
   */
  private saveConfig(data: { [key: string]: string }): void {
    logger.info('-----------------------------------------------');
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(data, null, 2), 'utf8');
      logger.info('Fichier de configuration sauvegardé avec succès.', { configFilePath: this.configFilePath });
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du fichier de configuration.', { configFilePath: this.configFilePath, error });
    } finally {
      logger.info('-----------------------------------------------');
    }
  }
}
