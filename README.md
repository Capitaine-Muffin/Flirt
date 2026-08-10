# Flirt.

**Se découvrir, tout simplement.**

Flirt est une app mobile (iOS + Android) à sortir pendant un rendez-vous :
elle propose des questions auxquelles les deux personnes répondent à tour de
rôle. Pas de score, pas de compte, pas de friction — on pose le téléphone
entre soi et la conversation démarre toute seule.

## 🎯 Le concept

- **Simple avant tout** : 3 tapes suffisent pour lancer une partie
  (prénoms → thèmes → jouer). L'app est pensée pour être dégainée en plein
  date sans mode d'emploi.
- **Une question à la fois**, en plein écran. Mécanique « Mix » : selon la
  nature de la question, elle s'adresse à une personne (« Question pour
  Léa ») ou aux deux (« Tu préfères », débats : « Question pour vous
  deux »). L'alternance des tours ne compte que les questions solo, pour
  rester équitable. On touche la carte pour passer à la suivante.
- **Des chapitres de 15 questions** : à la fin de chaque chapitre, une
  pause sobre (« Fin du chapitre. » — le point rosé de la marque, pas de
  cœurs) crée une respiration dans le date et un sentiment
  d'accomplissement. Les chapitres suivants piochent dans les questions
  pas encore vues — aucune répétition avant d'avoir épuisé la sélection.
- **On peut passer** une question qui ne convient pas (elle revient en fin
  de pioche, elle n'est pas perdue).
- **Des thèmes gradués en intensité** (🌶️ → 🌶️🌶️🌶️) : du brise-glace au
  « Un peu Hot », chacun choisit l'ambiance de la soirée.

## 📦 Les packs de questions

| Pack | Intensité | Accès |
|---|---|---|
| ❄️ Brise-glace (30 q.) | 🌶️ | Gratuit |
| 😄 Fun & Léger (30 q.) | 🌶️ | Gratuit |
| ⚖️ Tu préfères… (30 q.) | 🌶️ | Gratuit |
| ✈️ Voyages & Rêves (30 q.) | 🌶️🌶️ | Gratuit |
| 💖 Cœur à Cœur (150 q.) | 🌶️🌶️ | Bientôt |
| 🔥 Un peu Hot (150 q.) | 🌶️🌶️🌶️ | Bientôt |
| 😈 Vraiment Hot (150 q.) | 🌶️🌶️🌶️ | Bientôt |
| 🤔 Dilemmes & Débats (150 q.) | 🌶️🌶️ | Bientôt |
| 💍 Couple Confirmé (150 q.) | 🌶️🌶️ | Bientôt |

Soit **870 questions** écrites : 120 jouables dans la version 1.0, et 750
qui arriveront avec la mise à jour de monétisation.

Les questions vivent dans `src/data/questions.ts` — en ajouter un pack se
fait en quelques lignes, sans toucher au reste du code.

## 💰 Modèle économique

**Version 1.0 (première sortie) : tout est gratuit, sans publicité et
sans achat.** L'objectif est d'être en ligne, d'avoir de vrais
utilisateurs et les premiers avis. Les packs plus intenses sont annoncés
« bientôt » dans l'app, sans prix affiché tant que les produits n'existent
pas.

**Mise à jour suivante : la monétisation.** Achats uniques, pas
d'abonnement.

| Produit | ID produit | Prix visé |
|---|---|---|
| Pack de questions (×5, 150 q. chacun) | `flirt_pack_*` | 0,99 € |
| 💝 Bundle « Tout Flirt » | `flirt_bundle_tout` | 3,99 € |

Prix volontairement bas (0,99 € = achat impulsif sous le seuil de
réflexion) pour maximiser le volume au démarrage ; ils pourront remonter
depuis la Play Console sans mise à jour de l'app.

**Sur la publicité** : il n'y en a aucune, et c'est un argument de vente à
part entière (« sans pub, sans compte »). Si elle revenait un jour, la
règle d'or resterait qu'elle ne coupe jamais rien — jamais
d'interstitiel, jamais de vidéo.

## 🛠️ Stack technique

- **Expo (React Native) + TypeScript** — une seule base de code pour
  l'App Store et Google Play.
- **React Navigation** (stack natif) — Accueil → Nouvelle partie → Jeu, et
  Boutique.
- **AsyncStorage** — prénoms et achats mémorisés en local, zéro compte.
- **expo-haptics** — petit retour haptique à chaque carte.

```
src/
  data/questions.ts      # Les packs de questions (le contenu du jeu)
  state/AppContext.tsx   # État global persisté (packs débloqués)
  components/            # Button, PackCard
  screens/               # Home, Setup, Game, Shop (« Bientôt »)
```

## 🚀 Lancer en développement

```bash
npm install
npm start          # puis scanner le QR code avec Expo Go
```

## 📲 Publier sur les stores

**Google Play** : la marche à suivre complète est dans
[`docs/PLAY_STORE.md`](docs/PLAY_STORE.md) — compte développeur, textes de
la fiche, formulaires (sécurité des données, classification), visuels et
commandes EAS. La politique de confidentialité à héberger est
[`docs/confidentialite.html`](docs/confidentialite.html).

En résumé :

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview      # APK de test
eas build --platform android --profile production   # .aab pour Play
```

Penser à incrémenter `expo.android.versionCode` dans `app.json` à chaque
envoi sur Play.

**App Store** : à faire ensuite (compte Apple Developer à 99 $/an,
`ios.buildNumber` à ajouter dans `app.json`).

## 🗺️ Pistes pour la suite

- Packs saisonniers (Saint-Valentin, été…) pour créer du réachat.
- Mode « qui de nous deux » ou petits gages pour varier le rythme.
- Traductions (EN/ES) pour élargir le marché.
- Statistiques anonymes sur les questions les plus passées, pour améliorer
  le contenu.
