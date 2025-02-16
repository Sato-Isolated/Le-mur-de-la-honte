# Dofus-Discord

Ce projet est un bot Discord qui gère différents aspects pour le jeu Dofus (et d'autres fonctionnalités League of Legends), notamment :
- Un système de suivi des échecs (challenges ratés) sur Dofus.
- Un classement (leaderboard) affichant le nombre total d'échecs par utilisateur.
- Un module pour récupérer et afficher les buffs/nerfs en ARAM sur League of Legends.
- Une gestion flexible des canaux où le bot peut poster ses messages.

## Sommaire

- [Dofus-Discord](#dofus-discord)
  - [Sommaire](#sommaire)
  - [Description Générale](#description-générale)
  - [Fonctionnalités Principales](#fonctionnalités-principales)
    - [Dofus](#dofus)
    - [League of Legends (ARAM)](#league-of-legends-aram)
    - [Configuration du Bot](#configuration-du-bot)
  - [Pré-requis](#pré-requis)
  - [Installation](#installation)
  - [Configuration et Variables d'Environnement](#configuration-et-variables-denvironnement)
  - [Utilisation](#utilisation)
  - [Structure du Projet](#structure-du-projet)
  - [Informations Complémentaires](#informations-complémentaires)
    - [Bon jeu !](#bon-jeu-)

---

## Description Générale

Ce bot Discord a pour but d'enregistrer et de comptabiliser les échecs (challenges ratés) de vos amis ou membres de guilde sur Dofus. Initialement, l'idée était de se connecter à une API du jeu pour automatiser la récupération des échecs, mais l'absence d'API publique nous oblige à saisir manuellement chaque échec via des commandes slash sur Discord.

Par ailleurs, le bot propose également une fonctionnalité pour League of Legends (mode ARAM) permettant d'afficher les buffs/nerfs d'un champion.

---

## Fonctionnalités Principales

### Dofus

- **/addfail `<utilisateur>` `<quantité>`**  
  Ajoute 1 ou 2 échecs (challenges ratés) à un utilisateur.

- **/removefail `<utilisateur>` `<quantité>`**  
  Retire 1 ou 2 échecs à un utilisateur.

- **/leaderboard**  
  Affiche un classement (mur de la honte) trié par nombre d'échecs.

- **/helpdofus**  
  Liste les commandes Dofus disponibles.

### League of Legends (ARAM)

- **/aram `<champion>`**  
  Affiche les buffs/nerfs (dégâts infligés, dégâts subis, autres modifications) pour le champion spécifié en ARAM.

- **/helplol**  
  Liste les commandes League of Legends disponibles.

### Configuration du Bot

- **/startup**  
  Permet de définir le canal textuel dans lequel le bot enverra les messages relatifs aux échecs (ou au leaderboard).

---

## Pré-requis

- **[Bun](https://bun.sh)** (version 1.1.33 ou supérieure) : un runtime JavaScript/TypeScript rapide qui va gérer l’installation et l’exécution des scripts.  
- **Un serveur Discord** où vous avez les droits pour ajouter un bot et enregistrer des commandes slash.  
- **Un Token de bot Discord** (disponible sur le [portail développeur Discord](https://discord.com/developers/applications)).  

---

## Installation

Clonez ce dépôt, puis exécutez :

```bash
bun install
```

Cela installera toutes les dépendances nécessaires.

---

## Configuration et Variables d'Environnement

Le bot utilise un fichier `.env` pour charger vos variables d’environnement :

```ini
# .env
BOT_TOKEN=VotreTokenDeBotIci
CLIENT_ID=VotreClientIDIci
GUILD_ID=VotreGuildIDIci
```

---

## Utilisation

Une fois installé et configuré, lancez le bot avec :

```bash
bun run index.ts
```

Le bot démarrera et se connectera à Discord.

---

## Structure du Projet

- **index.ts** : Point d'entrée du bot.
- **config/** : Gestion des variables d'environnement.
- **database/** : Gestion des utilisateurs et de la base SQLite.
- **commands/** : Dossier contenant les commandes pour Dofus et LoL.
- **utils/** : Fichiers d'utilitaires (logs, gestion des canaux, etc.).
- **champions.json** : Données ARAM des champions LoL.

---

## Informations Complémentaires

- **Logs** : Gérés via Winston (`logs/app-YYYY-MM-DD.log`).
- **Base de données** : SQLite, synchronisation automatique.
- **Données ARAM** : Scrappées depuis [aramnerfs.com](https://aramnerfs.com/) avec `scrape_champions.py`.

---

### Bon jeu !  
Si vous avez des questions ou souhaitez contribuer, ouvrez une *issue* ou proposez une *pull request*. Have fun !
