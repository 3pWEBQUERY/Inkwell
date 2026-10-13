import type { LegalDocument } from './types';

export const privacyFr: LegalDocument = {
  title: 'Déclaration de protection des données',
  updated: '2026-10-13',
  intro:
    'Cette déclaration explique en langage clair quelles données nous traitons, dans quel but, pendant combien de temps, et ce que nous ne faisons pas. Elle s’applique selon la loi fédérale suisse sur la protection des données (LPD) et, dans la mesure applicable, selon le RGPD.',
  sections: [
    {
      title: 'Responsable du traitement',
      paragraphs: [
        'Le responsable est la société mentionnée dans les mentions légales, avec la personne qui y est indiquée. Nous répondons aux questions sur la protection des données par e-mail à l’adresse de contact figurant dans les mentions légales.',
      ],
    },
    {
      title: 'Ce que nous voyons en clair et ce que nous ne voyons pas',
      paragraphs: [
        '- Textes privés : nous ne les voyons jamais. Ils sont chiffrés dans ton navigateur avec une clé qui se trouve uniquement sur ton appareil. Le serveur stocke le texte chiffré, le nonce et une clé de contenu chiffrée. Pas de titre, pas d’aperçu, pas de nombre de mots.',
        '- Brouillons : ils ne quittent jamais le navigateur. Ils sont stockés chiffrés dans la base de données locale du navigateur.',
        '- Textes partagés (anonymement ou avec profil) : nous les voyons en clair. Ils doivent être diffusés et modérés.',
        '- Adresse e-mail : nous la stockons en clair pour la connexion et, en plus, sous forme de valeur hachée pour la recherche.',
        '- Clés d’accès (passkeys) : nous ne stockons que la clé publique. La clé privée reste sur ton appareil.',
        '- Pseudonyme, avatar, langues, réglages : en clair, ils font partie du profil.',
        '- Réactions, votes, commentaires, appartenances aux salons : en clair, ils constituent la fonctionnalité.',
        '- Progression de lecture et index de recherche : uniquement dans ton navigateur.',
        '- Web Push : nous stockons l’abonnement de ton navigateur. Le contenu d’une notification est chiffré de bout en bout selon la RFC 8291 ; le service push du fabricant de ton navigateur ne le voit pas.',
      ],
    },
    {
      title: 'La limite du chiffrement dans le navigateur, en toute honnêteté',
      paragraphs: [
        'Le chiffrement dans le navigateur protège contre les fuites de base de données, contre les sauvegardes, contre l’hébergeur et contre nous-mêmes en tant qu’exploitants curieux. Il ne protège pas contre un serveur compromis qui diffuserait du code JavaScript manipulé, car c’est nous qui livrons ce code. Pour y répondre, nous appliquons une Content Security Policy stricte avec des nonces, nous publions l’identifiant de build de chaque version dans le changelog et nous travaillons à une app native avec des binaires signés et vérifiables.',
      ],
    },
    {
      title: 'Anonyme vis-à-vis des autres, pas vis-à-vis de nous',
      paragraphs: [
        'Les textes partagés anonymement ne portent vers l’extérieur ni pseudonyme ni profil ; le lien est supprimé sur le serveur avant la diffusion du texte. En interne, le lien avec ton compte est conservé, afin que les blocages soient effectifs et que les abus restent traçables.',
      ],
    },
    {
      title: 'Finalités et bases légales',
      paragraphs: [
        '- Mise à disposition de l’app et de ton compte : exécution du contrat.',
        '- Modération, blocages, signalements : intérêt légitime à un fonctionnement sûr.',
        '- Notifications : uniquement avec ton consentement, par salon et révocable à tout moment.',
        '- Statistiques d’utilisation agrégées côté serveur, sans profilage : intérêt légitime au développement du service.',
      ],
    },
    {
      title: 'Durée de conservation',
      paragraphs: [
        '- Compte et textes : jusqu’à ce que tu les supprimes.',
        '- Textes brûlés : supprimés immédiatement, et des sauvegardes au plus tard après 30 jours.',
        '- Compte supprimé : délai de rétractation de 30 jours, puis suppression définitive, et des sauvegardes après 30 jours supplémentaires, soit au plus tard 60 jours après la demande.',
        '- Codes de connexion : 24 heures.',
        '- Exports : 24 heures, puis suppression automatique.',
        '- Journaux du serveur : 7 jours, sans adresses IP complètes au-delà de cette période.',
        '- Signalements et décisions de modération : aussi longtemps que le compte concerné existe.',
      ],
    },
    {
      title: 'Hébergement et destinataires',
      paragraphs: [
        'L’app fonctionne sur Railway dans la région UE (Amsterdam). Le stockage d’objets pour les avatars et les exports se trouve également dans l’UE. Les seuls autres destinataires sont : Apple pour « Se connecter avec Apple », notre service d’envoi d’e-mails hébergé dans l’UE pour les codes de connexion et les communications, et les services push des fabricants de navigateurs. Il n’y a aucun service d’analyse, aucun réseau publicitaire et aucun cookie tiers.',
      ],
    },
    {
      title: 'Cookies et stockage local',
      paragraphs: [
        '- Cookie de session : HttpOnly, Secure, 30 jours. Nécessaire pour la connexion.',
        '- Cookie d’appareil : un identifiant aléatoire, utilisé sous forme hachée pour la limitation du débit. Aucun suivi entre les sites web.',
        '- Cookie de langue : la langue que tu as choisie.',
        '- Base de données locale du navigateur : les brouillons, ta clé, l’index de recherche, la progression de lecture et la file d’attente des publications hors ligne.',
      ],
    },
    {
      title: 'Tes droits',
      paragraphs: [
        'Accès et portabilité des données : export au format ZIP dans l’app, à tout moment. Suppression : supprimer le compte dans l’app, sans e-mail au support. Rectification : tu modifies toi-même ton pseudonyme, ton e-mail et tes réglages. Retrait du consentement : désactiver les notifications par salon. Réclamation : auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT) ou, pour les personnes dans l’UE, auprès de l’autorité de contrôle compétente.',
      ],
    },
    {
      title: 'Ce que nous ne faisons pas',
      paragraphs: [
        'Nous ne vendons pas de données. Nous n’affichons pas de publicité. Nous n’entraînons pas de modèles d’IA avec tes textes, ni privés ni partagés. Nous n’évaluons pas automatiquement les textes partagés par logiciel ; les signalements sont examinés par des humains.',
      ],
    },
  ],
};
