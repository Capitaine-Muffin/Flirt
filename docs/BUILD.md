# Fabriquer l'`.aab` de Flirt

Propre à ce jeu, parce que la fabrication dépend de la techno — Flirt est
en Expo / React Native.

Ce qui touche au Store — produits, prix, déclarations, examen, publicité —
est commun à tous les jeux et vit dans
[publier-sur-play](https://github.com/Capitaine-Muffin/publier-sur-play).

## En temps normal : ne rien faire à la main

```bash
git tag v1.0.1 && git push --tags
```

La CI fabrique, vérifie et envoie en test interne. Pour une autre piste :
onglet *Actions* → *Publier sur Google Play* → **Run workflow**.

C'est la voie à privilégier, et pas seulement par confort : la moitié des
pièges ci-dessous n'existe pas sur un runner Linux propre.

---

## En local, pour déboguer

Un build EAS consomme un crédit (15 par mois sur le plan gratuit). Les
allers-retours sur les achats en demandent beaucoup : ce jour-là, **six
builds** ont été nécessaires. En local c'est illimité et deux fois plus
rapide (~2 min).

```bash
JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=…
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=…
EXPO_PUBLIC_REVENUECAT_KEY_ANDROID=…
node tools/build-aab.mjs <versionCode>
```

La clé de signature se récupère une fois, en interactif :

```bash
npx eas-cli credentials -p android
```

Elle produit `credentials.json` + `credentials/android/keystore.jks`.
**Aucun des deux ne se commite** : ils permettent de publier au nom de
l'éditeur.

### Pièges du build (tous encodés dans [`tools/build-aab.mjs`](../tools/build-aab.mjs))

| Symptôme | Cause | Remède |
|---|---|---|
| `restricted method in java.lang.System` | le JDK d'Android Studio (25) est trop récent | installer **Temurin 17** et le pointer par `JAVA_HOME` |
| L'app plante au démarrage : `Invalid application ID` | `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID` absent au `prebuild` : le plugin AdMob est sauté alors que le module natif est lié | exporter la variable **avant** le build |
| `ninja` s'arrête sur un chemin trop long | les 260 caractères de Windows ; `LongPathsEnabled` ne suffit pas | `buildStagingDirectory = file("C:/cxx/<jeu>")` |
| Le `.aab` part en `versionCode 1` | `-Pandroid.injected.version.code` n'est honoré que depuis Android Studio | écrire `versionCode` dans `android/app/build.gradle` |
| **Le `.aab` s'installe mais le correctif n'y est pas** | Gradle croit l'étape à jour et réutilise un paquet JavaScript périmé | supprimer `android/app/build/generated/assets/react` à chaque build |
| Des mots de passe dans un journal | Node relaie l'erreur Gradle avec la ligne de commande complète | n'afficher que le code de sortie |

⚠️ Ne jamais faire confiance à un `.aab` sur sa seule date. Vérifier :

```bash
unzip -p app-release.aab base/assets/index.android.bundle > /tmp/b.hbc
grep -c "UNE_CHAINE_DU_CORRECTIF" /tmp/b.hbc
```

Hermes stocke les chaînes accentuées en UTF-16 : si la chaîne cherchée a un
accent, chercher aussi avec `strings -e l`.

Monter le numéro dans **`app.json` et `package.json`**, et le `versionCode`
strictement au-dessus du dernier envoyé.

---

