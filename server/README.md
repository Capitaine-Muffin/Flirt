# Backend des achats intégrés

Petit serveur Node, sans aucune dépendance, qui fait deux choses :

1. **reçoit les webhooks RevenueCat** — achat, remboursement, transfert de
   compte — et tient à jour la liste de qui possède quoi ;
2. **vérifie un achat auprès de Google Play** (et l'acquitte), pour le jour
   où on voudrait se passer de RevenueCat, ou simplement lever un doute sur
   une commande.

## Faut-il le déployer pour sortir l'app ? Non.

À dire clairement : **Flirt peut sortir sur le Play Store sans ce serveur.**
Les achats de Flirt sont définitifs et sans compte utilisateur ; la
validation des reçus, la mémoire des achats et la restauration sont déjà
assurées par RevenueCat, qui est le vrai backend. Ce dossier existe pour
trois raisons, toutes utiles *plus tard* :

- savoir ce qui se vend sans dépendre du tableau de bord d'un tiers ;
- réagir aux remboursements et aux litiges ;
- pouvoir quitter RevenueCat sans repartir de zéro (`/v1/purchases/google/verify`
  fait le même travail en direct avec Google).

L'app, elle, n'appelle pas ce serveur : elle parle à RevenueCat. Le serveur
est un observateur.

## Lancer

```bash
cd server
cp .env.example .env      # puis renseigner les valeurs
npm start                 # écoute sur $PORT (8080 par défaut)
npm test                  # 16 tests, sans réseau
```

Node 20 minimum. Aucune dépendance à installer : tout vient de Node.

## Routes

| Route | Rôle |
|---|---|
| `GET /health` | le serveur répond, et dit ce qui est configuré |
| `GET /v1/entitlements/:appUserId` | les produits possédés par un utilisateur |
| `POST /v1/webhooks/revenuecat` | événements RevenueCat (secret obligatoire) |
| `POST /v1/purchases/google/verify` | vérifie + acquitte un achat Play |

Le webhook exige un en-tête `Authorization` strictement égal à
`REVENUECAT_WEBHOOK_SECRET` (comparaison à durée constante). Tant que ce
secret n'est pas configuré, la route répond 503 : mieux vaut refuser que
gober n'importe quel appel.

`GET /v1/entitlements/:appUserId` n'est pas protégé : l'identifiant
RevenueCat est un UUID imprévisible et la réponse ne contient que des
identifiants de produits, aucune donnée personnelle. Si un jour cette route
sert à débloquer du contenu, il faudra l'authentifier.

## Branchement des webhooks

RevenueCat → *Project settings* → *Integrations* → *Webhooks* :

- URL : `https://<le-serveur>/v1/webhooks/revenuecat`
- *Authorization header* : la même valeur que `REVENUECAT_WEBHOOK_SECRET`

Les événements rejoués (RevenueCat réessaie en cas d'erreur) sont
dédupliqués par leur `id` : traiter deux fois le même achat est sans effet.

## Stockage

Un fichier JSON (`data/entitlements.json`), écrit de façon atomique,
projeté depuis les événements reçus. C'est volontairement rustique : à
l'échelle de Flirt, une base de données serait une charge d'entretien sans
contrepartie. Le jour où ça ne suffit plus, seul `src/store.js` change.

⚠️ Sur un hébergeur au système de fichiers éphémère (Heroku, Cloud Run,
Vercel…), monter un volume persistant ou remplacer `src/store.js`. Sinon
les droits disparaissent au redéploiement — sans gravité (RevenueCat reste
la source de vérité) mais l'historique local est perdu.

## Compte de service Google (facultatif)

Nécessaire seulement pour `/v1/purchases/google/verify` :

1. Play Console → *Paramètres* → *Accès à l'API* → lier un projet Google
   Cloud, créer un compte de service ;
2. lui donner le droit *Voir les données financières* sur l'application ;
3. télécharger la clé JSON et la coller, sur une seule ligne, dans
   `GOOGLE_SERVICE_ACCOUNT_JSON`.

Cette clé donne accès aux données de vente : elle ne doit jamais entrer
dans le dépôt ni dans l'app.
