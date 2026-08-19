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
| 💖 Cœur à Cœur (150 q.) | 🌶️🌶️ | 0,99 € |
| 🔥 Un peu Hot (150 q.) | 🌶️🌶️🌶️ | 0,99 € |
| 😈 Vraiment Hot (150 q.) | 🌶️🌶️🌶️ | 0,99 € |
| 🤔 Dilemmes & Débats (150 q.) | 🌶️🌶️ | 0,99 € |
| 💍 Couple Confirmé (150 q.) | 🌶️🌶️ | 0,99 € |

Soit **870 questions** au total : 120 gratuites et 750 premium.

Les questions vivent dans `src/data/questions.ts` — en ajouter un pack se
fait en quelques lignes, sans toucher au reste du code.

## 💰 Modèle économique

Pas d'abonnement récurrent : des **achats uniques**, faciles à accepter en
caisse.

| Produit | ID produit | Prix de lancement |
|---|---|---|
| Pack de questions (×5, 150 q. chacun) | `flirt_pack_*` | 0,99 € |
| ✨ Premium à vie (sans pub) | `flirt_premium_lifetime` | 2,99 € |
| 💝 Bundle « Tout Flirt » | `flirt_bundle_tout` | 4,99 € |

**Stratégie de lancement** : prix volontairement bas (0,99 € = achat
impulsif sous le seuil de réflexion) pour maximiser le volume et les avis
au démarrage. L'escalier reste cohérent : 0,99 € le pack → 2,99 € sans
pub → 4,99 € tout débloqué (valeur unitaire 7,94 €, ~37 % de remise).
Une fois la base d'utilisateurs installée, les prix peuvent remonter
(packs à 1,99 €) directement depuis App Store Connect / Play Console,
sans mise à jour de l'app.

**Règle d'or : la pub ne coupe jamais rien.** Aucun interstitiel, aucune
vidéo, aucun plein écran — l'app doit rester chic même en version
gratuite. Uniquement des bannières discrètes : accueil, boutique, et une
bannière fine sous la carte pendant le jeu. Toutes disparaissent
définitivement avec le Premium (2,99 €), qui reste l'argument de vente.

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
  config/monetization.ts # Identifiants produits, droits, clés RevenueCat
  config/ads.ts          # Blocs d'annonces AdMob
  services/purchases.ts  # Achats in-app (simulation ou RevenueCat)
  services/ads.ts        # Publicité (règles + intégration AdMob)
  components/            # Button, PackCard, AdBanner
  screens/               # Home, Setup, Game, Shop
server/                  # Backend facultatif : webhooks et vérification Play
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
3. **Achats in-app** : tout le code est prêt — il reste à créer les
   produits dans la Play Console et à fournir une clé RevenueCat. Marche à
   suivre complète, et ce qui doit être décidé **avant** le premier envoi :
   [`docs/ACHATS_INTEGRES.md`](docs/ACHATS_INTEGRES.md).
4. **Publicité** : le code est prêt lui aussi — il reste à créer le compte
   AdMob et à fournir les identifiants au build :
   [`docs/PUBLICITE.md`](docs/PUBLICITE.md).
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
