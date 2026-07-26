# 💘 Flirt

**Le jeu qui transforme un date en vraie rencontre.**

Flirt est une app mobile (iOS + Android) à sortir pendant un rendez-vous :
elle propose des questions auxquelles les deux personnes répondent à tour de
rôle. Pas de score, pas de compte, pas de friction — on pose le téléphone
entre soi et la conversation démarre toute seule.

## 🎯 Le concept

- **Simple avant tout** : 3 tapes suffisent pour lancer une partie
  (prénoms → thèmes → jouer). L'app est pensée pour être dégainée en plein
  date sans mode d'emploi.
- **Une question à la fois**, en plein écran, avec le prénom de la personne
  qui doit répondre. On touche la carte pour passer à la suivante.
- **On peut passer** une question qui ne convient pas (elle revient en fin
  de pioche, elle n'est pas perdue).
- **Des thèmes gradués en intensité** (🌶️ → 🌶️🌶️🌶️) : du brise-glace au
  « Un peu Hot », chacun choisit l'ambiance de la soirée.

## 📦 Les packs de questions

| Pack | Intensité | Accès |
|---|---|---|
| ❄️ Brise-glace (20 q.) | 🌶️ | Gratuit |
| 😄 Fun & Léger (20 q.) | 🌶️ | Gratuit |
| ⚖️ Tu préfères… (20 q.) | 🌶️ | Gratuit |
| ✈️ Voyages & Rêves (15 q.) | 🌶️🌶️ | Gratuit |
| 💖 Cœur à Cœur (25 q.) | 🌶️🌶️ | 1,99 € |
| 🔥 Un peu Hot (25 q.) | 🌶️🌶️🌶️ | 1,99 € |
| 🤔 Dilemmes & Débats (20 q.) | 🌶️🌶️ | 1,99 € |
| 💍 Couple Confirmé (20 q.) | 🌶️🌶️ | 1,99 € |

Les questions vivent dans `src/data/questions.ts` — en ajouter un pack se
fait en quelques lignes, sans toucher au reste du code.

## 💰 Modèle économique

Pas d'abonnement récurrent : des **achats uniques**, faciles à accepter en
caisse.

| Produit | ID produit | Prix indicatif |
|---|---|---|
| ✨ Premium à vie (sans pub) | `flirt_premium_lifetime` | 4,99 € |
| Pack de questions (×4) | `flirt_pack_*` | 1,99 € |
| 💝 Bundle « Tout Flirt » | `flirt_bundle_tout` | 9,99 € |

**Règle d'or : aucune pub pendant une partie.** Une interstitielle au milieu
d'une question tuerait le charme du date — c'est précisément l'argument de
vente du Premium. Les bannières n'apparaissent que sur les écrans de menu
(accueil, boutique), et disparaissent définitivement avec le Premium.

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
  state/AppContext.tsx   # État global persisté (prénoms, achats)
  services/purchases.ts  # Achats in-app (mock ; RevenueCat en prod)
  services/ads.ts        # Publicité (règles + intégration AdMob)
  components/            # Button, PackCard, AdBanner
  screens/               # Home, Setup, Game, Shop
```

## 🚀 Lancer en développement

```bash
npm install
npm start          # puis scanner le QR code avec Expo Go
```

## 📲 Publier sur les stores

1. **Comptes développeur** : Apple Developer (99 $/an) et Google Play
   Console (25 $ une fois). Adapter `bundleIdentifier` / `package` dans
   `app.json` si besoin (actuellement `com.flirtgame.app`).
2. **Icônes & splash** : remplacer les images du dossier `assets/`.
3. **Achats in-app** : créer les produits listés ci-dessus dans App Store
   Connect et Play Console, puis brancher
   [RevenueCat](https://www.revenuecat.com/) dans
   `src/services/purchases.ts` (les instructions détaillées sont en
   commentaire dans le fichier — le mock actuel simule les achats pour le
   développement).
4. **Publicité** : créer une app AdMob, puis suivre les instructions en
   commentaire dans `src/services/ads.ts` et `src/components/AdBanner.tsx`.
5. **Build & soumission** avec EAS :

```bash
npm install -g eas-cli
eas login
eas build --platform all      # builds iOS + Android
eas submit --platform ios
eas submit --platform android
```

## 🗺️ Pistes pour la suite

- Packs saisonniers (Saint-Valentin, été…) pour créer du réachat.
- Mode « qui de nous deux » ou petits gages pour varier le rythme.
- Traductions (EN/ES) pour élargir le marché.
- Statistiques anonymes sur les questions les plus passées, pour améliorer
  le contenu.
