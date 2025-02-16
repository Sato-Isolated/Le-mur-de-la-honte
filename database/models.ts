/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier définit le modèle User pour Sequelize. Un "User" correspond à un
 *  utilisateur dans un serveur Discord, disposant de propriétés telles que son
 *  nom, son nombre d'échecs (nb_fail) et l'ID du serveur (guildId).
 * 
 *  Le modèle est synchronisé avec la base de données SQLite configurée dans
 *  index.ts (fichier de configuration Sequelize).
 ********************************************************************************/

import { DataTypes, Model } from 'sequelize';
import { sequelize } from './index';

/**
 * Classe User (Modèle Sequelize)
 * -----------------------------
 * @property {number} id       - Clé primaire auto-incrémentée.
 * @property {string} name     - Nom de l'utilisateur (dans le contexte du bot).
 * @property {number} nb_fail  - Nombre d'échecs accumulés (challenges ratés, etc.).
 * @property {string} guildId  - Identifiant du serveur Discord (guild) auquel l'utilisateur est associé.
 */
export class User extends Model {
  declare id: number;
  declare name: string;
  declare nb_fail: number;
  declare guildId: string;
}

// Initialisation du modèle User
User.init(
  {
    // Définition des champs / colonnes
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nb_fail: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    // Options du modèle
    sequelize,
    modelName: 'User',
    timestamps: false, // Désactive les colonnes createdAt et updatedAt
    indexes: [
      {
        unique: true,
        fields: ['name', 'guildId'], // Unicité de l'association (name, guildId)
      },
    ],
  }
);

// Exporte le modèle pour pouvoir l'utiliser ailleurs dans le code
export default User;

/**
 * Synchronise le modèle avec la base de données.
 * 
 * Note : Généralement, vous pourriez vouloir exécuter cette synchronisation
 * en dehors du fichier de définition du modèle, afin de mieux maîtriser 
 * quand et comment la synchronisation est effectuée (ex: dans un script d'initialisation).
 */
sequelize.sync();
