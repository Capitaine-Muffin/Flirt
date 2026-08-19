// Configuration Metro.
//
// Seul ajout : `react-native-purchases` (les achats in-app) est facultatif.
// Il n'est installé qu'au moment des builds EAS ; dans Expo Go, il n'est pas
// là. Or Metro échoue à la compilation quand un `require` ne se résout pas —
// un try/catch ne suffit pas, l'erreur arrive avant l'exécution. On le
// remplace donc par un module vide tant qu'il n'est pas installé, et
// src/services/purchases.ts retombe alors sur la simulation.
const { getDefaultConfig } = require('expo/metro-config');

const OPTIONAL_MODULES = ['react-native-purchases'];

const config = getDefaultConfig(__dirname);

const missing = new Set(
  OPTIONAL_MODULES.filter((name) => {
    try {
      require.resolve(name);
      return false;
    } catch {
      return true;
    }
  }),
);

if (missing.size > 0) {
  const defaultResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (missing.has(moduleName)) return { type: 'empty' };
    return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
