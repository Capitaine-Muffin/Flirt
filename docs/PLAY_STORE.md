# Publier Flirt sur Google Play

Marche à suivre. L'ordre de travail est celui de l'issue
[#40 — Feuille de route](https://github.com/Capitaine-Muffin/Flirt/issues/40).

---

## 0. Ouvrir le compte Google Play Console — issue #25

Rien ne peut être envoyé tant que ce compte n'est pas créé **et** vérifié.
C'est le maillon le plus long : à lancer avant tout le reste.

### 0.1 Choisir le type de compte

**Décision prise : compte organisation, au nom de Capitaine Muffin**
(société immatriculée). Le choix se fait à l'inscription et **ne peut plus
être modifié ensuite** ; le tableau ci-dessous garde la comparaison.

|  | Compte **organisation** (Capitaine Muffin) | Compte **personnel** |
|---|---|---|
| Nom affiché sur la fiche | Capitaine Muffin | le nom de la personne (ou un nom commercial vérifié) |
| Pièces demandées | **numéro D-U-N-S**, extrait Kbis / justificatif d'existence, pièce d'identité du représentant | pièce d'identité + adresse |
| Délai | D-U-N-S : jusqu'à **30 jours** s'il faut le demander, immédiat si la société en a déjà un | quelques heures à quelques jours |
| Test fermé obligatoire | **non** | **oui** : 12 testeurs, 14 jours consécutifs, avant tout accès à la production |
| Cohérence avec la politique de confidentialité | ✅ l'éditeur y est Capitaine Muffin | ❌ à réécrire au nom d'une personne |

En clair : l'organisation coûte de l'attente administrative au début, le
personnel coûte 14 jours de test fermé et 12 testeurs à trouver juste
avant la sortie. **Conséquence du choix : l'issue #26 (12 testeurs) ne
s'applique plus**, l'obligation ne visant que les comptes personnels.

### 0.2 Le numéro D-U-N-S — ✅ obtenu : **277288992**

Obtenu gratuitement via l'outil de recherche d'Apple (route 1 ci-dessous),
au nom de Romain Guaresi pour CAPITAINE MUFFIN. La suite de cette section
n'a plus qu'une valeur d'historique.

Le D-U-N-S est un identifiant à 9 chiffres attribué gratuitement par
Dun & Bradstreet à une entreprise — l'équivalent international du SIREN.
Google l'utilise pour vérifier que la société existe.

**En France, il est attribué automatiquement** par Altares (le partenaire
français de Dun & Bradstreet) à toute société immatriculée au RCS ayant un
SIRET. Capitaine Muffin en a donc très probablement déjà un — il s'agit de
le retrouver, pas de le demander.

**Le piège** : sur l'outil de recherche officiel
https://dunsnumberlookup.dnb.com, choisir « France » redirige vers Altares
et débouche sur une offre payante (Verif.com, ~39 € HT le rapport). Le
numéro, lui, est gratuit. Trois routes qui contournent ça :

1. **L'outil de recherche d'Apple**
   (https://developer.apple.com/enroll/duns-lookup/) — gratuit, couvre la
   France, demande seulement un identifiant Apple (gratuit lui aussi).
   Saisir raison sociale + adresse ; le numéro arrive par e-mail. C'est la
   route la plus rapide, et elle resservira pour l'App Store (issue #38).
2. **Le formulaire D&B dans une autre langue** : passer par une locale
   non française, par exemple https://dunsnumberlookup.dnb.com/fr-ch,
   chercher la société, puis demander l'envoi du numéro par e-mail.
3. **Altares directement**, par téléphone ou par le formulaire de
   https://www.altares.com/fr/nos-data/duns-number/ : donner raison
   sociale, adresse du siège et SIRET, et demander *son propre* numéro —
   c'est gratuit. Délai constaté : 3 à 15 jours ouvrés.

S'il n'existe vraiment pas, la création prend 5 à **30 jours** ouvrés :
raison de plus pour lancer cette étape avant tout le reste.

En cas de doute sur les URLs, la Play Console affiche elle-même un lien
vers l'outil D&B au moment de l'inscription
([aide Google](https://support.google.com/googleplay/android-developer/answer/13628312)).

Les informations déclarées (raison sociale, adresse, téléphone) doivent
être **strictement identiques** à celles saisies ensuite dans la Play
Console et dans la politique de confidentialité (issue #27) — la moindre
divergence fait échouer la vérification.

### 0.3 Identité de la société (à recopier tel quel)

Données publiques du registre — à saisir **à l'identique** dans la Play
Console, dans la demande D-U-N-S et dans la politique de confidentialité
(issue #27) :

| Champ | Valeur |
|---|---|
| Dénomination | CAPITAINE MUFFIN |
| SIREN | 904 880 473 |
| SIRET (siège) | 904 880 473 00015 |
| D-U-N-S | 277288992 |
| Adresse du siège | 6 montée Desambrois, 06000 Nice, France |
| Immatriculation | 02/11/2021 |
| Représentant légal | Romain Guaresi, président |
| État | en activité |
| Compte propriétaire (interne) | `admin.capitainemuffin@proton.me` |
| Contact public | `contact@capitainemuffin.com` |

Forme juridique et code APE à confirmer sur le Kbis avant saisie.

⚠️ La vérification d'identité Google porte sur le **représentant légal** :
c'est la pièce d'identité de Romain qui sera demandée, et c'est son nom
qui doit figurer comme contact du compte.

### 0.4 Créer le compte

1. Aller sur https://play.google.com/console **connecté avec
   `admin.capitainemuffin@proton.me`** : ce compte devient propriétaire du
   compte développeur, et le changer ensuite passe par une procédure de
   transfert chez Google. Jamais un compte Google personnel.
2. Payer les **25 $ d'inscription** (une seule fois, à vie).
3. Renseigner :
   - type de compte : **organisation** (cf. 0.1) ;
   - nom du développeur affiché publiquement : **Capitaine Muffin** ;
   - adresse officielle et téléphone — les mêmes qu'en 0.3 et que dans la
     politique de confidentialité (issue #27) ;
   - adresse e-mail de contact publique :
     **`contact@capitainemuffin.com`** (l'adresse Proton reste interne).
4. Activer la 2FA sur le compte propriétaire et ranger les codes de
   secours ailleurs que sur un seul téléphone.

### 0.5 Vérification d'identité

Google demande ensuite les pièces justificatives (0.3) et vérifie
l'adresse et le téléphone. Répondre vite : chaque aller-retour rallonge
le délai. Le statut est suivi dans **Play Console → Paramètres → Détails
du compte de développeur**.

### 0.6 Une fois le compte validé

- Ajouter les autres membres : **Utilisateurs et autorisations** →
  inviter, rôle *Admin* ou *Développeur*.
- Créer l'application : **Toutes les applications → Créer une
  application**.
  - Nom : `Flirt — Jeu de questions` (modifiable ensuite, cf. issue #30)
  - Nom du package : **`com.flirtgame.app`** — celui de `app.json`, et
    **il est définitif**
  - Langue par défaut : français (France)
  - Type : **Application**, catégorie *Style de vie* — pas « Jeu », et
    surtout pas « Rencontres » (cf. issue #30)
  - **Gratuite**, avec achats intégrés — une app publiée gratuite ne peut
    jamais devenir payante
- ⚠️ Avant de créer les produits payants, lire
  [`ACHATS_INTEGRES.md`](ACHATS_INTEGRES.md) : la page « Produits intégrés »
  ne s'ouvre qu'après l'envoi d'un `.aab` contenant la bibliothèque de
  facturation. Le premier build doit donc déjà l'embarquer.
- ⚠️ Même contrainte pour la publicité, l'App ID AdMob devant être dans le
  manifeste au moment du build : [`PUBLICITE.md`](PUBLICITE.md).

---

## Suite du parcours

Les sections suivantes (visuels, textes de la fiche, formulaires, envoi du
`.aab`) sont écrites au fur et à mesure, quand on attaque l'issue
correspondante.

| Étape | Issue |
|---|---|
| ~~12 testeurs pour le test fermé~~ (sans objet : compte organisation) | #26 |
| Adresse officielle dans la politique de confidentialité | #27 |
| Politique de confidentialité sur une URL publique | #28 |
| Visuels (icône, 1024×500, captures) | #29 |
| Textes de la fiche Play | #30 |
| Formulaires (sécurité des données, publicité, classification, public cible) | #31 |
| Test sur un vrai téléphone (build EAS preview) | #32 |
| Achats intégrés : préparation ([`ACHATS_INTEGRES.md`](ACHATS_INTEGRES.md)) | #37 |
| Publicité : préparation ([`PUBLICITE.md`](PUBLICITE.md)) | #41 |
| Premier `.aab` en test fermé | #33 |
| Accès à la production et publication de la 1.0.0 | #34 |
