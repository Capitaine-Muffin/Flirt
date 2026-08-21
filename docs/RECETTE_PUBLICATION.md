# Publier une app Expo sur Google Play — la recette complète

Procédure de bout en bout, écrite après la mise en production de Flirt
(21 août 2026). **Chaque piège listé ici a réellement coûté du temps ce
jour-là** : les suivre dans l'ordre évite de les revivre.

À recopier tel quel dans le prochain jeu. Les identifiants (App ID AdMob,
clés RevenueCat, mots de passe) ne sont **jamais** écrits ici.

Compter, pour une première app : une journée de configuration, puis
jusqu'à 7 jours d'examen Google.

La moitié de ces gestes est automatisable : voir
[`AUTOMATISATION.md`](AUTOMATISATION.md).

---

## Vue d'ensemble

L'ordre n'est pas négociable, parce que chaque étape débloque la suivante :

```
compte Play + compte marchand
        ↓
produits + prix          →  RevenueCat (droits, credentials, notifications)
        ↓
build local signé        →  test interne  →  achats testables
        ↓
déclarations Play        →  examen        →  production
        ↓
fiche liée dans AdMob    →  validation    →  vraies pubs + formulaire RGPD
```

⚠️ Les vraies publicités et le formulaire RGPD **ne peuvent pas** être
testés avant la production : AdMob exige une fiche Play publique, que ni le
test interne ni le test fermé ne fournissent. Ne pas s'acharner dessus.

---

## 1. Comptes (à faire une fois, très en avance)

| Quoi | Où | Délai |
|---|---|---|
| Compte développeur Play | play.google.com/console | quelques jours (30 j si un D-U-N-S est à demander) |
| Compte marchand Google Payments | Play Console → Configuration | immédiat, mais **obligatoire avant de créer le moindre produit** |
| Compte AdMob | apps.admob.com | immédiat |
| Compte RevenueCat | app.revenuecat.com | immédiat |

Voir [`PLAY_STORE.md`](PLAY_STORE.md) pour le détail du compte développeur.

---

## 2. Fabriquer le `.aab` en local — jamais avec un crédit EAS

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

## 3. Produits et prix dans Play

Monétiser avec Play → **Produits ponctuels** → un produit par achat :
durable, tous les pays, option d'achat `standard`.

### ⚠️ Le prix saisi est HORS TAXES

C'est le piège le plus coûteux en argent : saisir `0,99` fait payer
**1,19 €** à un acheteur français (TVA 20 %). Play l'annonce mal — la boîte
de dialogue dit « le prix final inclura les taxes », ce qui laisse croire
l'inverse.

Deux façons de corriger :

- **Prix par pays** (le plus sûr) : le crayon dans la ligne du pays fixe le
  prix **final**. Y mettre `0,99` donne bien 0,99 € affiché.
- **En masse** : bouton **Set prices** en haut du tableau de prix. Le
  montant saisi y est hors taxes → diviser par 1,20 pour la France.

Le tableau de prix se trouve en faisant défiler **horizontalement** la
ligne de l'option d'achat : les colonnes d'action sont hors écran.

Compter quelques minutes à quelques heures de propagation avant que l'app
affiche les nouveaux prix.

---

## 4. RevenueCat

1. **Products** : importer les produits Play.
2. **Entitlements** : ⚠️ **un droit par produit vendu**. Un produit sans
   droit n'accorde rien du tout (voir §5), et un droit qui porte plusieurs
   produits est acquis dès qu'**un seul** est acheté — attacher les 6
   produits à un droit « tout » débloquerait tout pour 0,99 €.
3. **Service credentials** : déposer le JSON du compte de service Google.
   ⚠️ Compter **36 h** avant qu'elles soient pleinement effectives.
4. **Notifications temps réel** (indispensable pour les remboursements) :

   a. Google Cloud → activer l'**API Cloud Pub/Sub** sur le projet du
      compte de service.
   b. Google Cloud → **IAM** → *Accorder l'accès* → l'adresse du compte de
      service → rôle **Administrateur Pub/Sub**. Sans ce rôle, RevenueCat
      affiche « No options » et rien n'est possible.
   c. RevenueCat → *Apps* → l'app Play → **Connect to Google**, puis copier
      le Topic ID.
   d. Play Console → **Configuration de la monétisation** → *Notifications
      pour les développeurs en temps réel* → coller le topic → contenu
      **« Abonnements, achats annulés et tous les produits ponctuels »**.
   e. Play Console → **Envoyer une notification de test**, puis vérifier
      « Last received » dans RevenueCat.

⚠️ Vérifier deux fois quel produit est attaché à quel droit. Une inversion
(ici `pack_hot` pointait sur `flirt_pack_coeur`) débloque le mauvais
contenu, et ça ne se voit qu'à l'usage.

---

## 5. Les quatre pièges du code

Ils ne produisent **aucune erreur** : l'app se compile, s'installe et a
l'air de marcher. Ils coûtent de l'argent en silence.

1. **`getProducts()` interroge les abonnements par défaut.** Pour des
   achats uniques, passer `'NON_SUBSCRIPTION'` en second argument. Sans ça
   Play ne renvoie rien et tous les achats échouent sur « ce produit n'est
   pas disponible sur votre compte » — un message qui envoie chercher le
   problème du côté du compte Play alors qu'il est dans le code.

2. **Ne jamais offrir un produit quand la facturation est en panne.** Un
   mode simulation qui accorde l'achat dès que le store ne répond pas
   transforme chaque incident réseau en distribution gratuite. Si une clé
   est configurée, un échec doit rester un échec.

3. **Play accole l'option d'achat à l'identifiant** renvoyé
   (`mon_produit:standard`). Couper à partir des deux points, sinon un
   achat réel n'est pas reconnu et le joueur a payé pour rien.

4. **Seuls les droits actifs font foi.** Les autres listes de RevenueCat
   (`allPurchasedProductIdentifiers`, `nonSubscriptionTransactions`) sont
   un **historique** : un achat remboursé y reste inscrit pour toujours.
   S'en servir laisse le contenu débloqué après remboursement — on peut
   payer, se faire rembourser, et tout garder.

Et deux règles de structure :

- La réponse du store doit **remplacer** la liste d'achats locale, pas s'y
  ajouter — sinon rien n'est jamais retiré. Mais elle ne doit la remplacer
  que lorsque le store a **vraiment répondu** : distinguer « ne possède
  rien » de « pas de réponse » (renvoyer `null`), sinon un joueur hors
  ligne perd ses achats.
- S'abonner aux changements (`addCustomerInfoUpdateListener`) : sans ça, un
  remboursement n'est appliqué qu'au prochain démarrage complet.

Le message `Error fetching offerings … no Play Store products registered`
dans les journaux est **sans rapport** quand on utilise `getProducts`
plutôt que les *offerings*. Ne pas partir dessus.

---

## 6. Les déclarations Play

Une dizaine de formulaires. Ceux qui coincent :

- **Informations de connexion.** Même sans compte utilisateur, Play impose
  de cocher « l'accès fourni couvre tout le contenu payant ». La voie
  propre : générer un **code promotionnel** (Monétiser avec Play → Codes
  promotionnels → *Produit ponctuel* → le produit qui débloque tout), le
  donner dans le champ libre, et la case devient vraie. Rédiger **en
  anglais**.
- **Cible.** La case facultative « limiter l'accès aux mineurs identifiés
  par Google » réduit la portée sans être exigée : la laisser décochée.
- **Sécurité des données.** Pour une app AdMob + achats : historique des
  achats (*fonctionnement de l'appli*), position approximative,
  interactions avec l'appli, ID de l'appareil (*publicité ou marketing*).
  Collectées **et** partagées, non éphémères, collecte requise, chiffrées
  en transit, pas de suppression sur demande s'il n'y a pas de serveur.
  ⚠️ Le bouton « paramètres de confidentialité » d'AdMob est du
  **consentement**, pas de la suppression de données.
- **Identifiant publicitaire.** Obligatoire depuis Android 13, et elle
  **bloque l'envoi sans figurer dans la liste des tâches** : elle
  n'apparaît qu'au moment des « vérifications rapides », via le lien
  *Afficher 1 problème*.

---

## 7. Tester les achats

- Les achats **ne se testent pas** avec un APK installé à la main : Play
  redistribue l'app signée avec **sa** clé, la signature ne correspond pas.
  Installer depuis le Play Store.
- Le **test interne** suffit et se propage en quelques minutes. Le test
  fermé, lui, passe par l'examen de Google (quelques jours) — inutile pour
  itérer.
- Activer le **test de licence** (Paramètres du compte → Test de licence)
  pour que les achats des testeurs soient gratuits.
- Diagnostiquer avec `adb logcat` filtré sur le PID de l'app : c'est là que
  RevenueCat écrit la vraie erreur.

### Le parcours de test complet

1. Acheter un pack → il se débloque.
2. Désinstaller, réinstaller depuis Play → les achats reviennent **seuls**
   (et « Restaurer mes achats » doit afficher « Achats restaurés »).
3. Rembourser dans **Gestion des commandes** en cochant ⚠️ **« Supprimer
   l'accès au produit »** (sans cette case, Google rend l'argent et laisse
   le contenu) → l'app doit reverrouiller le pack, sans redémarrage.
4. Vérifier que le prix affiché est bien celui voulu.

⚠️ Pour voir les prix il faut ne rien posséder : un compte qui a tout
acheté n'affiche que des coches. Rembourser, ou utiliser un autre appareil.

⚠️ Un remboursement fait **avant** le branchement des notifications ne sera
jamais rattrapé : Play ne rejoue pas les anciennes notifications.

Commandes utiles pendant les tests :

```bash
adb shell pm clear com.mon.app     # vide la sauvegarde locale
adb shell input keyevent KEYCODE_HOME   # arrière-plan → premier plan
adb exec-out screencap -p > ecran.png
```

---

## 8. Publicité

- Le câblage se vérifie avec les **blocs de test** AdMob, sans rien
  publier. Prévoir une variable (`EXPO_PUBLIC_USE_TEST_ADS=1`) pour les
  forcer dans un build de release — et **ne jamais l'envoyer en
  production**.
- Le consentement RGPD ne doit **pas** conditionner l'affichage des pubs :
  refuser donne des pubs non personnalisées, pas zéro pub. Seuls les
  acheteurs du sans-pub n'en ont aucune.
- Prévoir un bouton « Paramètres de confidentialité » qui rouvre le
  formulaire UMP : Google l'exige.
- Les émulateurs sont des appareils de test par défaut depuis UMP 2.2.0 :
  inutile d'ajouter leur identifiant pour la géographie de debug.
- ⚠️ Tant que l'app AdMob est en « Examen requis », **aucune vraie pub et
  aucun formulaire RGPD** — y compris sur un vrai téléphone européen. La
  validation demande une fiche Play publique. C'est normal, ce n'est pas un
  bug à chercher.

---

## 9. Production

Tests internes → release → **Promouvoir la version** → Production, puis
*Prévisualiser et confirmer* → **Envoyer pour examen** (jusqu'à 7 jours).

⚠️ Promouvoir ne suffit pas : il faut aussi **choisir les pays**, sinon
l'envoi est refusé (« Vous n'avez pas sélectionné de pays »).

Vérifier avant d'envoyer que la vue d'ensemble liste bien la release
elle-même (« Lancer le déploiement complet »), et pas seulement les
modifications annexes.

La fiche devient publique à `play.google.com/store/apps/details?id=<package>`
— elle renvoie 404 jusque-là, ce qui permet de surveiller la publication
sans être connecté.

Une fois en ligne : **lier la fiche dans AdMob**, ce qui lance la validation
AdMob (2-3 jours) et débloque enfin les vraies pubs et le formulaire RGPD.

---

## 10. Suivre l'argent

Play Console → Monétiser avec Play → **Rapports financiers** : *Revenus
estimés* en temps réel, *Ventes* en rapports mensuels. Virement une fois par
mois vers le 15, Google prélevant 15 % jusqu'à 1 M$ de revenus annuels.

RevenueCat a ses propres graphiques, mais Play fait foi.

---

## Aide-mémoire

- [ ] Compte marchand créé **avant** les produits
- [ ] Prix vérifiés **TTC**, pas hors taxes
- [ ] Un droit RevenueCat **par produit**, chacun vérifié
- [ ] `'NON_SUBSCRIPTION'` passé à `getProducts`
- [ ] Aucun produit offert quand la facturation échoue
- [ ] Identifiants produits nettoyés de leur `:option`
- [ ] Seuls les droits actifs débloquent le contenu
- [ ] Notifications temps réel branchées et **testées**
- [ ] Bundle vérifié : le correctif est bien dans le `.aab`
- [ ] Version montée dans `app.json` **et** `package.json`
- [ ] Achat, réinstallation, restauration, remboursement testés
- [ ] `EXPO_PUBLIC_USE_TEST_ADS` absent du build de production
- [ ] Pays sélectionnés pour la production
