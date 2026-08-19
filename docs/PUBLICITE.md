# Publicité : ce qu'il faut préparer avant le premier envoi

Même logique que pour les achats intégrés
([`ACHATS_INTEGRES.md`](ACHATS_INTEGRES.md)) : **l'identifiant AdMob doit
être inscrit dans le manifeste au moment du build.** Il ne s'ajoute pas
depuis une console après coup. Un build sans lui = un deuxième build et une
relecture de plus le jour où on veut de la pub.

## La règle de Flirt

La pub ne coupe **jamais** rien : aucun interstitiel, aucune vidéo, aucun
plein écran. Uniquement des bannières discrètes (accueil, boutique, et une
ligne fine sous la carte pendant le jeu), et elles disparaissent toutes
avec le Premium. C'est un choix de produit, pas une contrainte technique :
une pub qui coupe un date tue l'app.

## Ce qui est déjà prêt dans le dépôt

| Fichier | Rôle |
|---|---|
| `src/config/ads.ts` | blocs d'annonces, lus dans l'environnement |
| `src/services/ads.ts` | consentement RGPD, initialisation, choix du bloc |
| `src/components/AdBanner.tsx` | vraie bannière si le SDK est là, cadre de simulation sinon |
| `app.config.js` | ajoute le plugin AdMob au build, seulement si l'App ID est fourni |

Comme pour les achats, rien à changer dans le code : sans SDK ni
identifiant, l'app affiche un cadre « Publicité » et tourne dans Expo Go ;
avec, elle affiche de vraies bannières.

## Deux identifiants à ne pas confondre

| | Forme | Où il va |
|---|---|---|
| **App ID** | `ca-app-pub-…~…` (tilde) | dans le manifeste, au build — variable `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID` |
| **Bloc d'annonces** | `ca-app-pub-…/…` (barre oblique) | demandé à l'exécution — variable `EXPO_PUBLIC_ADMOB_BANNER_ANDROID` |

Tant qu'aucun bloc réel n'est fourni — et **toujours** en développement —
l'app utilise les blocs de test de Google. Demander de vraies annonces
depuis un build de test fait fermer le compte AdMob pour clics invalides :
c'est la faute classique, et elle est définitive.

## La marche à suivre

1. **Créer le compte AdMob** (gratuit, sur admob.google.com), y déclarer
   l'application Android `com.flirtgame.app`.
2. **Créer un bloc d'annonces** de type *Bannière*.
3. **Donner les deux identifiants à EAS**, jamais au dépôt :
   ```bash
   eas secret:create --name EXPO_PUBLIC_ADMOB_APP_ID_ANDROID --value ca-app-pub-xxx~yyy
   eas secret:create --name EXPO_PUBLIC_ADMOB_BANNER_ANDROID --value ca-app-pub-xxx/zzz
   ```
4. **Installer le SDK** au moment du premier build :
   ```bash
   npx expo install react-native-google-mobile-ads
   ```
5. **Consentement RGPD** : dans AdMob → *Confidentialité et messages*,
   créer un message *Consentement RGPD* (UMP) et le publier pour l'Europe.
   Sans lui, `initAds()` refuse d'afficher la moindre bannière — le code
   préfère renoncer à la pub plutôt que diffuser sans consentement valable.
6. **Coordonnées bancaires et fiscales** dans AdMob : le premier virement
   part à 70 € cumulés, et le compte reste bloqué tant que l'adresse n'est
   pas vérifiée par courrier postal (compter deux à trois semaines).
7. **Déclarations Play** (issue #31) : « l'application contient des
   publicités » = **oui**, et la section *Sécurité des données* doit
   mentionner l'identifiant publicitaire.

## Ce qu'AdMob rapporte, honnêtement

Une bannière rapporte de l'ordre de 0,50 € à 2 € pour mille affichages en
France. À quelques centaines d'utilisateurs, cela fait des centimes par
mois : la publicité de Flirt sert surtout à rendre le Premium désirable.
C'est une raison de plus pour qu'elle reste discrète.
