const code = "import { FIREBASE_CONFIG, APP_ID, TMDB_KEY } from './config.js';";
const configImportRegex = /import\s+{.*}\s+from\s+['"]\.\/config\.js['"];?/;
console.log('Matches:', configImportRegex.test(code));
