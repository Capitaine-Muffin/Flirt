// Configuration Metro.
//
// Seul ajout : les modules natifs de monétisation (achats in-app et
// publicité) sont facultatifs. Ils ne sont installés qu'au moment des builds
// EAS ; dans Expo Go, ils ne sont pas là. Or Metro échoue à la compilation
// quand un `require` ne se résout pas — un try/catch ne suffit pas, l'erreur
// arrive avant l'exécution. On les remplace donc par un module vide tant
// qu'ils ne sont pas installés, et src/services/{purchases,ads}.ts retombent
// alors sur la simulation.
const { getDefaultConfig } = require('expo/metro-config');

const OPTIONAL_MODULES = ['react-native-purchases', 'react-native-google-mobile-ads'];

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
