# Bibliotecas vendorizadas (sem CDN, sem build step)

- `web-components.min.js` — `@fluentui/web-components@3.0.1`, arquivo
  `dist/web-components.min.js` do pacote (self-contained: zero imports
  externos, registra todos os componentes como efeito colateral de
  carregar o script, expõe `setTheme` como export nomeado e também em
  `globalThis.Fluent.setTheme`). Baixado via `npm pack
  @fluentui/web-components` e extraído — nunca instalado como
  dependência do projeto (não há `package.json`/`node_modules` pro PWA).
- `tokens/` — `@fluentui/tokens@1.0.0-alpha.23`, pasta `lib/` do pacote
  (ESM com imports relativos entre si, sem nenhuma dependência externa).
  Fornece `webLightTheme`/`webDarkTheme` (`tokens/index.js`).

Pra atualizar: `npm pack @fluentui/<pacote>` numa pasta temporária,
extrair o `.tgz`, copiar os arquivos relevantes de novo por cima destes.
