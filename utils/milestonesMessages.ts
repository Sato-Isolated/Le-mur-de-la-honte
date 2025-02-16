/********************************************************************************
 * Description :
 * -----------
 *  Ce fichier définit les "milestones" (paliers d'échecs) pour lesquels un message
 *  spécial est envoyé lorsqu'un utilisateur atteint un certain nombre d'échecs
 *  cumulés sur le bot.
 * 
 *  Chaque milestone est une clé numérique correspondant à un nombre d'échecs,
 *  associée à un message humoristique pour "féliciter" l'utilisateur.
 ********************************************************************************/

/**
 * Objet contenant les milestones et leurs messages associés.
 * 
 * @type {Record<number, string>}
 * 
 * Clés    : Nombre d'échecs atteints.
 * Valeurs : Message de milestone envoyé lorsque l'utilisateur atteint ce palier.
 */
export const milestones: Record<number, string> = {
    15: 'On se demande si tu ne joues pas avec tes pieds.',
    25: 'Tu joues à Dofus ou tu es juste là pour tester les limites de tes mates ?',
    35: 'Même un Xélor ne voudrait pas revenir en arrière de peur de revivre la honte que tu proposes.',
    55: 'Tu es le genre de personne qui a besoin de 55 échecs pour comprendre que tu es mauvais.',
    65: 'J\'espère que tu gardes un carnet pour noter toutes tes prouesses d\'incompétence.',
    95: 'C\'était pas un chal, c\'était un test de patience pour tes coéquipiers.',
    115: 'Rater à ce niveau, c\'est plus de l\'acharnement, c\'est de l\'art.',
    130: 'Le vrai challenge, c\'est de comprendre comment t\'as réussi à installer le jeu.',
    150: 'C\'est pas une faille temporelle, c\'est juste toi qui es nul.',
};
