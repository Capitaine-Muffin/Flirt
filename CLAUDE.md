# Flirt

App mobile React Native / Expo : jeu de questions pour se découvrir pendant un date.

## Style de réponse

Réponses **courtes**. Va droit au but.

- Pas de récapitulatif après chaque action : dis ce qui est fait en une phrase.
- Pas de tableau ni de liste d'options si on ne t'en demande pas.
- Pas de « pour aller plus loin », pas de suggestions non sollicitées.
- Si une question a une réponse en une ligne, réponds en une ligne.

## Suivi du travail

Ce qui reste à faire va dans les **issues GitHub** du dépôt, pas seulement dans
la réponse.

- Une issue par tâche, en français, avec des cases à cocher pour les étapes.
- Regarder les issues existantes avant d'en créer : pas de doublon.
- Citer les issues liées par leur numéro (`#27`) plutôt que de répéter le contenu.

## À savoir sur le projet

- Toutes les chaînes sont en dur en français dans le JSX, il n'y a pas d'i18n.
- Les textes existent en double : l'app (`src/screens/`) et la démo web
  (`docs/index.html`, page HTML autonome). Modifier un texte = le modifier aux
  deux endroits.
- Aucun SDK natif tiers : ni publicité, ni achats in-app. L'app tourne donc dans
  Expo Go sans build.
