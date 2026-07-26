// Contrôle qualité du contenu : comptages par pack, % duo, doublons.
// Usage : node check-questions.js /home/user/Flirt/src/data/questions.ts
const fs = require('fs');

const src = fs.readFileSync(process.argv[2], 'utf8');
const literal = src.match(/export const PACKS: QuestionPack\[\] = (\[[\s\S]*?\n\]);/)[1];
const PACKS = eval('(' + literal + ')');

const normalize = (t) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

let total = 0, totalDuo = 0, ok = true;
const seen = new Map();

for (const p of PACKS) {
  const duo = p.questions.filter((q) => typeof q !== 'string').length;
  total += p.questions.length;
  totalDuo += duo;
  const pct = Math.round((duo / p.questions.length) * 100);
  console.log(
    `${p.emoji} ${p.title}: ${p.questions.length} questions (${duo} duo, ${pct} %)` +
      (p.premium ? ' [premium]' : ' [gratuit]'),
  );
  for (const q of p.questions) {
    const text = typeof q === 'string' ? q : q.text;
    const key = normalize(text);
    if (seen.has(key)) {
      console.log(`  ⚠️ DOUBLON: « ${text} » (déjà dans ${seen.get(key)})`);
      ok = false;
    } else {
      seen.set(key, p.title);
    }
    if (/\bex\b|mon ex|ton ex|son ex/i.test(text)) {
      console.log(`  ⚠️ RÉFÉRENCE EX: « ${text} »`);
      ok = false;
    }
  }
}
console.log(`\nTOTAL: ${total} questions, dont ${totalDuo} duo (${Math.round((totalDuo / total) * 100)} %)`);
process.exit(ok ? 0 : 1);
