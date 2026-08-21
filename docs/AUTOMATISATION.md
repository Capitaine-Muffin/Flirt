# Ce qu'on peut automatiser (et ce qu'on ne peut pas)

La mise en production de Flirt a pris une journée. L'essentiel de ce temps
est allé dans des gestes répétitifs ou dans des pièges silencieux — deux
choses qu'une machine fait mieux qu'un humain fatigué.

Ce document liste, poste par poste, ce qui est automatisable, avec quoi, et
ce qui restera de toute façon manuel. Rien de ce qui suit n'est encore
branché à part le build : c'est une feuille de route pour le prochain jeu.

---

## Déjà fait

| Poste | Outil | Gain |
|---|---|---|
| Fabriquer un `.aab` signé | [`tools/build-aab.mjs`](../tools/build-aab.mjs) | ~2 min, zéro crédit EAS, tous les pièges Windows encodés |

---

## Automatisable, à écrire

### 1. Envoyer et promouvoir une release — **le plus gros gain**

L'**API Google Play Developer** (`androidpublisher`) fait tout ce qu'on a
fait à la main :

- créer un « edit », y téléverser le `.aab`,
- l'assigner à une piste (`internal`, `alpha`, `beta`, `production`),
- écrire les notes de version par langue,
- fixer le pourcentage de déploiement, puis valider l'edit.

Une seule commande remplacerait : ouvrir la console, créer une version,
glisser le fichier, coller les notes, prévisualiser, enregistrer, aller
dans la vue d'ensemble, envoyer pour examen.

Deux chemins :

- **`fastlane supply`** — éprouvé, rien à écrire, mais amène Ruby.
- **Script Node** avec `googleapis` — ~80 lignes, aucune dépendance
  exotique, cohérent avec `build-aab.mjs`. **Recommandé.**

⚠️ Il faut un compte de service **distinct** de celui de RevenueCat, avec
le droit *Publier des versions* accordé dans Play Console → Utilisateurs et
autorisations. Ne pas réutiliser celui de RevenueCat : un même fichier de
clé qui peut à la fois lire les achats et publier des versions est une
mauvaise idée, et il est déjà déposé chez un tiers.

### 2. Créer les produits et fixer les prix

Même API (`inappproducts` / les points d'entrée de monétisation). C'est le
poste qui a coûté le plus d'énervement : six produits × 177 pays, avec le
piège des prix hors taxes au milieu.

Un script qui lit un simple tableau —

```
flirt_pack_hot        0,99 € TTC
flirt_premium_lifetime 2,99 € TTC
```

— et écrit les bons montants pays par pays supprime entièrement le
problème : la conversion TTC → HT se fait dans le code, une fois, et ne se
retrompe jamais.

### 3. Configurer RevenueCat

L'**API REST v2** de RevenueCat crée les produits, les droits, et les
attache. C'est elle qui aurait évité l'inversion `pack_hot` →
`flirt_pack_coeur`, qui débloquait le mauvais contenu et ne se voyait qu'à
l'usage.

La règle « un droit par produit vendu » se vérifie mécaniquement : le
script peut comparer la configuration RevenueCat au tableau
`ENTITLEMENTS` de [`src/config/monetization.ts`](../src/config/monetization.ts)
et refuser de continuer en cas d'écart.

### 4. Vérifier le paquet avant de l'envoyer

Déjà scriptable en trois lignes, et ça a évité une publication ratée :

```bash
unzip -p app-release.aab base/assets/index.android.bundle > /tmp/b.hbc
grep -c "UNE_CHAINE_DU_CORRECTIF" /tmp/b.hbc
```

À intégrer au script d'envoi : refuser de publier un `.aab` dont le
paquet JavaScript ne contient pas la chaîne attendue.

### 5. Le parcours de test sur l'émulateur

Tout se pilote en `adb` :

```bash
adb shell pm clear com.mon.app            # vider la sauvegarde locale
adb shell input keyevent KEYCODE_HOME     # arrière-plan → premier plan
adb exec-out screencap -p > ecran.png     # capture pour vérifier
adb logcat -d | grep -i revenuecat        # la vraie erreur est là
```

Un script « vérifier après installation » peut enchaîner : vider, relancer,
capturer, et signaler si l'écran de boutique n'affiche pas les prix
attendus.

### 6. Surveiller la publication

La fiche publique renvoie 404 tant que l'examen n'est pas passé :

```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://play.google.com/store/apps/details?id=com.mon.app"
```

Une boucle qui prévient au passage à 200 évite de rafraîchir la console
toutes les heures.

### 7. Tout enchaîner sur un tag Git

Une fois 1, 4 et 6 en place, une action GitHub sur `v*` peut : fabriquer,
vérifier, envoyer en test interne, et prévenir. Le seul geste humain
devient `git tag v1.0.1 && git push --tags`.

⚠️ La clé de signature ne se commite jamais : elle passe par un secret de
dépôt.

---

## Ce qui restera manuel

Aucune API publique ne les couvre :

- **les déclarations Play** (informations de connexion, cible, sécurité des
  données, identifiant publicitaire, questionnaire de contenu) ;
- **le compte marchand** et le profil de paiement ;
- **la liaison de la fiche dans AdMob** et sa validation ;
- **l'examen de Google** lui-même.

Bonne nouvelle : ce sont des gestes **une fois par app**, pas à chaque
version. Ce qui se répète — build, envoi, prix, droits, tests — est
justement ce qui s'automatise.

---

## Par où commencer

Dans l'ordre du rapport temps gagné / effort :

1. le script d'envoi (§1) — il supprime la moitié d'une journée ;
2. la vérification du paquet (§4) — dix lignes, évite une publication ratée ;
3. les prix (§2) — évite l'erreur qui coûte de l'argent ;
4. RevenueCat (§3) — évite l'erreur qui débloque le mauvais contenu ;
5. le reste, si le besoin s'en fait sentir.

Voir [`RECETTE_PUBLICATION.md`](RECETTE_PUBLICATION.md) pour la procédure
manuelle complète, qui reste la référence de ce que chaque script doit
reproduire.
