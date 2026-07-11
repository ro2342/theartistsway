# Catálogo de Funcionalidades — Companheiro do Artist's Way

*Todas as ideias discutidas até agora (125 no total), organizadas por categoria, cada uma com uma explicação do que é no livro e onde entraria no app. As marcadas com ⭐ são as 30 selecionadas pra entrar de fato no app agora — escolhidas por equilibrarem valor real com compatibilidade total entre o PWA moderno e o app do Windows 10 Mobile no Lumia 830 (nada de câmera, áudio avançado, animações pesadas ou APIs recentes — só formulários, listas, IndexedDB e, no máximo, um gráfico simples em canvas 2D, que funciona igual nas duas plataformas).*

---

## Como ler este documento

Cada item tem:
- **O que é no livro** — de onde vem a ideia, em que semana aparece
- **Onde entra no app** — a tela ou funcionalidade que ela viraria
- Itens ⭐ têm uma explicação mais completa porque são os que recomendo construir primeiro

---

## 1. Referência permanente (textos "vivos" do livro, hoje presos a uma semana só e depois somem)

### ⭐ Regras da Estrada
No livro, é uma lista de 10 frases-guia que fecham a Semana 2 — praticamente um resumo de "como se comportar como artista" (mostre-se na página, escolha companhias que incentivem o trabalho, seu papel é fazer, não julgar). Hoje, no app, não existe em lugar nenhum — some junto com a Semana 2. A ideia é um cartão fixo, acessível a qualquer momento (por exemplo, dentro de Ajustes ou um atalho na barra inferior), pra reler sempre que bater a dúvida "eu tô fazendo isso certo?". Já mandei um `.md` dedicado só a ela.

### ⭐ Princípios Básicos
É a lista de 10 princípios espirituais que abre o livro (criatividade é a ordem natural da vida, recusar-se a criar vai contra sua própria natureza, etc.) — a base filosófica de tudo. O livro pede pra reler isso todo dia, de manhã e à noite, ao longo de várias semanas. Um cartão fixo (igual às Regras da Estrada) resolveria isso, em vez de ficar preso à Semana 2 como está hoje.

### ⭐ Tabela Crença Negativa → Alternativa Positiva
Uma tabela de duas colunas do livro (Semana 1): de um lado clichês negativos sobre artistas ("bêbado", "louco", "sempre duro na grana"), do outro o oposto possível ("sóbrio", "são", "solvente"). É um contraponto visual rápido às Crenças Centrais Negativas que você escreve na Semana 1. Cartão de referência simples, reutilizável a qualquer momento que a autocrítica bater.

### ⭐ Banco de Afirmações Criativas prontas
O livro tem uma lista de 20 afirmações já escritas ("minha criatividade sempre me leva à verdade e ao amor", etc.), pra usar quando você não sabe o que afirmar. Hoje isso não existe no app. Uma delas sorteada todo dia, aparecendo sozinha na Home (do lado do bloco de Morning Pages), reforça o hábito sem precisar abrir mais nada.

### Regras do Círculo Sagrado
Do apêndice do livro sobre "clusters" (grupos que fazem o processo juntos): regras básicas de convivência do grupo (não ler a página do outro, sem crítica entre membros, etc.). Só relevante se algum dia você quiser um modo multiplayer/grupo — por enquanto fica de fora do escopo, mas vale documentar pra o futuro.

---

## 2. Diagramas e mapas visuais (hoje só descritos em texto, viram interativos)

### ⭐ Life Pie (gráfico de radar)
É o exercício de desenhar um círculo dividido em fatias (espiritualidade, trabalho, lazer, amigos, romance, exercício) e marcar o quanto cada área está satisfeita — aparece nas Semanas 2 e 4, pra comparar o antes e depois. Um gráfico de radar tocável (arrastar cada eixo pra ajustar o nível), salvo com a data, permitindo ver as duas versões lado a lado depois. Tecnicamente simples: canvas 2D básico, sem dependência de biblioteca pesada — roda igual num navegador moderno e numa WebView antiga do Windows Phone.

### ⭐ Mapa do Ciúme
Tabela de 3 colunas da Semana 7 (quem você sente inveja, por quê, e uma ação-antídoto pra cada um). Um formulário de linhas adicionáveis, bem mais rápido que escrever isso no papel, e que fica salvo pra reler depois — o livro sugere que essa lista muda bastante ao longo do processo.

### ⭐ Círculo de Segurança
Da Semana 2: um mapa de "quem apoia" dentro de um círculo e "de quem se proteger por enquanto" fora dele. Duas listas simples lado a lado (tocar pra mover um nome de uma lista pra outra conforme a relação muda ao longo das semanas) resolveria isso melhor que o papel, que não se atualiza fácil.

---

## 3. Listas vivas que crescem semana a semana (hoje são escritas uma vez e desaparecem)

### ⭐ Vidas Imaginárias
Lista que começa na Semana 1 (5 vidas que você gostaria de ter vivido) e cresce a cada semana subsequente (+5 na Semana 2, mais na Semana 5). Hoje, cada semana pede pra "voltar à lista anterior", mas não há lista nenhuma persistida no app — cada vez é do zero. Uma lista permanente, com data de quando cada item foi adicionado, resolve isso de vez.

### ⭐ 20 Coisas que Gosto de Fazer
Lista da Semana 2 que reaparece disfarçada em pelo menos três exercícios diferentes ao longo do livro (inclusive na Busca de Estilo da Semana 8). Uma lista viva e reutilizável evita ter que escrever a mesma coisa de novo em semanas diferentes — e vira, de brinde, um banco de ideias pra Artist Date.

### Mudanças Pequenas Desejadas
Lista de 10 mudanças da Semana 2 ("pintar a cozinha", "comprar lençol novo"), com checkbox pra marcar quais já foram feitas — hoje é só uma lista escrita e esquecida.

### Aventuras aos 20
Lista da Semana 5: o que você faria se tivesse 20 anos e dinheiro sobrando.

### Prazeres aos 65
Lista paralela à anterior — o que você faria se tivesse 65 anos e dinheiro sobrando. As duas juntas, lado a lado, tornam bem visível o padrão de coisas que você anda adiando por "não ser a hora".

### Dureza Comigo Mesmo
Lista de 10 formas de autocrítica da Semana 5 — reaproveitável como referência pra notar se o padrão está diminuindo ao longo das semanas.

### Coisas que Quero Ter
Lista simples de 10 desejos materiais, também da Semana 5.

### Favoritos por Categoria
Lista livre de favoritos (cor, comida, banda, cheiro, lugar) da Semana 6 — pequena, mas funciona bem como um "perfil" pessoal dentro do app.

---

## 4. Cartas e mensagens (hoje são tarefas de checklist que somem depois de escritas)

### ⭐ Carta de você aos 80 anos
Exercício da Semana 4: escrever pra si mesmo hoje, a partir da perspectiva de quem você será daqui a décadas. Hoje é só um item de checklist riscado — merece um campo de texto salvo e relido, principalmente perto do fim do programa.

### ⭐ Carta de você aos 8 anos
A carta espelhada da anterior, também da Semana 4, escrita a partir de quem você foi quando criança.

### ⭐ Oração do Artista
Escrita na Semana 4, e o livro pede pra usá-la todos os dias daquela semana — e de novo na Semana 11, guardada na carteira. Hoje ela é escrita uma vez e esquecida; salvá-la permite reabri-la e reler nas semanas seguintes, exatamente como o livro sugere.

### ⭐ Carta de encorajamento à criança-artista
Da Semana 11 — uma carta de apoio, escrita já numa fase mais fortalecida do processo, fechando o ciclo aberto na carta de defesa da Semana 1. Vale salvar e mostrar lado a lado com a carta da Semana 1, se ela também for salva.

### Novas afirmações do futuro
Da Semana 12 — comparáveis, lado a lado, com as afirmações escritas na Semana 1, pra visualizar a mudança de tom ao longo do processo.

---

## 5. Diários temáticos contínuos (não presos a nenhuma semana específica)

### ⭐ Diário de Sincronicidade
O conceito de sincronicidade aparece espalhado pelo livro inteiro (mais forte nas Semanas 3 e 12, que inclusive pede 10 exemplos pessoais como tarefa). Um registro solto, sempre disponível (não preso a nenhuma semana), pra anotar toda vez que uma "coincidência boa" acontecer, é mais fiel ao espírito do conceito do que prendê-lo a uma tarefa única.

### ⭐ Registro do Poço Criativo
Separado do Artist Date semanal: qualquer gesto sensorial pequeno do dia a dia que "encheu o poço" (um cheiro, uma música ouvida com atenção, um caminho diferente pra casa) — o livro trata isso como hábito diário, espalhado em vários capítulos (Semana 1 e a seção "Filling the Well"), não só semanal.

### ⭐ Diário de Resistência
Registro rápido de "hoje evitei fazer X" — conecta direto com a Semana 9, que ensina a chamar isso de medo, não preguiça. Ajuda a enxergar um padrão de procrastinação ao longo do tempo, em vez de cada adiamento parecer um evento isolado.

### Contador de Crenças Negativas
Um botão simples de "pegar a si mesmo pensando nisso de novo", ligado às Crenças Centrais Negativas da Semana 1 — útil pra visualizar a frequência caindo (ou não) ao longo das 12 semanas.

---

## 6. Micro-rituais recorrentes (hoje são 1 tarefa isolada numa semana específica)

### Coletar pedrinhas/folhas
Da Semana 6 — hoje é uma tarefa única; um log recorrente permitiria repetir o ritual mais vezes, se quiser.

### Doar roupas
Aparece tanto na Semana 4 quanto na Semana 6 — um checklist contínuo (não preso a uma semana) reflete melhor como o livro trata isso como hábito, não evento único.

### Mandar postais/mensagens
Da Semana 6 — registro de quem e quando, útil pra não repetir sempre as mesmas pessoas.

### Ouvir um álbum inteiro sem fazer mais nada
Da Semana 7 — log de sessões, com o nome do álbum, se quiser.

### Visitar espaço de silêncio
Da Semana 7 — log de lugares visitados ao longo do tempo.

### Criar cheiro bom em casa
Da Semana 7 — checklist recorrente simples.

### Usar roupa favorita num dia comum
Da Semana 7 — registro de quando você fez isso.

### Presente pequeno pra si mesmo
Da Semana 7 — log recorrente dos pequenos mimos.

### Praticar dizer "sim"
Da Semana 6 — diário de pequenas aceitações a coisas boas oferecidas.

---

## 7. Metas e planejamento estruturado (Semana 8 — "The Steps")

### ⭐ Busca de Metas / Norte Verdadeiro
O núcleo da Semana 8: nomear um sonho secreto, depois definir o que especificamente sinalizaria realizá-lo (o "norte verdadeiro" — o livro usa o exemplo de duas atrizes que querem a mesma coisa por motivos bem diferentes: uma quer fama, outra quer respeito). Hoje isso é um item de checklist solto; merece um formulário estruturado próprio, guardando sonho + norte verdadeiro juntos como referência.

### ⭐ Plano em 6 Horizontes
Continuação direta do item anterior: quebrar o sonho em ações de 5 anos, 3 anos, 1 ano, 1 mês, 1 semana e agora. Um formulário em camadas, ligado ao Norte Verdadeiro acima, torna o plano inteiro visível de uma vez.

### Esquema de Cor
Exercício lúdico da Semana 8: escrever-se na primeira pessoa como se fosse uma cor. Mais leve, cabe como um campo de texto livre opcional.

### ⭐ Busca de Estilo
Lista de 20 atividades (reaproveitando a lista "20 Coisas que Gosto de Fazer") categorizadas por critérios do livro: custa dinheiro? sozinho ou acompanhado? risco físico? ligado a trabalho? Um formulário com tags rápidas por item revela um "perfil" de estilo criativo que hoje fica só implícito.

### ⭐ Dia Ideal
Planejar um dia perfeito dentro da vida atual, com o que já é possível hoje.

### ⭐ Dia Ideal Ideal
A versão sem nenhuma restrição do exercício anterior — os dois lado a lado tornam a distância entre eles bem mais concreta.

---

## 8. Altar do Artista (Semana 12)

### Descrição do altar pessoal
Registro de onde fica o cantinho/altar sensorial que o livro sugere montar, e o que tem nele.

### Checklist de itens sensoriais
Lista de conferência dos elementos sugeridos pelo livro (vela, pedra, incenso, objeto especial) — mais decorativo que essencial, baixa prioridade.

---

## 9. Exercícios "complete a frase" (viram formulários rápidos de preenchimento)

### Trabalho de Detetive
Frases sobre brinquedo/jogo/filme favorito da infância, da Semana 2 — puro resgate de memória através de associação livre.

### Sonhos Enterrados
6 listas de 5 itens (hobbies, aulas, habilidades que soam divertidas), da Semana 4.

### Quiz da Armadilha da Virtude
10 frases sobre culpa e autossabotagem, da Semana 5.

### Alegrias Proibidas
10 coisas que você ama mas não se permite fazer, também da Semana 5.

### Lista de Desejos
19 "eu gostaria de..." rápidos e sem filtro, da Semana 5.

### Loucura do Dinheiro
20 frases sobre crenças herdadas sobre dinheiro, da Semana 6.

### ⭐ Arqueologia (parte 1 e 2)
Duas listas complementares da Semana 6: o que faltou na infância, e depois um inventário positivo do presente. A junção das duas — perda e ganho lado a lado — é um dos exercícios mais ricos emocionalmente do livro, e merece um espaço próprio em vez de sumir como checklist riscado.

### Condicionamentos Antigos
Frases sobre o que pais/professores disseram sobre sua criatividade quando criança, da Semana 8 — mais pesado emocionalmente, então baixa prioridade pra essa primeira leva.

### Nova Infância
Escrever a infância que você teria tido com cuidado perfeito, da Semana 8.

---

## 10. Histórico e estatísticas (hoje o app só mostra "agora", sem memória do passado)

### ⭐ Histórico de Artist Dates
Linha do tempo com todos os dates já feitos, data e o que foi escolhido — hoje só existe o status da semana atual, sem registro do que já passou.

### ⭐ Reler check-ins antigos
Tela pra abrir qualquer check-in de semanas anteriores e reler as próprias respostas — é literalmente um exercício que o livro pede na Semana 9 (reler as próprias páginas com atenção).

### ⭐ Contador de dias
Algo simples tipo "dia 23 de 84" ou "faltam 19 dias pra Semana 12" na Home — motivador, e fácil de implementar já que a data de início já é salva.

### Linha do tempo de humor semanal
Emoji de humor geral marcado a cada check-in, formando um gráfico da curva emocional das 12 semanas que o próprio livro descreve (raiva, luto, retorno em U, etc.).

### Favoritar ideias de Artist Date
Marcar uma ideia do banco como favorita, pra repetir depois em vez de só sortear e esquecer.

### Histórico de rodadas completas
Se um dia repetir o programa do zero, guardar cada volta separada sem misturar dados com a primeira — baixa prioridade até alguém realmente pedir uma segunda volta.

---

## 11. Exercícios de bloqueio e resistência (Semana 9 — "Blasting Through Blocks")

### ⭐ Resentimentos, Medos e Ganho Oculto
Trio de listas ligadas a um projeto específico: o que te ressente nele, o que teme, e o que ganha (inconscientemente) em não fazê-lo. O livro descreve isso como um exercício "poderoso o bastante pra destravar bloqueios sérios" — vale um formulário dedicado, não só um item de checklist.

### Assinatura do Trato
"Eu cuido da quantidade, você (força criativa) cuida da qualidade" — um gesto simbólico de assinatura, ligado ao exercício anterior.

---

## 12. Quizzes estruturados

### ⭐ Quiz do Vício em Trabalho
20 perguntas sim/às vezes/nunca da Semana 10, com uma pontuação simples no final — dá pra fazer isso com um formulário de múltipla escolha e uma contagem automática, sem nenhuma complexidade técnica extra.

### Balanço da Semana 9
Três perguntas fixas (do que reclamei / o que procrastinei / o que já mudou), preenchidas uma vez no meio do programa.

---

## 13. Planejamento de autocuidado (Semana 11)

### ⭐ Caderno de Desejos
7 áreas da vida (saúde, posses, lazer, relações, criatividade, carreira, espiritualidade) × 10 desejos cada — um formulário com abas, uma por área, guardando 70 itens no total de forma organizada.

### 5 formas de nutrir nos próximos 6 meses
Lista curta e objetiva, complementar ao Caderno de Desejos.

### Planejador de 1 semana de autocuidado
Uma ação concreta de autocuidado por dia, durante uma semana — like um mini-checklist temporário.

---

## 14. Retorno em U e projetos abandonados

### ⭐ Registro de Retornos em U
Nomear um projeto criativo abandonado, o motivo (quase sempre medo, segundo o livro), e se vale a pena resgatar agora — conceito da Semana 9, hoje sem nenhum lugar fixo no app.

### Metas criativas do ano/mês/semana
Três listas alinhadas, da Semana 9 — evita o erro comum de ter metas anuais grandiosas sem nenhuma ação semanal que as sustente.

---

## 15. Reflexões de fechamento (Semana 12)

### "O que eu criaria sem nenhuma restrição"
Pergunta final do programa, isolada como reflexão de encerramento.

### Lista de 5 pessoas pra compartilhar sonhos
Tarefa literal da Semana 12.

### ⭐ Plano de continuidade
Como manter Morning Pages e Artist Date depois do programa — pergunta explícita da Semana 12, que hoje simplesmente não tem nenhum lugar reservado no app pra ser respondida.

### Releitura de crenças da Semana 1
Comparar diretamente com o que foi escrito na Semana 12 — só faz sentido se as Crenças Centrais Negativas da Semana 1 também forem salvas (ver item 9).

### 10 exemplos de sincronicidade pessoal
Tarefa literal da Semana 12 — se o Diário de Sincronicidade (categoria 5) já existir, isso vira automático: é só contar quantas entradas existem.

---

## 16. Extras ligados a temas específicos

### ⭐ Totem do Artista
Campo fixo (não uma tarefa que risca e some) pra guardar o nome/descrição do objeto que representa sua criança-artista, da Semana 9.

### Lista "5 coisas que não posso fazer"
Da Semana 3 e reaparece na Semana 8 — registro de como foi expressar isso fisicamente (desenho, dança, papel).

### Reflexão sobre conceito de força maior/Deus
Pergunta recorrente em várias semanas — revisitável, não precisa de tela própria, mas vale um campo salvo.

### ⭐ Bottom Line / Limites Não-Negociáveis
Lista permanente de limites, da Semana 10 — hoje é só um item de checklist que risca e esquece; sendo permanente e sempre visível, funciona de verdade como lembrete de limite.

### ⭐ Pontos de Referência de Felicidade
Lista sempre visível de pequenos consolos que funcionam pra você, também da Semana 10 — pensada pelo livro pra ser consultada em momentos difíceis, então faz sentido estar sempre a um toque de distância.

### Marcação de insight vs. ação nas próprias Morning Pages
Da Semana 9 — como as páginas continuam sendo só papel (por decisão sua, e mantida), isso vira um botão rápido tipo "hoje percebi um insight importante nas minhas páginas", sem reproduzir o conteúdo.

---

## 17. Estrutural / específico de plataforma

### ⭐ Contrato Inicial assinável
O livro abre com um contrato de comprometimento (12 semanas, Morning Pages diário, Artist Date semanal, autocuidado). Uma tela na onboarding, com uma confirmação tipo assinatura, cria uma "página de rosto" simbólica pra jornada — simples de implementar em qualquer plataforma, só HTML e um input de texto pro nome.

### ⭐ Selo por semana concluída
Um "carimbo" colecionável na tela da Jornada, no mesmo espírito visual bagunçado/caderno que o app já tem — puramente CSS, sem nenhuma dependência nova.

### ⭐ Modo manutenção pós-programa
Depois da Semana 12, um modo mais simples: só Morning Pages + Artist Date rodando indefinidamente, sem mais checklist nem check-in semanal — pra quem terminar e quiser manter o hábito sem a estrutura do curso.

### Dia de graça
Poder marcar o dia anterior retroativamente se esqueceu de abrir o app, sem quebrar a sequência por puro esquecimento — pequeno ajuste de lógica, sem UI nova.

### Exportar como imagem
Life Pie, Mapa do Ciúme etc. virando uma imagem via canvas, pra guardar ou imprimir — funciona em navegador moderno e também em WebView antiga, já que canvas.toDataURL() é suportado desde sempre.

### Cartão de progresso pra imprimir
Resumo visual da jornada em formato exportável — baixa prioridade, mais um "nice to have" de fechamento.

### Exportar check-ins em PDF
Mais pesado de implementar (geração de PDF no cliente) e questionável se vale o esforço frente ao "exportar como imagem" acima, que é bem mais simples.

### Live Tile (Windows Phone)
Um quadrado fixável na tela inicial do Lumia mostrando a sequência atual de Morning Pages, sem abrir o app — depende de APIs específicas de UWP (`Windows.UI.Notifications.TileUpdateManager`), então só funciona na versão do Windows Mobile, não no PWA. Tecnicamente viável dentro do projeto UWP que já existe, mas é trabalho extra específico de uma única plataforma.

### Tamanho de fonte ajustável / alto contraste
Duas variáveis CSS a mais e um seletor em Ajustes — tela pequena do Lumia agradece, especialmente pra ler os ensaios das semanas.

### Retomar de onde parou
Tela de boas-vindas se ficar muito tempo sem abrir o app, evitando a sensação de "fracasso" por ver a semana calculada muito à frente de onde você realmente está.

---

## As 30 selecionadas, resumidas numa lista só

1. Regras da Estrada (cartão fixo)
2. Princípios Básicos (cartão fixo)
3. Tabela Crença Negativa → Positiva (cartão fixo)
4. Banco de Afirmações + sorteio diário na Home
5. Life Pie (gráfico de radar interativo)
6. Mapa do Ciúme
7. Círculo de Segurança
8. Vidas Imaginárias (lista permanente e crescente)
9. 20 Coisas que Gosto de Fazer (lista permanente)
10. Carta de você aos 80 anos (salva)
11. Carta de você aos 8 anos (salva)
12. Oração do Artista (salva e relida)
13. Carta de encorajamento à criança-artista (salva)
14. Diário de Sincronicidade
15. Registro do Poço Criativo
16. Diário de Resistência
17. Busca de Metas / Norte Verdadeiro
18. Plano em 6 Horizontes
19. Busca de Estilo
20. Dia Ideal
21. Dia Ideal Ideal
22. Arqueologia (parte 1 e 2)
23. Histórico de Artist Dates
24. Reler check-ins antigos
25. Contador de dias
26. Resentimentos, Medos e Ganho Oculto
27. Quiz do Vício em Trabalho
28. Caderno de Desejos (7 áreas)
29. Registro de Retornos em U
30. Plano de continuidade (fim do programa)

Mais os 5 estruturais que sustentam essas 30: Totem do Artista, Bottom Line, Pontos de Referência de Felicidade, Contrato Inicial, Selo por semana, Modo manutenção pós-programa.

---

## Próximo passo sugerido

Essas 30 dão pra um bom próximo ciclo de desenvolvimento, mas ainda é bastante coisa de uma vez. Se quiser, posso quebrar isso em 3-4 levas menores (por exemplo: primeiro as referências fixas + listas permanentes, que são as mais simples tecnicamente; depois os formulários estruturados da Semana 8 e 11; por último os diários contínuos e o histórico) — assim dá pra testar e subir pro GitHub em partes, em vez de um único salto grande.
