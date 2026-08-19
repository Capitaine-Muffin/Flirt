/**
 * Configuration du serveur, lue dans l'environnement.
 *
 * Aucun secret n'est écrit dans le dépôt : voir .env.example pour la liste
 * des variables et leur provenance.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** @param {Record<string, string | undefined>} [env] */
export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT ?? 8080),
    dataFile: resolve(serverRoot, env.DATA_FILE ?? './data/entitlements.json'),
    revenueCatWebhookSecret: env.REVENUECAT_WEBHOOK_SECRET ?? '',
    googlePlayPackageName: env.GOOGLE_PLAY_PACKAGE_NAME ?? 'com.flirtgame.app',
    googleServiceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '',
  };
}
