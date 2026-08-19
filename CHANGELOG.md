# Changelog

## [Unreleased]

- Achats intégrés prêts pour la production : l'app bascule toute seule entre
  la simulation (Expo Go, aucun paiement réel) et les vrais paiements
  Google Play / App Store dès qu'une clé RevenueCat est fournie au build.
- Les prix affichés viennent désormais du store quand il répond (donc
  localisés et modifiables sans mise à jour de l'app) ; les prix codés dans
  l'app ne servent plus que de repli.
- Au lancement, les achats sont revérifiés auprès du store : un achat se
  retrouve après une réinstallation ou sur un nouveau téléphone.
- Une annulation de paiement n'affiche plus de message d'erreur, et un
  bundle débloque bien tout ce qu'il contient.
- Nouveau dossier `server/` : backend facultatif qui reçoit les webhooks
  RevenueCat et sait vérifier un achat auprès de Google Play.
- Nouveau document `docs/ACHATS_INTEGRES.md` : ce qui doit être décidé
  avant le premier envoi sur le Play Store.

## [0.6.0] — 2026-08-03

- Version finale simplifiée : le jeu se joue sans prénoms et sans
  chapitres — les cartes défilent en continu jusqu'à épuisement des
  questions (app + démo web).
- L'écran « Réglages » (interrupteurs Prénoms & Chapitres) et l'écran
  « Donner ton avis » disparaissent de la démo web.

## [0.5.5] — 2026-07-31

- Par défaut, prénoms et chapitres sont désactivés (activables dans les
  réglages). Les testeurs ayant déjà fait un choix le conservent.

## [0.5.4] — 2026-07-31

- L'app installée se met vraiment à jour au lancement : le service worker
  revalide chaque fichier auprès du serveur au lieu de resservir la copie
  locale « encore valable ».

## [0.5.3] — 2026-07-31

- Sortie technique sans changement : sert à vérifier que l'app installée
  se met bien à jour.

## [0.5.2] — 2026-07-31

- On peut redonner un avis : après le « Merci », le bouton d'envoi
  redevient actif au bout de quelques secondes.

## [0.5.1] — 2026-07-31

- Le retour testeur s'envoie silencieusement (service Web3Forms) : plus
  d'application e-mail qui s'ouvre — un tap sur « Envoyer », un merci, et
  la réponse arrive par e-mail au développeur.

## [0.5.0] — 2026-07-31

- La démo web devient LA version de test : un écran « Réglages » avec deux
  interrupteurs (Prénoms & tours de parole, Chapitres), mémorisés sur le
  téléphone — les 4 combinaisons dans une seule page.
- Écran « Donner ton avis » : préférences en deux taps + texte libre,
  envoyé par e-mail prérempli au développeur. Accessible depuis l'accueil
  et la fin de partie.
- Les pages variantes `sanschapitre/` et `sansprenom/` sont supprimées
  (remplacées par les réglages) — leurs URL ne répondent plus.

## [0.4.1] — 2026-07-31

- La variante « sans prénom » perd aussi les chapitres : les cartes
  défilent en continu, sans pause ni compteur.
- La variante « sans prénom » perd son s : dossier renommé
  `docs/sansprenom/` (l'URL change), textes corrigés.

## [0.4.0] — 2026-07-31

- Troisième mode jouable en test dans la démo web : « sans prénoms »
  (`docs/sansprenoms/`) — pas de saisie des prénoms, questions non
  attribuées : une carte, une question, et les joueurs décident qui répond.

## [0.3.2] — 2026-07-31

- Le numéro de version s'affiche : en bas de l'accueil de l'app (lu depuis
  `app.json`) et dans le bandeau haut des deux démos web.

## [0.3.1] — 2026-07-31

- Démos web : le bouton « C'est parti ! » flotte en bas de l'écran des
  thèmes — plus besoin de descendre toute la liste pour lancer la partie.

## [0.3.0] — 2026-07-31

- Nouvelle icône « F. » (monogramme serif, point rose, fond nuit) : icône
  d'app, icônes adaptatives Android, splash, favicon et icônes web.

## [0.2.1] — 2026-07-31

- Le nombre de questions n'apparaît plus non plus en boutique : on achète
  un thème, pas un nombre de questions (app + les deux démos web).

## [0.2.0] — 2026-07-31

- Nouveau mode jouable en test dans la démo web : « sans chapitres »
  (`docs/sanschapitre/`) — les cartes défilent en continu, sans pause ni
  compteur, jusqu'à épuisement des questions.

## [0.1.3] — 2026-07-31

- Démo web : sur iPhone, affichage de la marche à suivre pour installer le
  jeu (Partager → « Sur l'écran d'accueil »), Safari n'ayant pas de popup
  d'installation.

## [0.1.2] — 2026-07-31

- La démo web devient installable sur téléphone (PWA) : manifeste, service
  worker et bouton « Installer sur l'écran d'accueil » sur Android.

## [0.1.1] — 2026-07-31

- Chapitres de 5 questions au lieu de 15.
- La démo web rejoint le dépôt (`docs/index.html`) pour être publiée via
  GitHub Pages.
- Le nombre de questions n'est plus affiché sur l'écran de choix des thèmes
  (cartes et bouton « C'est parti ! »).

## [0.1.0] — 2026-07-31

Première version jouable : jeu de questions par chapitres, écrans app + démo web.
