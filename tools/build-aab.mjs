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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * La racine du projet. On préfère le dossier courant quand c'est bien le
 * projet : sous Windows, le chemin réel (`.../Capitaine muffin/...`) fait
 * dépasser la limite des 260 caractères pendant la compilation C++, et on
 * s'en sort en lançant le build depuis un lien de dossier plus court.
 * Repartir de l'emplacement du script annulerait ce raccourci, puisqu'il
 * résout le lien.
 */
const racine = existsSync(path.join(process.cwd(), 'app.json'))
  ? process.cwd()
  : path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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

deplacerDossierCxx();
inscrireVersionCode();

console.log(`Fabrication du .aab (versionCode ${versionCode})…`);

// Sur Windows, gradlew est un .bat : Node refuse de le lancer directement
// depuis Node 20, il faut passer par le shell. Mais le shell recoupe la
// ligne de commande sur les espaces — et le projet vit dans un dossier qui
// en contient. D'où les guillemets sur tout ce qui est un chemin.
const windows = process.platform === 'win32';
const proteger = (valeur) => (windows ? `"${valeur}"` : valeur);

try {
  execFileSync(
    proteger(gradlew),
    [
      'app:bundleRelease',
      '-x',
      'lint',
      '-x',
      'test',
      '--build-cache',
      proteger(`-Pandroid.injected.signing.store.file=${cheminCle}`),
      `-Pandroid.injected.signing.store.password=${cle.keystorePassword}`,
      `-Pandroid.injected.signing.key.alias=${cle.keyAlias}`,
      `-Pandroid.injected.signing.key.password=${cle.keyPassword}`,
    ],
    {
      cwd: path.join(racine, 'android'),
      stdio: 'inherit',
      env,
      shell: windows,
    },
  );
} catch (erreur) {
  // Surtout ne pas relayer l'erreur telle quelle : elle contient la ligne
  // de commande complète, mots de passe de la clé compris, et finirait
  // recopiée dans un journal.
  console.error(`\nÉchec du build (code ${erreur.status ?? 'inconnu'}).`);
  console.error('Le détail est affiché ci-dessus par Gradle.');
  process.exit(1);
}

const sortie = path.join(racine, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
console.log(existsSync(sortie) ? `\nPrêt : ${sortie}` : '\nBuild terminé mais .aab introuvable.');

/**
 * Écrit le `versionCode` demandé dans `android/app/build.gradle`.
 *
 * On n'utilise pas `-Pandroid.injected.version.code` : Android Gradle ne
 * l'honore que lorsqu'il se croit lancé depuis Android Studio, et le
 * bundle sortait donc silencieusement en versionCode 1 — que Play refuse
 * comme une régression.
 *
 * Comme pour le dossier C++, le fichier est régénéré par `expo prebuild`,
 * d'où la réécriture à chaque build.
 */
function inscrireVersionCode() {
  const chemin = path.join(racine, 'android', 'app', 'build.gradle');
  const contenu = readFileSync(chemin, 'utf8');
  let remplace = contenu.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);

  if (remplace === contenu && !contenu.includes(`versionCode ${versionCode}`)) {
    console.error("Impossible d'inscrire le versionCode dans build.gradle.");
    process.exit(1);
  }

  // `app.json` fait foi pour le numéro affiché aux joueurs, même sans
  // repasser par `expo prebuild`.
  const { expo } = JSON.parse(readFileSync(path.join(racine, 'app.json'), 'utf8'));
  remplace = remplace.replace(/versionName\s+"[^"]*"/, `versionName "${expo.version}"`);

  writeFileSync(chemin, remplace);
  console.log(`Version : ${expo.version} (code ${versionCode})`);
}

/**
 * Sort la compilation C++ du dossier du projet, vers `C:\cxx`.
 *
 * Le chemin réel du projet est déjà long, et CMake y ajoute une centaine
 * de caractères (`android/app/.cxx/RelWithDebInfo/<hash>/<abi>/…`). On
 * dépasse alors les 260 caractères de Windows et `ninja` s'arrête — y
 * compris avec `LongPathsEnabled`, qu'il n'exploite pas.
 *
 * Écrit dans `android/app/build.gradle`, qui est régénéré par
 * `expo prebuild` : d'où la vérification à chaque build plutôt qu'une
 * modification faite une fois pour toutes.
 */
function deplacerDossierCxx() {
  if (process.platform !== 'win32') return;

  const chemin = path.join(racine, 'android', 'app', 'build.gradle');
  const contenu = readFileSync(chemin, 'utf8');
  if (contenu.includes('buildStagingDirectory')) return;

  const ancre = 'android {\n';
  if (!contenu.includes(ancre)) {
    console.warn("Impossible de déplacer le dossier de compilation C++ : bloc android introuvable.");
    return;
  }

  const ajout =
    ancre +
    '    // Ajouté par tools/build-aab.mjs : voir deplacerDossierCxx().\n' +
    '    externalNativeBuild {\n' +
    '        cmake {\n' +
    '            buildStagingDirectory = file("C:/cxx/flirt")\n' +
    '        }\n' +
    '    }\n\n';

  writeFileSync(chemin, contenu.replace(ancre, ajout));
  console.log('Compilation C++ redirigée vers C:/cxx/flirt (limite Windows des 260 caractères).');
}
