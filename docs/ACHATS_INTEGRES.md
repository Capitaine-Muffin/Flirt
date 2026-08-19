# Achats intégrés : ce qu'il faut préparer avant le premier envoi

Ce document répond à une question précise : **qu'est-ce qui doit être fait
avant de publier la 1.0.0, parce que le faire après coûte beaucoup plus
cher ?**

La réponse courte : la *plomberie* (nom du package, statut gratuit,
bibliothèque de facturation embarquée dans le build, formulaires de la
fiche) se prépare maintenant. Les *produits* eux-mêmes (prix, packs,
promotions) se créent et se modifient quand on veut, sans toucher à l'app.

---

## 1. Les décisions irréversibles

| Décision | Valeur pour Flirt | Pourquoi c'est définitif |
|---|---|---|
| Nom du package | **`com.flirtgame.app`** | Il identifie l'app à vie sur Play. Le changer = publier une autre app, sans les avis ni les installations. |
| Type de tarification | **Gratuite**, avec achats intégrés | Une app publiée gratuite ne peut **jamais** devenir payante. L'inverse est possible. Les achats intégrés, eux, s'ajoutent quand on veut. |
| Compte développeur | Organisation *Capitaine Muffin* | Choisi à l'inscription, non modifiable (cf. `PLAY_STORE.md` §0.1). |
| Signature de l'app | Play App Signing (clé gérée par Google, générée par EAS) | La clé de signature ne peut plus être remplacée sans passer par une procédure Google. |
| Identifiants produits | ceux du tableau §5 | Un identifiant créé ne peut être ni supprimé ni réutilisé — seulement désactivé. |

À l'écran « Créer une application » de la Play Console :

- **Nom de l'application** : `Flirt` (modifiable ensuite)
- **Nom du package** : `com.flirtgame.app`
- **Langue par défaut** : **français (France)** — pas l'anglais américain
  proposé par défaut : c'est la langue de toute la fiche et de l'app
- **Application ou jeu** : Application · **Gratuite**

## 2. Le vrai piège de séquencement

**La Play Console n'ouvre la section « Produits intégrés à l'application »
qu'après le premier envoi d'un `.aab` contenant la bibliothèque Google Play
Billing.** Tant qu'aucun build ne contient cette bibliothèque, la page
affiche un message d'erreur et il est impossible de créer le moindre
produit.

Conséquence concrète, et c'est tout l'objet de cette branche : **le premier
`.aab` doit déjà embarquer la facturation**, même si la boutique reste
discrète dans l'app. Sinon il faut refaire un build, le renvoyer, attendre
une nouvelle relecture, et seulement là créer les produits.

Même logique pour la publicité : l'identifiant d'application AdMob doit
être présent dans le manifeste au moment du build. Il ne s'ajoute pas
depuis la console.

## 3. La solution retenue : RevenueCat

C'est la décision laissée ouverte par l'issue #37. Tranché : **RevenueCat**.

|  | RevenueCat | `react-native-iap` seul |
|---|---|---|
| Validation des reçus | côté serveur, chez eux | à écrire soi-même (sinon un achat se falsifie) |
| Mémoire des achats | oui : restauration après réinstallation ou changement de téléphone | à écrire soi-même |
| Play + App Store | une seule API | deux intégrations |
| Remboursements | webhooks | à surveiller à la main |
| Coût | gratuit jusqu'à ~2 500 $ de revenus mensuels, puis ~1 % | 0 € |

Pour une app à 0,99 €, le 1 % est sans commune mesure avec le temps d'un
backend de validation maison — et Google prend déjà 15 %. RevenueCat **est**
le backend des achats : il n'y a pas de serveur à écrire pour sortir l'app.

Le dossier `server/` de ce dépôt est un complément facultatif (suivi des
ventes, remboursements, sortie de secours si on quitte RevenueCat un jour).
Il n'est pas nécessaire à la publication — voir `server/README.md`.

## 4. Ce qui est déjà prêt dans le dépôt

| Fichier | Rôle |
|---|---|
| `src/services/purchases.ts` | l'API utilisée par l'app : prix, achat, restauration |
| `src/services/purchases.revenuecat.ts` | le branchement natif, chargé seulement s'il est disponible |
| `src/config/monetization.ts` | identifiants produits, droits, clés lues dans l'environnement |
| `src/state/AppContext.tsx` | au démarrage : cache local, puis vérification auprès du store |
| `server/` | webhooks RevenueCat + vérification Google Play (facultatif) |

Le code fonctionne dans les deux modes sans rien changer :

- **sans** module natif ni clé (Expo Go, aujourd'hui) → simulation : la
  boutique se déroule de bout en bout, aucun paiement réel ;
- **avec** (build EAS + clé RevenueCat) → vrais paiements, prix localisés
  fournis par le store, restauration réelle.

Autrement dit, il n'y a plus de code à écrire : il reste des comptes à
créer et des cases à cocher.

## 5. Les produits à déclarer

Type « Produit intégré à l'application » → **achat unique** (non
consomptible) pour les sept. Aucun abonnement.

| Identifiant | Prix | Titre (Play, 55 car. max) |
|---|---|---|
| `flirt_premium_lifetime` | 2,99 € | Flirt Premium à vie |
| `flirt_bundle_tout` | 4,99 € | Tout Flirt |
| `flirt_pack_coeur` | 0,99 € | Pack Cœur à Cœur |
| `flirt_pack_hot` | 0,99 € | Pack Un peu Hot |
| `flirt_pack_vraiment_hot` | 0,99 € | Pack Vraiment Hot |
| `flirt_pack_dilemmes` | 0,99 € | Pack Dilemmes & Débats |
| `flirt_pack_couple` | 0,99 € | Pack Couple Confirmé |

Les prix ci-dessus sont ceux du repli codé dans l'app ; l'issue #37
évoquait 3,99 € pour le bundle — **à trancher au moment de la création**,
c'est le prix de la Play Console qui s'affichera dans l'app. Ils restent
modifiables ensuite depuis la console, sans mise à jour de l'app.

## 6. La marche à suivre, dans l'ordre

1. **Créer l'app** dans la Play Console avec les valeurs du §1.
2. **Installer la facturation** :
   ```bash
   npx expo install react-native-purchases
   ```
   (à faire au moment du premier build : le paquet contient du code natif,
   l'app ne se lancera plus dans Expo Go une fois installé — c'est normal
   et attendu, le développement passe alors par un *development build*.)
3. **Premier `.aab`** avec EAS Build, envoyé en **test interne**. C'est lui
   qui débloque la page des produits (§2).
4. **Créer les sept produits** du §5, puis les activer.
5. **RevenueCat** :
   - créer le projet, y ajouter l'app Android (`com.flirtgame.app`) ;
   - y coller la clé du compte de service Google Play (celle décrite dans
     `server/README.md`) ;
   - recopier les sept identifiants produits ;
   - créer deux droits : `premium` et `tout` (cf. `src/config/monetization.ts`) ;
   - récupérer la **clé publique Android** (`goog_…`).
6. **Donner la clé au build**, sans jamais l'écrire dans le dépôt :
   ```bash
   eas secret:create --name EXPO_PUBLIC_REVENUECAT_KEY_ANDROID --value goog_xxx
   ```
7. **Tester un achat pour de vrai** : Play Console → *Paramètres* → *Tests
   de licence* → ajouter les comptes Gmail des testeurs. Ils voient la
   vraie feuille de paiement, sans être débités.
8. **Vérifier la restauration** : désinstaller, réinstaller, « Restaurer
   mes achats » — les achats doivent revenir. C'est un point de refus
   classique en relecture.
9. *(facultatif)* Déployer `server/` et brancher le webhook RevenueCat.

## 7. Les formulaires de la fiche changent

⚠️ Point important : les réponses prévues par l'issue #31 ont été écrites
pour une app **sans pub ni achat**. Avec les achats intégrés (et la
publicité), elles deviennent fausses, et sous-déclarer expose au retrait de
l'app.

| Formulaire | Réponse à donner |
|---|---|
| Sécurité des données | **Des données sont collectées** : identifiants (identifiant d'appareil / publicitaire), historique des achats, interactions avec l'app — transmises à RevenueCat et à Google, chiffrées en transit |
| Publicités | **Oui**, l'application contient des publicités |
| Achats intégrés | **Oui** — la fourchette de prix (0,99 € – 4,99 €) s'affiche automatiquement sur la fiche |
| Politique de confidentialité | doit mentionner les achats intégrés et la régie publicitaire (issues #27 et #28) |
| Classification IARC | refaire le questionnaire en déclarant la présence d'achats et de publicité |

## 8. Ce qui reste facile à changer après la sortie

Pour équilibrer : tout n'est pas à figer maintenant.

- les prix, les titres et les descriptions des produits ;
- l'ajout de nouveaux packs (nouveaux identifiants) ;
- les promotions et les codes promotionnels ;
- le passage de la simulation aux vrais paiements dans l'app ;
- la fiche Play (textes, visuels, captures).

Autrement dit : **la structure se décide maintenant, le commerce se pilote
ensuite.**
