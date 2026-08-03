#!/usr/bin/env node
// scripts/generate-content-json.js
// Gera content.json a partir de www/js/data.js — fonte única do
// conteúdo do livro pros três apps (o PWA lê data.js direto; o app do
// Windows e o app Android empacotam este JSON gerado, porque C# e
// Kotlin não executam JavaScript).
//
// Rodar sempre que data.js mudar. Os workflows 02-build-appx.yml e
// 04-build-apk.yml rodam `--check` antes do build e falham se
// esquecerem de regenerar, em vez de deixar os apps saírem de
// sincronia silenciosamente.

const fs = require("fs");
const path = require("path");

const data = require("../www/js/data.js");

const content = {
  weeks: data.WEEKS.map((w) => ({
    id: w.id,
    title: w.title,
    intro: w.intro,
    essay: w.essay,
    checklist: w.checklist.map((c) => ({ task: c.task, detail: c.detail, ...(c.link ? { link: c.link } : {}) })),
    checkinBonus: w.checkinBonus,
  })),
  checkinCoreQuestions: data.CHECKIN_CORE_QUESTIONS,
  artistDateIdeas: data.ARTIST_DATE_IDEAS,
  roadRules: data.ROAD_RULES,
  basicPrinciples: data.BASIC_PRINCIPLES,
  beliefTable: data.BELIEF_TABLE,
  affirmations: data.AFFIRMATIONS,
  uiStrings: data.UI_STRINGS,
  toolConfigs: Object.keys(data.TOOL_CONFIGS).map((key) => data.TOOL_CONFIGS[key]),
  quizConfigs: Object.keys(data.QUIZ_CONFIGS).map((key) => data.QUIZ_CONFIGS[key]),
};

const outPaths = [
  path.join(__dirname, "..", "uwp", "ArtistWayUWP", "Data", "content.json"),
  path.join(__dirname, "..", "android", "ArtistWayAndroid", "app", "src", "main", "assets", "content.json"),
];
const json = JSON.stringify(content, null, 2) + "\n";

// Normaliza \r\n -> \n antes de comparar — o runner do build (windows-latest)
// faz checkout com quebra de linha CRLF por padrão, o que faria essa
// checagem sempre acusar "desatualizado" mesmo quando o conteúdo é
// idêntico. O arquivo em si continua sendo escrito como o git decidir
// (ver .gitattributes), só a comparação ignora esse detalhe.
function normalizeNewlines(text) {
  return text == null ? text : text.replace(/\r\n/g, "\n");
}

if (process.argv.includes("--check")) {
  let stale = false;
  for (const outPath of outPaths) {
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : null;
    if (normalizeNewlines(current) !== normalizeNewlines(json)) {
      console.error(`content.json está desatualizado: ${outPath}`);
      stale = true;
    }
  }
  if (stale) {
    console.error("Rode: node scripts/generate-content-json.js");
    process.exit(1);
  }
  console.log("content.json está em dia nos dois destinos.");
  process.exit(0);
}

for (const outPath of outPaths) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json);
  console.log("Gerado:", outPath);
}
