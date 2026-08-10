# Publier Flirt sur Google Play

Tout ce qu'il faut pour la première mise en ligne (version 1.0.0, gratuite,
sans publicité et sans achat intégré). À suivre dans l'ordre.

---

## 0. Avant tout : le compte Play Console

- **25 $ une fois**, sur https://play.google.com/console → *Créer un compte développeur*.
- Choisir **compte personnel** (le compte organisation demande un numéro D-U-N-S).
- **Vérification d'identité obligatoire** (pièce d'identité + adresse). Comptez de
  quelques heures à quelques jours : c'est le vrai délai de la sortie, à lancer en premier.
- ⚠️ **Règle des 12 testeurs.** Un compte personnel créé après novembre 2023 doit
  d'abord faire un **test fermé avec au moins 12 testeurs inscrits, actifs pendant
  14 jours consécutifs**, avant de pouvoir demander l'accès à la production. Il faut
  donc prévoir ~2 semaines et une liste de 12 adresses Gmail (amis, famille).
  C'est la raison n°1 des sorties retardées — à anticiper dès maintenant.

## 1. Ce qui est déjà prêt dans le dépôt

| Élément | Où |
|---|---|
| `versionCode: 1` et `version: 1.0.0` | `app.json` |
| Nom de package `com.flirtgame.app` | `app.json` (définitif, non modifiable après publication) |
| Icône adaptative Android | `assets/android-icon-*.png` |
| Profils de build et de soumission | `eas.json` |
| Politique de confidentialité | `docs/confidentialite.html` |
| Visuel de mise en avant 1024×500 | `docs/store/feature-graphic.html` |

## 2. Héberger la politique de confidentialité

Play exige une **URL publique**. Le dépôt étant privé, GitHub Pages y est désactivé
(réservé aux plans payants). Deux options :

1. **Recommandé** — créer un petit dépôt public séparé (ex. `flirt-site`) contenant
   uniquement le dossier `docs/`, et activer GitHub Pages dessus. Le code de l'app
   reste privé, seule la page publique est visible.
2. Rendre ce dépôt public (le code devient visible).

L'URL finale ressemblera à
`https://<compte>.github.io/flirt-site/confidentialite.html`.

## 3. Fiche Play Store (à copier-coller)

**Nom de l'application** (30 caractères max)

```
Flirt — Jeu de questions
```

**Description courte** (80 caractères max)

```
Des questions à se poser à deux, pour se découvrir vraiment pendant un date.
```

**Description complète** (4 000 caractères max)

```
Flirt, c'est le jeu de questions qu'on sort au restaurant, dans le train ou sur le canapé, quand on a envie de vraiment se parler.

Posez le téléphone entre vous deux, choisissez vos thèmes, et laissez les questions faire le reste. Une question à la fois, en plein écran, à laquelle vous répondez à tour de rôle. Pas de score, pas de gagnant : juste la conversation.

CE QUI REND FLIRT DIFFÉRENT

• Trois tapes suffisent pour commencer. Aucun mode d'emploi, aucune inscription.
• Aucune publicité. Jamais. Rien ne vient couper le moment.
• Aucun compte, aucune donnée collectée. L'application fonctionne hors ligne.
• Une question ne vous plaît pas ? Vous la passez, elle revient plus tard.

120 QUESTIONS, 4 AMBIANCES

❄️ Brise-glace — pour lancer la conversation en douceur, sans pression.
😄 Fun & Léger — des questions décalées pour rire ensemble.
⚖️ Tu préfères… — des choix impossibles qui en disent long.
✈️ Voyages & Rêves — envies d'ailleurs, projets fous et rêves de toujours.

Mélangez les thèmes comme vous voulez : les questions sont piochées au hasard dans votre sélection.

POUR QUI ?

Pour un premier rendez-vous où l'on cherche quoi dire. Pour un couple installé qui veut sortir du « t'as passé une bonne journée ? ». Pour une longue route à deux. Pour ceux qui trouvent qu'on se pose trop peu de vraies questions.

ET APRÈS ?

Cinq packs plus intenses sont en préparation — Cœur à Cœur, Un peu Hot, Vraiment Hot, Dilemmes & Débats, Couple Confirmé. Ils arriveront par une simple mise à jour.

Flirt. Se découvrir, tout simplement.
```

**Catégorie** : Applications → *Style de vie*
(éviter la catégorie « Rencontres », qui impose une déclaration supplémentaire
réservée aux vraies applications de mise en relation).

**Tags** : jeu de questions, couple, conversation, date, soirée.

**Coordonnées** : adresse e-mail de contact publique (celle de la politique de
confidentialité), site web facultatif.

## 4. Visuels demandés

| Visuel | Format | Comment le produire |
|---|---|---|
| Icône | 512×512 PNG 32 bits | À exporter depuis `assets/icon.png` |
| Visuel de mise en avant | 1024×500 PNG/JPEG | Ouvrir `docs/store/feature-graphic.html`, capturer la zone |
| Captures téléphone | 2 à 8, min. 320 px, ratio 9:16 | Écrans Accueil, Choix des thèmes, une carte de question, fin de partie |

Le plus simple pour les captures : lancer l'app avec `npm start` puis Expo Go, et
faire de vraies captures d'écran. À défaut, ouvrir la démo `docs/index.html` dans
Chrome, mode appareil mobile (1080×1920), et capturer.

## 5. Formulaires de la Play Console

**Sécurité des données** (Data safety)
- L'application collecte-t-elle des données ? → **Non**
- L'application partage-t-elle des données ? → **Non**
- Les données sont-elles chiffrées en transit ? → sans objet (aucune donnée transmise)
- Suppression des données sur demande ? → sans objet
- Réponse déclarée dans `docs/confidentialite.html` : rien ne quitte l'appareil.

**Publicités**
- L'application contient-elle des annonces ? → **Non**

**Classification du contenu** (questionnaire IARC) — répondre honnêtement :
- Violence, langage grossier, contenu effrayant → non
- Drogues, tabac → non ; **alcool** → oui, mention anodine (une question évoque l'apéro)
- Sexualité → **oui, références suggestives légères** : les questions restent sages,
  mais l'application annonce des packs « Un peu Hot » / « Vraiment Hot ».
- Interactions entre utilisateurs, partage de position, achats → non
- Résultat attendu : PEGI 12 environ. Ne pas sous-déclarer : une classification
  erronée peut faire retirer l'application.

**Public cible et contenu** : cocher **18 ans et plus** uniquement. Cela évite les
règles « Familles » et correspond à l'esprit de l'app.

**Autres déclarations** : pas de connexion requise (« App access » → toutes les
fonctionnalités sont accessibles sans identifiants), application non gouvernementale,
pas de fonctionnalités financières, de santé, ni d'actualités.

## 6. Construire et envoyer le bundle

```bash
npm install -g eas-cli
eas login                       # compte Expo (gratuit)
eas build:configure             # une seule fois, lie le projet à EAS

# Test sur son propre téléphone (APK installable directement)
eas build --platform android --profile preview

# Build de production pour Play (fichier .aab)
eas build --platform android --profile production
```

EAS génère et conserve la clé de signature Android — ne pas la perdre : c'est elle
qui permettra de publier les mises à jour. (`eas credentials` pour la sauvegarder.)

Ensuite, deux façons d'envoyer le `.aab` :
- **manuellement** : le télécharger depuis expo.dev et le déposer dans la Play Console
  (le plus simple pour la toute première version) ;
- **automatiquement** : créer un compte de service Google Cloud, télécharger sa clé JSON
  sous le nom `play-service-account.json` à la racine (déjà ignoré par git), puis
  `eas submit --platform android --profile production`.

## 7. Ordre de sortie conseillé

1. Créer le compte Play Console et lancer la vérification d'identité.
2. Publier la page de confidentialité, remplir la fiche et les formulaires.
3. `eas build --profile preview` → tester l'APK sur un vrai téléphone.
4. `eas build --profile production` → envoyer le `.aab` en **test fermé**.
5. Réunir les 12 testeurs, attendre les 14 jours.
6. Demander l'accès à la production, puis publier.
7. Mise à jour suivante : monétisation (Play Billing + packs payants) — penser à
   incrémenter `versionCode` dans `app.json` à chaque envoi.
