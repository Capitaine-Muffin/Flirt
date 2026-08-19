/**
 * Point d'entrée : assemble la configuration, le magasin de droits et les
 * routes, puis écoute.
 *
 *   npm start          (dans server/)
 */
import { loadConfig } from './config.js';
import { createPlayClient } from './googlePlay.js';
import { createServer } from './server.js';
import { createStore } from './store.js';

const config = loadConfig();
const store = await createStore(config.dataFile);
const playClient = createPlayClient({
  serviceAccountJson: config.googleServiceAccountJson,
  packageName: config.googlePlayPackageName,
});

createServer({ store, playClient, config }).listen(config.port, () => {
  console.log(`[flirt-backend] écoute sur :${config.port}`);
  if (!config.revenueCatWebhookSecret) {
    console.warn('[flirt-backend] REVENUECAT_WEBHOOK_SECRET absent : le webhook répondra 503.');
  }
  if (!playClient.isConfigured()) {
    console.warn('[flirt-backend] pas de compte de service Google : /verify répondra 503.');
  }
});
