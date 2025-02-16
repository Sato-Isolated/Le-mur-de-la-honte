/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier définit les titres attribués aux utilisateurs en fonction du 
 *  nombre d’échecs accumulés. Plus un utilisateur échoue, plus son titre évolue.
 * 
 *  Les titres sont utilisés dans le leaderboard et dans les messages du bot
 *  pour ajouter un élément de progression et d'humour.
 ********************************************************************************/

/**
 * Objet contenant les titres attribués aux utilisateurs en fonction de leur nombre d'échecs.
 * 
 * @type {Record<number, string>}
 * 
 * Clés    : Nombre d'échecs nécessaires pour obtenir le titre.
 * Valeurs : Intitulé du titre correspondant.
 */
export const userTitles: Record<number, string> = {
  5: 'Débutant dans l’Art du Ratage',
  10: 'Juste le boss enfaite',
  25: 'Maître du "Presque Réussi"',
  50: 'Héraut des Fails Inoubliables',
  100: 'Seigneur des Échecs Mémorables',
  250: 'Architecte des Désastres Planifiés',
  300: 'Celui-qui-rate-tout',
  1000: 'Dieu des Râtés Légendaires',
};