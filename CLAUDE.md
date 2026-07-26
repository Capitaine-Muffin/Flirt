# Flirt

App mobile React Native / Expo : jeu de questions pour se découvrir pendant un date.

## Style de réponse

Réponses **courtes**. Va droit au but.

- Pas de récapitulatif après chaque action : dis ce qui est fait en une phrase.
- Pas de tableau ni de liste d'options si on ne t'en demande pas.
- Pas de « pour aller plus loin », pas de suggestions non sollicitées.
- Si une question a une réponse en une ligne, réponds en une ligne.

## À savoir sur le projet

- Toutes les chaînes sont en dur en français dans le JSX, il n'y a pas d'i18n.
- Les textes existent en double : l'app (`src/screens/`) et la démo web publiée
  (page HTML autonome, hors dépôt). Modifier un texte = le modifier aux deux endroits.
- `src/services/ads.ts` et `src/services/purchases.ts` sont des mocks, pas de SDK natif.
  L'app tourne donc dans Expo Go sans build.
