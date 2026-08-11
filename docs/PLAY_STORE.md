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

### 0.2 Le numéro D-U-N-S

Le D-U-N-S est un identifiant à 9 chiffres attribué gratuitement par
Dun & Bradstreet à une entreprise — l'équivalent international du SIREN.
Google l'utilise pour vérifier que la société existe.

1. **Vérifier s'il existe déjà** : https://www.dnb.com/duns/lookup —
   chercher la raison sociale exacte de Capitaine Muffin. Beaucoup de
   sociétés françaises immatriculées en ont un sans le savoir.
2. **Sinon, le demander** (gratuit) sur le même formulaire. Délai annoncé :
   quelques jours à **30 jours**. C'est la raison pour laquelle cette
   étape passe avant tout le reste.

Les informations déclarées (raison sociale, adresse, téléphone) doivent
être **strictement identiques** à celles saisies ensuite dans la Play
Console et dans la politique de confidentialité (issue #27) — la moindre
divergence fait échouer la vérification.

### 0.3 Créer le compte

1. Aller sur https://play.google.com/console avec le compte Google qui
   servira de propriétaire (utiliser une adresse pérenne, pas une adresse
   personnelle jetable — elle ne peut pas être changée facilement).
2. Payer les **25 $ d'inscription** (une seule fois, à vie).
3. Renseigner :
   - type de compte : organisation / personnel (cf. 0.1) ;
   - nom du développeur affiché publiquement : **Capitaine Muffin** ;
   - adresse officielle et téléphone — les mêmes que dans la politique de
     confidentialité (issue #27) ;
   - adresse e-mail de contact publique, affichée sur la fiche Play.

### 0.4 Vérification d'identité

Google demande ensuite les pièces justificatives (0.1) et vérifie
l'adresse et le téléphone. Répondre vite : chaque aller-retour rallonge
le délai. Le statut est suivi dans **Play Console → Paramètres → Détails
du compte de développeur**.

### 0.5 Une fois le compte validé

- Ajouter les autres membres : **Utilisateurs et autorisations** →
  inviter, rôle *Admin* ou *Développeur*.
- Créer l'application : **Toutes les applications → Créer une
  application**.
  - Nom : `Flirt — Jeu de questions` (modifiable ensuite, cf. issue #30)
  - Langue par défaut : français (France)
  - Type : **Application**, catégorie *Style de vie* — pas « Jeu », et
    surtout pas « Rencontres » (cf. issue #30)
  - Gratuite, avec achats intégrés
- Vérifier que le nom de package `com.flirtgame.app` (dans `app.json`)
  est bien celui utilisé au premier envoi : **il est définitif**.

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
| Premier `.aab` en test fermé | #33 |
| Accès à la production et publication de la 1.0.0 | #34 |
