/**
 * Fabrique en local un `.aab` signé, prêt à envoyer sur Play.
 *
 * Pourquoi ne pas simplement lancer EAS : chaque build EAS consomme un
 * crédit (15 par mois sur le plan gratuit), et les allers-retours de test
 * sur les achats intégrés en demandent beaucoup. Ici, c'est illimité.
 *
 * La clé de signature vient de `credentials.json`, récupéré depuis EAS par
 * `npx eas-cli credentials -p android`. Ce fichier et la clé ne sont
 * jamais commités (voir .gitignore) : ils permettent de publier au nom de
 * Capitaine Muffin.
 *
 * Le numéro de version (`versionCode`) doit être plus grand que celui déjà
 * envoyé sur Play, sinon Play refuse le fichier. Il se passe en argument :
 *
 *   node tools/build-aab.mjs 5
 *
 * Le résultat est affiché en fin d'exécution.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const versionCode = process.argv[2];
if (!/^\d+$/.test(versionCode ?? '')) {
  console.error('Usage : node tools/build-aab.mjs <versionCode>');
  console.error('Exemple : node tools/build-aab.mjs 5');
  process.exit(1);
}

const cheminCredentials = path.join(racine, 'credentials.json');
if (!existsSync(cheminCredentials)) {
  console.error('credentials.json est absent. Le récupérer avec :');
  console.error('  npx eas-cli credentials -p android');
  process.exit(1);
}

const { android } = JSON.parse(readFileSync(cheminCredentials, 'utf8'));
const cle = android?.keystore;
if (!cle?.keystorePath) {
  console.error('credentials.json ne contient pas de clé Android.');
  process.exit(1);
}

const cheminCle = path.resolve(racine, cle.keystorePath);
if (!existsSync(cheminCle)) {
  console.error(`Clé introuvable : ${cheminCle}`);
  process.exit(1);
}

// Sans ces variables, app.config.js n'ajoute pas le plugin AdMob et l'app
// plante au démarrage : le module natif est là, mais sans App ID.
const env = {
  ...process.env,
  EXPO_PUBLIC_ADMOB_APP_ID_ANDROID: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID,
  ANDROID_VERSION_CODE: versionCode,
};

for (const nom of ['EXPO_PUBLIC_ADMOB_APP_ID_ANDROID']) {
  if (!env[nom]) {
    console.error(`La variable ${nom} est absente. La lire depuis EAS avec :`);
    console.error('  npx eas-cli env:list --environment production');
    process.exit(1);
  }
}

const gradlew = path.join(racine, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradlew)) {
  console.error("Le dossier android/ n'existe pas encore. Le générer avec :");
  console.error('  npx expo prebuild --platform android');
  process.exit(1);
}

console.log(`Fabrication du .aab (versionCode ${versionCode})…`);

execFileSync(
  gradlew,
  [
    'app:bundleRelease',
    '-x',
    'lint',
    '-x',
    'test',
    '--build-cache',
    `-Pandroid.injected.version.code=${versionCode}`,
    `-Pandroid.injected.signing.store.file=${cheminCle}`,
    `-Pandroid.injected.signing.store.password=${cle.keystorePassword}`,
    `-Pandroid.injected.signing.key.alias=${cle.keyAlias}`,
    `-Pandroid.injected.signing.key.password=${cle.keyPassword}`,
  ],
  { cwd: path.join(racine, 'android'), stdio: 'inherit', env },
);

const sortie = path.join(racine, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
console.log(existsSync(sortie) ? `\nPrêt : ${sortie}` : '\nBuild terminé mais .aab introuvable.');
