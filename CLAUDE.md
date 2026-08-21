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
- `src/services/ads.ts` suit le même principe que les achats : cadre de
  simulation sans SDK natif (Expo Go), vraies bannières AdMob dans un build natif.
  `app.config.js` n'ajoute le plugin que si un App ID est fourni.
- `src/services/purchases.ts` bascule tout seul : simulation tant qu'il n'y a ni
  module natif ni clé RevenueCat (Expo Go), vrais paiements dans un build natif.
  L'app tourne donc toujours dans Expo Go sans build.
- `server/` est un backend facultatif (webhooks RevenueCat), sans dépendances,
  testé avec `node --test`. Voir `docs/ACHATS_INTEGRES.md`.

## Publier

Les builds se font **en local**, jamais avec un crédit EAS :
`node tools/build-aab.mjs <versionCode>`.

- `docs/BUILD.md` — fabriquer l'`.aab`, et les pièges propres à Expo.
- [publier-sur-play](https://github.com/Capitaine-Muffin/publier-sur-play) —
  la procédure Store, commune à tous les jeux : prix hors taxes, droits
  RevenueCat, déclarations qui bloquent l'envoi sans apparaître.
