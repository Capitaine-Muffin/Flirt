# Recette : publier une app Expo sur Google Play

Ce document est fait pour être **recopié dans le prochain jeu**. Il ne
raconte pas la théorie — [`PLAY_STORE.md`](PLAY_STORE.md),
[`ACHATS_INTEGRES.md`](ACHATS_INTEGRES.md) et [`PUBLICITE.md`](PUBLICITE.md)
s'en chargent. Il donne l'ordre des opérations et, surtout, **les pièges
qui coûtent une journée** quand on ne les connaît pas.

Écrit après la mise en ligne de Flirt (août 2026). Chaque piège listé ici a
été réellement rencontré.

---

## 1. Fabriquer le `.aab` en local, jamais avec un crédit EAS

Un build EAS consomme un crédit (15 par mois sur le plan gratuit). Les
allers-retours de test sur les achats en demandent beaucoup, et un crédit
brûlé pour découvrir une faute de frappe est un crédit perdu. Tout se fait
en local avec [`tools/build-aab.mjs`](../tools/build-aab.mjs) :

```bash
JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=…
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=…
EXPO_PUBLIC_REVENUECAT_KEY_ANDROID=…
node tools/build-aab.mjs <versionCode>
```

La clé de signature se récupère une fois depuis EAS, en interactif :

```bash
npx eas-cli credentials -p android
```

Elle produit `credentials.json` + `credentials/android/keystore.jks`.
**Aucun des deux ne se commite** (voir `.gitignore`) : ils permettent de
publier au nom de l'éditeur.

### Pièges du build local (tous déjà encodés dans le script)

| Symptôme | Cause | Remède |
|---|---|---|
| Gradle/CMake échoue sur `restricted method in java.lang.System` | le JDK d'Android Studio est trop récent (25) | installer **Temurin 17** à côté et le pointer par `JAVA_HOME` |
| L'app plante au démarrage : `Invalid application ID` | `EXPO_PUBLIC_ADMOB_APP_ID_ANDROID` absent au `prebuild` : `app.config.js` saute le plugin AdMob alors que le module natif est lié | toujours exporter la variable **avant** le build |
| `ninja` s'arrête sur un chemin trop long | les 260 caractères de Windows ; `LongPathsEnabled` ne suffit pas, `ninja` ne l'exploite pas | rediriger la compilation C++ : `buildStagingDirectory = file("C:/cxx/<jeu>")` |
| Le `.aab` part en `versionCode 1`, Play le refuse | `-Pandroid.injected.version.code` n'est honoré que depuis Android Studio | écrire `versionCode` directement dans `android/app/build.gradle` |
| Le `.aab` s'installe mais **le code corrigé n'y est pas** | Gradle croit `createBundleReleaseJsAndAssets` à jour et réutilise un paquet JavaScript périmé | supprimer `android/app/build/generated/assets/react` avant chaque build |
| Des mots de passe apparaissent dans un journal | Node relaie l'erreur Gradle avec la ligne de commande complète | intercepter l'erreur et n'afficher que le code de sortie |

⚠️ Ne jamais faire confiance à un `.aab` sur sa seule date : **vérifier que
le correctif est dedans**.

```bash
unzip -p app-release.aab base/assets/index.android.bundle > /tmp/b.hbc
grep -c "UNE_CHAINE_DU_CORRECTIF" /tmp/b.hbc
```

Hermes stocke les chaînes accentuées en UTF-16 : si la chaîne cherchée a un
accent, chercher aussi avec `strings -e l`.

---

## 2. Créer les produits Play, puis RevenueCat

1. **Compte marchand** Google Payments, sinon aucun produit n'est créable.
2. Monétiser avec Play → **Produits intégrés à l'application** : un produit
   par achat, durable, tous les pays, option d'achat `standard`.
3. **RevenueCat** : importer les produits, puis créer les *entitlements*.

⚠️ Un *entitlement* est acquis dès qu'**un seul** de ses produits est
acheté. Attacher les 6 produits à un entitlement « tout » débloquerait tout
pour 0,99 €. Un entitlement = le(s) produit(s) qui y donnent vraiment droit.

⚠️ Play accole l'option d'achat à l'identifiant renvoyé
(`mon_produit:standard`). Le code doit couper à partir des deux points,
sinon un achat réel n'est pas reconnu et le joueur a payé pour rien.

⚠️ **`getProducts()` de RevenueCat interroge les abonnements par défaut.**
Pour des achats uniques il faut passer `'NON_SUBSCRIPTION'` en second
argument. Sans ça, Play ne renvoie jamais rien et l'app affiche « ce produit
n'est pas disponible sur votre compte » — un message qui envoie chercher le
problème du côté du compte Play, alors qu'il est dans le code.

⚠️ Le message `Error fetching offerings … no Play Store products registered`
est **sans rapport** si l'app utilise `getProducts` plutôt que les
*offerings*. Ne pas partir dessus.

---

## 3. Tester les achats

- Les achats **ne se testent pas** avec un APK installé à la main : Play
  redistribue l'app signée avec **sa** clé, la signature ne correspond pas.
  Il faut installer depuis le Play Store.
- Le **test interne** suffit et se propage en quelques minutes.
- Activer le **test de licence** (Paramètres → Test de licence) pour que les
  achats des testeurs soient gratuits.
- Diagnostiquer avec `adb logcat` filtré sur le PID de l'app : c'est là que
  RevenueCat écrit la vraie erreur.

⚠️ En cas de panne de facturation, **ne jamais offrir le produit**. Un code
de simulation qui accorde l'achat quand l'initialisation échoue transforme
chaque panne réseau en distribution gratuite.

---

## 4. Les déclarations Play qui bloquent l'envoi

Le tableau de bord réclame une dizaine de déclarations. Celles qui coincent :

- **Informations de connexion.** Même sans compte utilisateur, Play impose
  de cocher « l'accès fourni couvre tout le contenu payant ». Réponse
  propre : générer un **code promotionnel** (Monétiser avec Play → Codes
  promotionnels) pour le produit qui débloque tout, et le donner dans le
  champ libre. La case devient vraie.
- **Cible.** Le contenu détermine la tranche. La case facultative
  « limiter l'accès aux mineurs identifiés par Google » réduit la portée
  sans être exigée : la laisser décochée.
- **Sécurité des données.** Pour une app AdMob + achats : historique des
  achats (*fonctionnement de l'appli*), position approximative, interactions
  avec l'appli, ID de l'appareil (*publicité ou marketing*). Collectées
  **et** partagées, non éphémères, collecte requise, chiffrées en transit.
- **Identifiant publicitaire.** Obligatoire depuis Android 13 et **elle
  bloque l'envoi sans apparaître dans la liste des tâches** : elle ne sort
  qu'au moment des « vérifications rapides ».

Le texte de la déclaration d'accès doit être **en anglais**.

---

## 5. Publicité

- Le câblage se vérifie avec les **blocs de test** AdMob, sans rien publier.
  Prévoir une variable (`EXPO_PUBLIC_USE_TEST_ADS=1`) pour forcer les pubs
  de test dans un build de release — et **ne jamais l'envoyer en
  production**.
- Les vraies pubs ne sortent qu'après : publication sur Play → fiche liée
  dans AdMob → validation AdMob (2 à 3 jours). Avant ça, « no fill » est
  normal.
- Le consentement RGPD ne doit **pas** conditionner l'affichage des pubs :
  refuser le consentement donne des pubs non personnalisées, pas zéro pub.
  Seuls les acheteurs du sans-pub n'en ont aucune.
- Prévoir un bouton « Paramètres de confidentialité » qui rouvre le
  formulaire UMP : Google l'exige, et ce n'est **pas** un mécanisme de
  suppression de données (la déclaration Play porte sur les données
  détenues sur un serveur).
- Les émulateurs sont des appareils de test par défaut depuis UMP 2.2.0 :
  inutile d'ajouter leur identifiant pour tester la géographie de debug.
  Le test le plus fiable reste un vrai téléphone en Europe.

---

## 6. Ordre de sortie

1. Test interne → vérifier achats, pubs, désinstallation/réinstallation,
   restauration.
2. Test fermé → passe par l'**examen de Google** (le test interne, non).
3. Production, puis lier la fiche dans AdMob.

Monter le numéro de version dans **`app.json` et `package.json`** à chaque
fois, et le `versionCode` strictement au-dessus du dernier envoyé.
