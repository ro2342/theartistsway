#!/usr/bin/env node
// scripts/generate-content-json.js
// Gera uwp/ArtistWayUWP/Data/content.json a partir de www/js/data.js --
// fonte única do conteúdo do livro pros dois apps (o PWA lê data.js
// direto; o app do Windows empacota este JSON gerado, porque C# não
// executa JavaScript).
//
// Rodar sempre que data.js mudar. O workflow 02-build-appx.yml roda
// `--check` antes do build e falha se esquecerem de regenerar, em vez
// de deixar os dois apps saírem de sincronia silenciosamente.

const fs = require("fs");
const path = require("path");

const data = require("../www/js/data.js");

const content = {
  weeks: data.WEEKS.map((w) => ({
    id: w.id,
    title: w.title,
    intro: w.intro,
    essay: w.essay,
    checklist: w.checklist.map((c) => ({ task: c.task, detail: c.detail })),
    checkinBonus: w.checkinBonus,
  })),
  checkinCoreQuestions: data.CHECKIN_CORE_QUESTIONS,
  artistDateIdeas: data.ARTIST_DATE_IDEAS,
  roadRules: data.ROAD_RULES,
  basicPrinciples: data.BASIC_PRINCIPLES,
  beliefTable: data.BELIEF_TABLE,
  affirmations: data.AFFIRMATIONS,
};

const outPath = path.join(__dirname, "..", "uwp", "ArtistWayUWP", "Data", "content.json");
const json = JSON.stringify(content, null, 2) + "\n";

// Normaliza \r\n -> \n antes de comparar -- o runner do build (windows-latest)
// faz checkout com quebra de linha CRLF por padrão, o que faria essa
// checagem sempre acusar "desatualizado" mesmo quando o conteúdo é
// idêntico. O arquivo em si continua sendo escrito como o git decidir
// (ver .gitattributes), só a comparação ignora esse detalhe.
function normalizeNewlines(text) {
  return text == null ? text : text.replace(/\r\n/g, "\n");
}

if (process.argv.includes("--check")) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : null;
  if (normalizeNewlines(current) !== normalizeNewlines(json)) {
    console.error(
      "content.json está desatualizado em relação a www/js/data.js.\n" +
        "Rode: node scripts/generate-content-json.js"
    );
    process.exit(1);
  }
  console.log("content.json está em dia.");
  process.exit(0);
}

fs.writeFileSync(outPath, json);
console.log("Gerado:", outPath);
