// data.js — Conteúdo do programa de 12 semanas
// Todo o texto aqui é uma reescrita/paráfrase original inspirada na estrutura
// de "The Artist's Way" (Julia Cameron) e materiais complementares (Toolkit,
// Workbook, Artist's Date Book) — não é cópia literal do livro.
//
// Cada item do checklist tem:
//   task   — a ação em si, curta e direta
//   detail — uma "nota de margem": explica o porquê da tarefa, em outras
//            palavras, pra ajudar a lembrar o sentido dela mesmo tempos
//            depois de ler o capítulo.

const BASIC_TOOLS = {
  morningPages: {
    name: "Morning Pages",
    tagline: "3 páginas escritas à mão, todo santo dia, assim que acordar.",
    description:
      "Três páginas de fluxo de consciência, escritas à mão, logo ao acordar — antes do café, do celular, de qualquer coisa. Não é 'literatura', não se relê, não se mostra a ninguém. É uma faxina mental diária: tudo o que está entupindo sua cabeça sai no papel para abrir espaço para a voz criativa por trás do barulho.",
  },
  artistDate: {
    name: "Artist Date",
    tagline: "Um encontro solo, semanal, só para encher o poço criativo.",
    description:
      "Um bloco de tempo sozinho(a), uma vez por semana, para alimentar sua criança-artista interior — sem produtividade, sem outra pessoa junto, sem culpa. Pode ser bobo, pequeno, sensorial. O objetivo não é produzir nada: é reabastecer o poço de onde a criatividade bebe.",
  },
};

// Regras da Estrada — resumo prático de "como ser artista" que fecha a
// Semana 2 do livro. Reescritas em paráfrase própria, não copiadas do livro.
const ROAD_RULES = [
  "Apareça na página. As Morning Pages não são só desabafo — são também onde você descansa, sonha e testa ideias sem compromisso.",
  "Cuide de quem cria em você. Encher o poço criativo (Artist Date, atenção sensorial, descanso de verdade) não é luxo opcional — é manutenção básica.",
  "Estabeleça metas pequenas e cumpra. Grandes saltos assustam e travam; passos pequenos e constantes sustentam.",
  "Peça ajuda a algo maior que você. Não precisa ser religioso no sentido tradicional — é sobre pedir orientação, coragem e humildade em vez de tentar controlar tudo sozinho.",
  "Lembre que ficar bloqueado dói mais que trabalhar. A dor de não criar é real, só que costuma ser invisível — inclusive pra você mesmo.",
  "Fique de olho nos sinais de apoio ao seu redor. Sincronicidade, ajuda inesperada, portas que se abrem — não descarte como coincidência.",
  "Escolha companhia que te puxa pra frente. Não quem só fala sobre fazer, ou sobre por que não está fazendo.",
  "Lembre que criar é bem-vindo, não tolerado. A criatividade não é uma indulgência que precisa ser justificada.",
  "Seu trabalho é fazer, não julgar. Avaliar o resultado é tarefa de outro momento — na hora de criar, o único trabalho é aparecer e continuar.",
  "Divida a responsabilidade. Quantidade é sua parte (mostrar-se, repetir, insistir); qualidade não precisa ser inteiramente controlada por você.",
];

// Tabela Crença Negativa → Alternativa Positiva — contraponto rápido aos
// clichês sobre "ser artista" que aparecem na Semana 1. Reescrita em
// paráfrase própria, não copiada do livro.
const BELIEF_TABLE = [
  { negative: "Bêbado(a)", positive: "Sóbrio(a)" },
  { negative: "Louco(a)", positive: "São(sã)" },
  { negative: "Sempre duro(a) na grana", positive: "Solvente" },
  { negative: "Egoísta", positive: "Gentil consigo mesmo(a)" },
  { negative: "Irresponsável", positive: "Comprometido(a) com o processo" },
  { negative: "Sofredor(a) por natureza", positive: "Merecedor(a) de alegria" },
  { negative: "Amador(a), nunca profissional de verdade", positive: "Em formação — como todo mundo já foi" },
  { negative: "Preguiçoso(a)", positive: "Trabalhando no seu próprio ritmo" },
  { negative: "Instável", positive: "Em processo, não em crise" },
  { negative: "Sozinho(a) no mundo", positive: "Parte de uma comunidade criativa" },
];

// Banco de Afirmações — frases prontas pra usar quando não se sabe o que
// afirmar ao final das Morning Pages, ou pra aparecer sozinha na Home.
// Conteúdo original, redigido no mesmo espírito de paráfrase própria do
// resto deste arquivo.
const AFFIRMATIONS = [
  "Minha criatividade sempre me leva à verdade e ao amor.",
  "É seguro para mim ser criativamente prolífico(a).",
  "Meu talento cresce de acordo com o quanto o uso.",
  "Deus/o universo não faz nada em vão — inclusive meus impulsos criativos.",
  "Eu sou um canal para a criatividade, e essa criatividade flui através de mim.",
  "Minhas ambições vêm de uma fonte divina, e ela conhece caminhos que eu ainda não vejo.",
  "Quanto mais eu crio, mais energia eu tenho.",
  "Minha criatividade cura a mim e a outras pessoas.",
  "Eu sou merecedor(a) do meu tempo, atenção e cuidado criativo.",
  "Está tudo bem em fazer algo pequeno e imperfeito hoje.",
  "Aparecer na página já é o trabalho — o resto é consequência.",
  "Minha voz importa, mesmo (principalmente) enquanto ainda está se formando.",
  "Eu confio no processo mais do que no resultado.",
  "Ninguém mais pode fazer o que eu faço do meu jeito.",
  "Descansar também é parte do trabalho criativo.",
  "Sou livre para experimentar sem precisar acertar de primeira.",
  "Minha criança-artista merece proteção e encorajamento.",
  "Cada Morning Page é um passo, não um exame.",
  "Eu posso pedir ajuda a algo maior que eu quando travar.",
  "É seguro querer mais do que eu tenho hoje.",
];

// Princípios Básicos — a base filosófica que abre o livro (também citada na
// Semana 2, pra ser relida em voz alta). Conteúdo original, redigido no
// mesmo espírito de paráfrase própria do resto deste arquivo.
const BASIC_PRINCIPLES = [
  "Criatividade é a ordem natural da vida. Toda forma de vida se expressa e cresce — a sua não é diferente.",
  "Existe uma força criativa subjacente ao universo (chame como quiser: fé, natureza, energia) e essa força quer se expressar através de você tanto quanto através de qualquer outra pessoa.",
  "Recusar-se a explorar seus talentos criativos vai contra sua própria natureza — não é humildade, é resistência desnecessária a quem você já é.",
  "Quando você abre um canal pra criatividade, sua vida inteira tende a melhorar, não só a parte 'artística' dela.",
  "É seguro abrir os canais de criatividade que existem dentro de você.",
  "Nossa criatividade cresce em direção a algo maior, mesmo quando o caminho parece incerto ou lento demais.",
  "É próprio da natureza humana ser criativo em algum grau — não é traço reservado a poucos escolhidos.",
  "Quando exploramos nossa criatividade, nos conectamos com nossa própria energia interior — e essa energia é generosa, não escassa.",
  "Nossa criatividade sempre nos leva, no fim, à verdade e ao autoconhecimento, mesmo quando o processo parece confuso no meio do caminho.",
  "Nunca é tarde demais, ou cedo demais, pra explorar sua criatividade — o único momento disponível pra começar é sempre agora.",
];

const CHECKIN_CORE_QUESTIONS = [
  "Quantos dias você fez as Morning Pages essa semana? Como foi a experiência?",
  "Você fez seu Artist Date essa semana? O que fez e como se sentiu?",
  "Surgiu algum outro assunto importante para sua recuperação criativa essa semana?",
];

const WEEKS = [
  {
    id: 1,
    title: "Recuperando um Senso de Segurança",
    intro:
      "A primeira semana é sobre reconstruir a sensação de que é seguro criar — encarando os antigos 'vilões' e 'campeões' da sua autoestima criativa.",
    essay: [
      "Julia Cameron parte de uma ideia que contraria quase tudo que a gente aprende sobre talento: criatividade não é um dom raro reservado a poucos — é a condição natural de qualquer pessoa viva, tão automática quanto respirar. Ninguém se pergunta se 'tem o dom' de respirar. Se isso for verdade, então o problema nunca foi falta de talento: foi bloqueio. E bloqueio, ao contrário de talento, dá pra destravar.",
      "Uma das primeiras coisas que costumam travar esse processo é o que o livro chama de Artista Sombra: alguém com sensibilidade criativa genuína, mas que nunca recebeu apoio suficiente pra reconhecer isso em si mesmo, e que acaba orbitando ao redor da arte de outra pessoa — o crítico que secretamente sonhava em dirigir, o 'maior fã' que tinha o mesmo sonho e nunca admitiu. Não é falha de caráter: é o resultado de uma infância em que ninguém disse 'tenta e vê no que dá' pra aquele impulso criativo específico.",
      "Outro conceito central da semana são as Crenças Centrais Negativas — frases que a gente carrega como se fossem fatos sobre si mesmo ('artista não ganha dinheiro', 'eu não sei nem escrever direito'), quase sempre herdadas de pais, professores ou da cultura em geral, e raramente examinadas de perto. Enquanto ficam soltas no fundo da cabeça, elas funcionam como verdade absoluta. Escritas no papel, à luz do dia, a maioria revela rapidamente que nunca foi um fato — sempre foi só uma crença.",
      "As afirmações entram como contrapeso, mas o mais interessante do exercício não é a frase positiva em si — é o que o livro chama de blurts: os contra-ataques automáticos que a mente solta assim que você tenta afirmar algo bom sobre sua própria criatividade. Se você escrever 'eu tenho talento real' dez vezes seguidas, é quase garantido que uma vozinha interna vai rebater com algo do tipo 'quem você pensa que é'. Esses blurts não são ruído aleatório: são pistas diretas pra suas crenças negativas mais entrincheiradas. Anotá-los é, na prática, um mapa às avessas — cada blurt ruim marca exatamente onde cavar.",
    ],
    checklist: [
      { task: "Comece as Morning Pages: 3 páginas à mão, toda manhã, sem reler.",
        detail: "É a ferramenta-base de todo o processo — tudo o mais no livro parte daqui. Não precisa fazer sentido nem ser bonito: o valor está em escrever antes que o crítico interno acorde." },
      { task: "Escolha 2–3 afirmações e repita-as ao final das páginas de cada dia.",
        detail: "Afirmações são frases curtas, no presente, como se já fossem verdade ('eu sou capaz de usar meu talento criativo'). A ideia é substituir aos poucos as crenças negativas por outras mais gentis, repetição por repetição." },
      { task: "Liste três antigos 'vilões' da sua autoconfiança criativa (professores, críticos, vozes internalizadas).",
        detail: "O livro chama isso de 'crenças negativas centrais': frases que alguém disse um dia e que você carrega até hoje como se fossem fatos. Nomear o vilão tira o poder dele de agir escondido." },
      { task: "Escreva em detalhe sobre um desses episódios — o que aconteceu, como você se sentiu.",
        detail: "Reviver o episódio com detalhes sensoriais (o lugar, a fala, a sensação no corpo) ajuda a processar a mágoa como algo que já passou, em vez de uma ferida ainda aberta e reativa." },
      { task: "Escreva uma carta 'em sua defesa' na voz da sua criança-artista ferida.",
        detail: "Escrever na primeira pessoa, como a criança que você foi, costuma soltar uma raiva ou tristeza que a versão adulta racionaliza demais para sentir de verdade." },
      { task: "Liste três 'campeões' que apoiaram sua criatividade e escreva um agradecimento a um deles.",
        detail: "Contrabalança o exercício anterior: também existiram vozes que acreditaram em você. Reconhecê-las por escrito reforça que apoio real já existiu — e pode existir de novo." },
      { task: "Liste 5 vidas imaginárias que você gostaria de ter vivido; escolha uma e faça algo dela essa semana.",
        detail: "As 'vidas imaginárias' revelam desejos que você talvez tenha engavetado (ex.: 'seria astrônomo'). A ideia não é mudar de carreira, mas roubar um pedacinho real dessa vida — uma aula, uma visita, uma leitura." },
      { task: "Faça seu primeiro Artist Date da jornada, sozinho(a).",
        detail: "É a primeira das 12 saídas solo do programa. Não precisa ser grande: o objetivo é só provar pra si mesmo(a) que dá pra fazer algo só por prazer, sem culpa." },
      { task: "Leve seu artista interior para uma caminhada de 20 minutos.",
        detail: "Caminhar (sem fone, sem celular) é uma das formas mais simples de driblar o pensamento racional e deixar a mente associar ideias livremente — muitas soluções criativas aparecem assim." },
    ],
    checkinBonus: "O que essa semana te lembrou sobre o que você precisa para se sentir seguro(a) ao criar?",
  },
  {
    id: 2,
    title: "Recuperando um Senso de Identidade",
    intro:
      "Semana para separar o que você realmente quer fazer do que acha que 'deveria' fazer — e mapear quem apoia (ou sabota) essa busca.",
    essay: [
      "Uma coisa que quase ninguém avisa sobre recuperação criativa: no começo, ficar mais são costuma parecer, por dentro, muito com ficar mais louco. À medida que você ganha força, os ataques de autodúvida também ficam mais fortes — 'ok, fiz as páginas essa semana, mas provavelmente fiz errado', 'preciso planejar algo grande agora, rápido'. Esses ataques são normais e não significam recaída: são sintoma de que algo está de fato se movendo.",
      "Um risco real nessa fase é o que o livro chama de amizades venenosas: pessoas ainda bloqueadas na própria criatividade, para quem a sua recuperação é ameaçadora — mesmo sem intenção consciente de sabotar. É esperar sabotagem de um amigo de bar assim que você para de beber: como ele vai comemorar algo que evidencia o que ele mesmo evita encarar? Fique atento a comentários bem-intencionados que sugerem que você 'mudou' ou está sendo 'egoísta' — geralmente é uma tentativa (nem sempre consciente) de te puxar de volta pro lugar antigo, por conforto de quem fala, não seu.",
      "Uma versão mais extrema disso são os Crazymakers: pessoas carismáticas, imprevisíveis, que vivem criando pequenas crises e drenando a energia de todo mundo ao redor — quebram combinados, quebram agenda, terceirizam problemas próprios pra cima de você bem na hora em que você mais precisa de foco. Reconhecer esse padrão (às vezes num chefe, às vezes num parente, às vezes num parceiro) já é meio caminho andado pra proteger seu tempo criativo dele.",
      "Por fim, existe o que o livro chama de ceticismo secreto: aquela vozinha que aceita fazer os exercícios, mas por dentro pensa 'ah, isso é só coincidência, não tem nada a ver'. Essa dúvida não precisa ser resolvida — só precisa ser reconhecida em vez de abafada, porque é justamente o abafamento dela que a deixa poderosa. Uma boa contramedida, meio óbvia mas eficaz: prestar atenção de verdade nas coisas pequenas do seu dia — como fazia a avó da autora, que escrevia cartas inteiras só sobre as flores que estavam desabrochando. Atenção aos detalhes pequenos é, segundo o livro, uma das formas mais confiáveis de sanidade que existem.",
    ],
    checklist: [
      { task: "Leia os Princípios Básicos em voz alta, de manhã e à noite.",
        detail: "São as ideias centrais que sustentam o programa (ex.: a criatividade é um recurso espiritual, não um talento raro reservado a poucos). Repetir em voz alta ajuda a internalizar aos poucos, mesmo sem concordar 100% de cara." },
      { task: "Liste as 5 atividades que mais tomaram seu tempo essa semana e quanto foi 'quero' vs. 'deveria'.",
        detail: "Esse exercício expõe o quanto da sua energia vai para obrigações herdadas de outras pessoas, sem que você tenha escolhido isso conscientemente." },
      { task: "Desenhe um mapa de segurança: quem apoia sua criatividade agora e de quem você precisa se proteger por um tempo.",
        detail: "Não é sobre cortar pessoas para sempre — é sobre reconhecer que, num momento frágil de recomeço criativo, algumas conversas fazem mais mal que bem por ora." },
      { task: "Liste 20 coisas que você gosta de fazer, com a data da última vez que fez cada uma.",
        detail: "É comum a lista mostrar prazeres simples abandonados há anos. Essa lista também vira um banco de ideias prontas para os futuros Artist Dates." },
      { task: "Escolha duas dessas coisas 'esquecidas' como metas para essa semana.",
        detail: "Sair da lista para a ação — o objetivo é pequeno e concreto, não uma reforma de vida inteira." },
      { task: "Volte às afirmações da Semana 1 e note quais ainda incomodam — geralmente são as mais importantes.",
        detail: "Quando uma afirmação positiva causa desconforto ou ceticismo forte, costuma ser sinal de que ela tocou numa crença negativa bem entrincheirada." },
      { task: "Adicione mais 5 vidas imaginárias à sua lista da semana passada.",
        detail: "Quanto mais vidas você lista, mais claro fica um padrão do que realmente te atrai (aventura? cuidado? risco? arte?)." },
      { task: "Desenhe seu 'Life Pie': divida um círculo em fatias (espiritualidade, exercício, lazer, trabalho, amigos, romance) e marque o quanto está satisfeito em cada uma.",
        detail: "É um raio-x visual e rápido de onde sua vida está desequilibrada. A ideia é revisitar esse mesmo desenho mais adiante no programa e comparar." },
      { task: "Liste 10 pequenas mudanças que gostaria de fazer e execute uma delas.",
        detail: "Mudanças pequenas e realizáveis (trocar o lençol, pintar uma parede) costumam destravar a sensação de estagnação mais rápido do que decisões grandes." },
    ],
    checkinBonus: "Que 'deveria' você conseguiu trocar por um 'eu quero de verdade' essa semana?",
  },
  {
    id: 3,
    title: "Recuperando um Senso de Poder",
    intro:
      "Reconectar com a energia e os instintos da infância — e reconhecer hábitos e amizades que drenam (ou nutrem) sua força criativa.",
    essay: [
      "Um dos pontos mais úteis dessa semana é uma reformulação simples: raiva não é o problema, raiva é informação. A gente aprende a engolir, disfarçar ou medicar a raiva porque foi criado pra ser 'gente boa' — mas ela é, na verdade, um mapa: mostra exatamente onde estão seus limites e pra onde você quer ir. 'Eu poderia fazer um filme melhor que esse' não é só inveja — é a raiva apontando um caminho: você quer fazer filmes, e precisa aprender como. O erro não é sentir raiva, é agir a partir dela sem parar pra ler o mapa que ela está desenhando.",
      "Esse também costuma ser o momento em que a sincronicidade começa a aparecer com mais frequência — aquela sensação estranha de que, assim que você se compromete de verdade com um desejo criativo, o mundo começa a colaborar: você comenta que sempre quis atuar e, na semana seguinte, senta ao lado de um professor de teatro. A explicação não é sobrenatural — é sobre atenção. Antes de decidir perseguir algo, você simplesmente não repara nas oportunidades relacionadas; no momento em que se compromete, o filtro de atenção muda, e o que antes passava despercebido salta aos olhos.",
      "O livro também nomeia algo que costuma travar gente muito talentosa: a vergonha. Fazer arte pode parecer, por dentro, com contar um segredo de família — e expor algo assim sempre carrega a pergunta 'o que vão pensar de mim quando souberem disso?'. Quando uma crítica dura acerta o alvo com justiça, o efeito costuma ser um 'ahá' útil. Mas existe outro tipo de crítica — vaga, desdenhosa, do tipo 'como você ousa?' — que não ensina nada, só envergonha, e é exatamente esse tipo que costuma travar um artista por anos. Reconhecer a diferença entre as duas é uma proteção real: nem toda crítica precisa ser ouvida, e nem todo crítico merece acesso ao seu trabalho ainda cru.",
    ],
    checklist: [
      { task: "Descreva seu quarto de infância e o que você mais gostava nele; traga um pouco desse espírito para seu espaço atual.",
        detail: "A memória sensorial de um espaço que já foi seu costuma indicar cores, texturas ou objetos que ainda te fazem bem hoje." },
      { task: "Liste 5 traços que você gostava em si mesmo quando criança.",
        detail: "Antes das expectativas adultas, você já tinha uma personalidade própria. Esse exercício resgata traços que talvez você tenha 'domesticado' demais." },
      { task: "Liste 5 conquistas e 5 comidas favoritas da infância — presenteie-se com uma delas essa semana.",
        detail: "Pequenos prazeres nostálgicos reconectam com uma versão mais leve e menos crítica de você mesmo." },
      { task: "Identifique 3 hábitos autodestrutivos óbvios e 3 mais sutis; anote o 'ganho' de mantê-los.",
        detail: "Todo hábito que sabota tem um 'ganho' escondido (evitar risco, evitar julgamento, evitar esforço). Nomear esse ganho é o primeiro passo pra soltar o hábito sem culpa." },
      { task: "Liste amigos que realmente te nutrem (vs. os que te fazem sentir incapaz).",
        detail: "O livro diferencia 'nutrir' de 'ajudar demais': nutrir é reforçar sua capacidade; ajudar demais pode, sem querer, reforçar a mensagem de que você não daria conta sozinho(a)." },
      { task: "Ligue para alguém que acredita em você e na sua capacidade de realizar coisas.",
        detail: "Buscar apoio ativamente é parte da recuperação — não é sinal de fraqueza precisar ouvir isso de alguém de fora." },
      { task: "Reserve uma hora para uma atividade 'cérebro de artista' (caminhar, pintar, dirigir, esfregar a casa) e preste atenção ao que emerge.",
        detail: "São atividades repetitivas e manuais que ocupam o lado racional da mente e liberam o lado intuitivo — muita gente tem seus melhores insights lavando louça ou dirigindo." },
      { task: "Liste 5 pessoas que você admira abertamente e 5 que admira em segredo; compare os traços.",
        detail: "Admirações 'secretas' (as que você meio que esconde) costumam apontar para desejos que você julga bobos demais para admitir." },
    ],
    checkinBonus: "Que fonte de energia ou poder pessoal você redescobriu essa semana?",
  },
  {
    id: 4,
    title: "Recuperando um Senso de Integridade",
    intro:
      "Semana de honestidade com quem você foi, é e quer ser — inclui considerar uma pausa de leitura para dar mais espaço à sua própria voz.",
    essay: [
      "O exercício mais estranho — e mais eficaz, segundo quem já tentou — dessa semana é o jejum de leitura: uma semana inteira sem ler nada além do estritamente necessário. Nada de livro, jornal, feed, notícia. A reação inicial de quase todo mundo é raiva ou desdém ('sou ocupado demais pra isso'), o que já é, em si, um sinal de o quanto essa entrada de palavras alheias virou hábito automático — quase um tranquilizante de tão constante.",
      "A lógica por trás disso é simples: se você está o tempo todo consumindo palavras e imagens de outras pessoas, sobra pouquíssimo espaço interno pra ouvir as suas próprias. Palavras de outros artistas, notícias, opiniões de comentaristas — tudo isso funciona como um ruído de fundo que abafa exatamente a voz mais baixinha, a que sussurra suas próprias ideias. Cortar esse fluxo por alguns dias força um vazio, e esse vazio tende a se preencher rapidinho com impulso criativo genuíno: você acaba pintando uma prateleira, reorganizando uma gaveta, ou simplesmente ficando inquieto o suficiente pra sentar e criar algo, porque não tem mais pra onde fugir.",
      "A semana também pede um tipo de honestidade mais ampla: revisitar quem você era antes de aprender a se policiar (a carta de você aos 8 anos) e imaginar quem você pode se tornar dali a décadas, com todo o tempo do mundo (a carta de você aos 80). As duas cartas juntas costumam expor, com bastante clareza, o quanto do 'bom senso' adulto que rege o seu dia a dia é herdado — e o quanto dele realmente serve a você.",
      "Se o jejum de leitura parecer radical demais nessa primeira tentativa, tudo bem: a própria autora reconhece que é o exercício que mais gera resistência do livro inteiro, e que quem mais resiste costuma ser quem mais se beneficia quando enfim tenta.",
    ],
    checklist: [
      { task: "Descreva seu ambiente ideal e cole/desenhe uma imagem dele perto de onde você trabalha.",
        detail: "Ter uma referência visual do ambiente dos sonhos ajuda a reconhecer, e buscar, pedacinhos dele na vida real, mesmo antes de conseguir tudo de uma vez." },
      { task: "Escreva uma carta de você aos 80 anos para você hoje.",
        detail: "Escrever do futuro traz uma perspectiva mais generosa e menos urgente — o 'eu' de 80 anos raramente se importa com os medos pequenos de hoje." },
      { task: "Escreva uma carta de você aos 8 anos para você hoje.",
        detail: "O oposto do exercício anterior: a criança de 8 anos costuma lembrar o que você amava antes de aprender a se policiar." },
      { task: "Veja se há um canto da casa que possa virar seu espaço criativo secreto.",
        detail: "Não precisa ser um escritório — mesmo um cantinho pequeno, só seu, sinaliza pro cérebro que a criatividade merece um lugar físico na sua vida." },
      { task: "Revise o 'Life Pie' da Semana 2 — o que já mudou de forma?",
        detail: "Comparar o mesmo desenho em momentos diferentes mostra progresso que, no dia a dia, é fácil não perceber." },
      { task: "Escreva sua própria Oração do Artista e use-a todos os dias dessa semana.",
        detail: "Não precisa ser religiosa no sentido tradicional — é mais uma declaração de intenção e entrega, tipo 'não preciso controlar como vai ficar, só preciso aparecer e tentar'." },
      { task: "Planeje um Artist Date estendido (um dia ou fim de semana só seu).",
        detail: "Uma versão ampliada do encontro semanal — útil pra sentir o que muda quando você se dá tempo de verdade, não só uma horinha." },
      { task: "Doe uma peça de roupa que te faz sentir mal consigo mesmo(a).",
        detail: "Um gesto físico pequeno de 'soltar' algo carregado de autocrítica — o livro trata isso como parte do mesmo processo de honestidade emocional." },
      { task: "Considere uma semana de 'jejum de leitura' (sem livros, TV ou redes por alguns dias) — se topar, registre como foi.",
        detail: "A ideia por trás é ousada: paramos de consumir a criatividade dos outros só um pouco, pra dar espaço pra nossa própria voz aparecer sem comparação constante. É opcional e pode ser desconfortável — vale registrar a reação, mesmo que seja resistência." },
    ],
    checkinBonus: "Você notou alguma sincronicidade essa semana? Qual foi?",
  },
  {
    id: 5,
    title: "Recuperando um Senso de Possibilidade",
    intro:
      "Semana para encarar as queixas sobre um universo que não apoia — e começar a colecionar imagens do que você secretamente deseja.",
    essay: [
      "O livro propõe uma imagem provocadora: pense na fonte da sua criatividade como uma conta bancária sem limite — só que você mesmo, sem perceber, decide o quanto pode sacar dela. A maioria das pessoas bloqueadas é avarenta consigo mesma por puro medo de 'gastar demais' uma sorte ou um talento que parecem finitos. O convite da semana é simples de descrever e difícil de praticar: parar de racionar desejos antes mesmo de examiná-los.",
      "Uma armadilha específica que costuma pegar gente disciplinada e responsável é o que o livro chama de armadilha da virtude: a ideia de que trabalho duro, responsabilidade e produtividade constante são sempre admiráveis — quando, na prática, viram desculpa socialmente aceitável pra nunca arriscar nada criativamente novo. Recusar tempo de descanso genuíno não é dedicação, é medo disfarçado de virtude. Um artista precisa de tempo livre de verdade, sem agenda, sem culpa — e defender esse tempo costuma parecer, pra quem está por perto, uma retirada egoísta. Em certo sentido, é mesmo: e está tudo bem que seja.",
      "A segunda metade da semana é sobre deixar a correnteza te levar em vez de nadar contra ela o tempo todo. Conforme as Morning Pages vão amaciando opiniões rígidas e visões de curto prazo, é comum notar uma espécie de corrente nova na própria vida — decisões que antes pareciam impossíveis começam a parecer só 'talvez'. Trocar 'de jeito nenhum' por 'talvez' já é, por si só, abrir a porta pra mistério e sorte.",
      "O arquivo de imagens que o app te pede pra montar essa semana existe justamente pra dar forma visual a desejos que normalmente ficam vagos demais pra virar ação. Ver o desejo em imagem — não só nomeado em palavra — ativa uma atenção diferente: de repente você começa a notar, no mundo real, coisas relacionadas ao que colou na parede.",
    ],
    checklist: [
      { task: "Liste 5 razões pelas quais é difícil confiar num universo/força apoiadora.",
        detail: "Nomear as queixas tira elas do modo 'ruído de fundo' e coloca em cima da mesa pra serem realmente examinadas." },
      { task: "Comece um 'arquivo de imagens': recorte ou salve imagens dos seus 5 maiores desejos.",
        detail: "Ver o desejo em imagem (não só em palavra) ativa uma parte diferente do cérebro — muita gente relata que coisas do arquivo de imagens acabam, de fato, acontecendo." },
      { task: "Revise sua lista de vidas imaginárias — mudou algo? Adicione imagens dela ao arquivo.",
        detail: "Ver se as vidas imaginárias mudam ao longo das semanas é um termômetro de como sua noção de possibilidade está se abrindo." },
      { task: "Liste 5 aventuras que faria se tivesse 20 anos e dinheiro sobrando.",
        detail: "Remover a barreira da idade da equação separa o desejo real da desculpa de 'já passou da hora'." },
      { task: "Liste 5 prazeres que você tem adiado e faria se tivesse 65 anos e dinheiro sobrando.",
        detail: "Faz o oposto do anterior: descobre o que você está guardando 'pra quando for mais velho' sem motivo real pra esperar." },
      { task: "Liste 10 formas pelas quais você é duro(a) demais consigo mesmo(a).",
        detail: "Tornar a autocrítica explícita, item por item, ajuda a perceber o quanto dela é automática e nem sempre justa." },
      { task: "Liste 10 coisas que gostaria de ter e não tem.",
        detail: "Uma lista simples de desejos materiais também é uma ferramenta — o próprio livro comenta que só de visualizar já muda o tanto que você presta atenção em oportunidades relacionadas." },
      { task: "Descreva (em palavras ou desenho) qual é o seu bloqueio criativo favorito.",
        detail: "Todo mundo tem um 'bloqueio de estimação' (TV, trabalho excessivo, cuidar demais dos outros). Reconhecer o seu com humor tira um pouco do peso dele." },
      { task: "Escreva: qual é o 'ganho' de continuar bloqueado(a)? Quem você culpa por isso?",
        detail: "Ficar bloqueado também tem função (evita o risco de tentar e falhar). Ver isso com clareza é mais produtivo do que só se culpar por procrastinar." },
    ],
    checkinBonus: "Que novo desejo ou possibilidade você deixou aparecer essa semana, mesmo sem saber como realizá-lo ainda?",
  },
  {
    id: 6,
    title: "Recuperando um Senso de Abundância",
    intro:
      "Semana sobre riqueza que não é dinheiro — pequenos prazeres, cores favoritas e permissão para receber coisas boas de graça.",
    essay: [
      "Existe um padrão que o livro chama de anorexia artística: alguém que sente fome de criar, mas se recusa sistematicamente a alimentar essa fome, ficando cada vez mais focado na própria privação. A cura proposta não tem nada a ver com dinheiro — tem a ver com pequenos luxos autênticos, escolhidos com atenção. Uma dúzia de framboesas frescas, um vaso de flor na mesinha de cabeceira, uma xícara de segunda mão só sua: o valor não está no preço, está na permissão que você se dá de considerar aquilo merecido.",
      "A culpa mais comum é achar que falta de dinheiro é o verdadeiro bloqueio. Quase nunca é. O bloqueio real costuma ser uma sensação de constrição, de impotência — a crença de que você não tem direito de escolher nada bom pra si mesmo agora, só depois, só quando 'merecer' mais. Isso vale até pra gente já bem-sucedida: o livro conta o caso de um artista mundialmente reconhecido que, apesar de rico e premiado, havia se negado havia anos qualquer luxo de tempo — tempo com amigos, tempo sem agenda — e por isso seu próprio trabalho, que já foi fonte de alegria, tinha virado só mais uma obrigação pesada.",
      "Uma forma prática de destravar isso é reservar, toda semana, um espaço mínimo que seja inegavelmente seu: uma prateleira, uma caneca, uma poltrona. Sua criança-artista interior gosta de coisas marcadas como 'minhas' — é assim que ela aprende, aos poucos, que também merece cuidado. Dizer sim a esses gestos pequenos e gratuitos que a vida oferece de vez em quando é, literalmente, treino: destrava o reflexo automático de recusar qualquer coisa boa por puro hábito de menosprezo próprio.",
      "A lógica por trás de toda a semana é que abundância começa como uma mudança de percepção antes de ser uma mudança de circunstância. Quem aprende a notar e aceitar fartura em coisas pequenas — uma flor, uma sopa, um cheiro bom em casa — cria justamente a abertura pela qual fartura maior tende a entrar depois.",
    ],
    checklist: [
      { task: "Encontre e carregue com você 5 pedrinhas ou objetos naturais interessantes.",
        detail: "Um lembrete físico e bobo, no bolso, de que a beleza gratuita está por toda parte — parece simples demais, mas funciona como uma âncora sensorial." },
      { task: "Colete 5 flores ou folhas e prense-as.",
        detail: "Outro pequeno ritual de atenção à natureza — o ponto não é o resultado, é o hábito de reparar em coisas bonitas e de graça." },
      { task: "Doe ou jogue fora 5 peças de roupa gastas que não te representam mais.",
        detail: "Abrir espaço físico costuma abrir espaço mental — é uma forma concreta de dizer 'eu mereço coisas que combinam com quem eu sou agora'." },
      { task: "Cozinhe algo simples como ato criativo (não precisa ser 'arte').",
        detail: "O livro insiste bastante nisso: criatividade não é só 'arte com A maiúsculo'. Cozinhar, arrumar uma prateleira, plantar — tudo conta como exercício criativo." },
      { task: "Mande postais ou mensagens para 5 pessoas que você adoraria ouvir de volta.",
        detail: "Um gesto de conexão sem segunda intenção — parte do 'músculo' de dar e receber afeto sem cálculo." },
      { task: "Liste seus 'favoritos' em categorias livres: cores, comidas, bandas, cheiros, lugares.",
        detail: "Parece bobo, mas listar favoritos com atenção reafirma sua identidade pessoal — o oposto de viver no piloto automático." },
      { task: "Releia os Princípios Básicos e sua Oração do Artista uma vez por dia.",
        detail: "Repetição espaçada: essas ideias tendem a fazer mais sentido na quinta ou sexta vez que na primeira." },
      { task: "Faça pelo menos uma pequena mudança no seu ambiente doméstico.",
        detail: "Reforça a ideia de que seu espaço físico pode (e deve) refletir sua fase criativa atual, não ficar congelado no tempo." },
      { task: "Pratique dizer 'sim' a algo bom e gratuito que te oferecerem essa semana.",
        detail: "Muita gente bloqueada tem o reflexo de recusar coisas boas por instinto ('ah, não precisa'). Esse exercício é treinar o músculo de aceitar." },
    ],
    checkinBonus: "Onde você sentiu abundância essa semana — não necessariamente em dinheiro?",
  },
  {
    id: 7,
    title: "Recuperando um Senso de Conexão",
    intro:
      "Sobre se tratar como algo precioso, buscar espaços de silêncio e transformar fragmentos da sua vida em uma colagem autobiográfica.",
    essay: [
      "Um dos maiores vilões dessa fase do processo é o perfeccionismo — e o livro faz questão de desmontar a confusão mais comum sobre ele: perfeccionismo não tem nada a ver com ter padrões altos. É, na prática, um sistema fechado e obsessivo que te prende nos detalhes até você perder de vista o todo. É reescrever a primeira cena de uma peça vinte vezes e nunca chegar à segunda. Não é buscar o melhor resultado — é uma forma disfarçada de perseguir o pior em si mesmo, a parte que insiste que nada que você fizer jamais vai ser bom o bastante pra parar de mexer.",
      "O antídoto proposto é uma pergunta simples: 'o que eu faria se não precisasse fazer perfeito?'. A resposta costuma ser uma lista bem mais longa e mais divertida do que a vida que a pessoa está realmente vivendo. Isso conecta direto com o tema do risco: a gente compara nossos primeiros passos tortos com a obra madura de mestres consagrados — comparamos nosso primeiro curta de faculdade com um blockbuster pronto, não com o primeiro curta de faculdade de quem também começou torto. Pra fazer algo bem, é preciso antes estar disposto a fazer mal feito.",
      "A semana também nomeia um sentimento que muita gente prefere não admitir: inveja. O livro trata inveja como um mapa, não como defeito de caráter — cada pontada de inveja aponta pra um desejo real que você ainda não teve coragem de perseguir. Fazer conscientemente um 'mapa da inveja' (de quem você sente inveja, por quê, e que ação concreta você pode tomar a respeito) costuma esvaziar o sentimento quase imediatamente, porque a inveja perde força assim que vira ação em vez de ruminação.",
      "No fundo, essas três ideias — perfeccionismo, risco e inveja — apontam pro mesmo lugar: o medo de ser visto fazendo algo mal feito é, quase sempre, mais paralisante do que o próprio fracasso seria na prática.",
    ],
    checklist: [
      { task: "Transforme a frase 'me tratar como algo precioso me fortalece' em algo visual e deixe à vista.",
        detail: "A ideia central da semana: a gente costuma achar que se cobrar demais é que traz força, quando na verdade é o cuidado que sustenta a disciplina a longo prazo." },
      { task: "Reserve 20 minutos só para ouvir um álbum inteiro, sem fazer mais nada.",
        detail: "Atenção total, sem multitarefa, é rara hoje em dia — e costuma ser quando insights criativos aparecem sem esforço." },
      { task: "Visite um espaço silencioso e sagrado para você (igreja, biblioteca, mata, museu) e savoreie o silêncio.",
        detail: "O silêncio prolongado tem um efeito parecido com o das Morning Pages: esvazia o ruído mental o suficiente pra outra voz aparecer." },
      { task: "Crie um cheiro bom em casa — sopa, incenso, velas, flores.",
        detail: "O olfato é o sentido mais ligado à memória e à emoção — perfumar o espaço muda o estado de humor quase instantaneamente." },
      { task: "Use sua roupa favorita num dia comum, sem ocasião especial.",
        detail: "Guardar as 'coisas boas' pra uma ocasião especial que nunca chega é um padrão comum em quem se nega prazer no dia a dia." },
      { task: "Compre para si algo pequeno e reconfortante.",
        detail: "Um gesto pequeno de autocuidado material, sem culpa nem justificativa necessária." },
      { task: "Monte uma colagem: 20 minutos recortando revistas, junte imagens que reflitam sua vida e seus interesses.",
        detail: "A colagem funciona como um retrato do inconsciente — muita gente se surpreende com os temas que aparecem sem planejar." },
      { task: "Liste 5 filmes favoritos e observe temas em comum — eles aparecem na sua colagem?",
        detail: "Filmes favoritos costumam repetir os mesmos temas emocionais (redenção, aventura, pertencimento) — vale ver se batem com o que apareceu na colagem." },
      { task: "Dê à sua colagem um lugar de honra, mesmo que secreto.",
        detail: "Tratar o próprio trabalho com respeito, mesmo um exercício simples de recorte e cola, reforça que sua expressão criativa merece espaço." },
    ],
    checkinBonus: "Que conexão — com você, com outra pessoa ou com algo maior — se fortaleceu essa semana?",
  },
  {
    id: 8,
    title: "Recuperando um Senso de Força",
    intro:
      "Semana de nomear sonhos escondidos, traçar um plano de ação realista e desenhar um 'dia ideal' dentro e fora dos limites atuais.",
    essay: [
      "Duas desculpas disputam o posto de mais usada por artistas bloqueados: 'sou velho demais pra começar' e 'não tenho dinheiro pra isso'. O livro ataca a primeira de frente com uma pergunta-resposta que virou quase um mantra do método: quantos anos você vai ter quando finalmente aprender a tocar piano? A mesma idade que você vai ter se não aprender. 'Velho demais' quase nunca é sobre idade de verdade — é uma forma de poupar o ego do desconforto de ser, de novo, principiante em alguma coisa.",
      "Por trás disso mora uma distinção importante entre processo e produto. Nossa cultura valoriza o resultado pronto ('eu escrevi um roteiro') muito mais que o ato de fazer ('estou escrevendo um roteiro') — mas é exatamente o foco no resultado final que trava tanta gente antes mesmo de começar. Se o único objetivo aceitável é a obra-prima terminada, qualquer primeiro rascunho parece fracasso. Enquanto isso, quem foca no processo consegue se manter curioso e em movimento, porque não está o tempo todo julgando se já chegou.",
      "A ferramenta prática pra sair da paralisia é o que o livro chama de preencher a forma: em vez de sonhar acordado com a mudança de vida inteira que a arte vai exigir (largar o emprego, mudar de cidade, terminar um relacionamento), você só dá o próximo passo pequeno e disponível — lavar os pincéis, ligar pra perguntar sobre uma aula, escrever a página de hoje. Dramatizar a decisão inteira de uma vez é, segundo a autora, uma forma sofisticada de procrastinação: é mais fácil ficar obsessivo com 'as chances' do que simplesmente sentar e fazer o próximo pedacinho.",
      "O exercício do Dia Ideal, que fecha essa semana, existe justamente pra tornar esse próximo passo concreto: comparar o dia que você realmente vive com o dia que você viveria sem nenhuma restrição costuma revelar que a distância entre os dois é bem menor — e bem mais acessível hoje mesmo — do que parecia.",
    ],
    checklist: [
      { task: "Nomeie um sonho secreto: 'Em um mundo perfeito, eu adoraria ser ___'.",
        detail: "É o ponto de partida da 'busca de metas' — dizer o sonho em voz alta (ou no papel) já é o primeiro ato de coragem." },
      { task: "Defina uma meta concreta que sinalizaria a realização desse sonho.",
        detail: "O livro chama isso de 'norte verdadeiro': duas pessoas podem ter o mesmo sonho (ser atriz, por exemplo) mas motivadas por coisas bem diferentes (fama vs. respeito). Saber o seu norte muda o caminho a seguir." },
      { task: "Trace um plano de ação em camadas: 5 anos, 3 anos, 1 ano, 1 mês, 1 semana, agora.",
        detail: "Quebrar um sonho grande em horizontes de tempo cada vez menores até chegar numa ação possível hoje mesmo." },
      { task: "Escreva sobre a infância que você teria tido com o cuidado perfeito.",
        detail: "Imaginar esse cenário ajuda a identificar o que faltou — e, principalmente, o que você pode agora dar a si mesmo(a) nessa direção." },
      { task: "Escolha uma cor e escreva-se na primeira pessoa como se você fosse ela.",
        detail: "Um exercício de escrita livre e lúdico — costuma soltar associações emocionais que a escrita 'séria' não alcança." },
      { task: "Liste 5 coisas que você 'não pode' fazer — e expresse uma delas no papel, no desenho ou dançando.",
        detail: "Extravasar simbolicamente (escrever, desenhar, dançar) uma regra rígida ajuda a diferenciar limites reais de auto-repressão desnecessária." },
      { task: "Liste 20 coisas que gosta de fazer e categorize (custa dinheiro? sozinho ou acompanhado? relacionado a trabalho?).",
        detail: "Esse mapeamento revela seu 'estilo' criativo real — muita gente descobre que prefere coisas bem diferentes do que 'deveria' gostar." },
      { task: "Planeje seu Dia Ideal dentro da vida atual — e depois um Dia Ideal sem nenhuma restrição.",
        detail: "Comparar os dois planos mostra a distância real entre onde você está e onde quer chegar — geralmente menor do que parece." },
      { task: "Viva hoje um pedacinho festivo do seu Dia Ideal.",
        detail: "Não espere o dia perfeito acontecer inteiro — importe um fragmento dele pra hoje mesmo." },
    ],
    checkinBonus: "Que pedacinho do seu Dia Ideal você já colocou em prática essa semana?",
  },
  {
    id: 9,
    title: "Recuperando um Senso de Compaixão",
    intro:
      "Uma pausa para reler seu próprio percurso com gentileza — reconhecer o quanto mudou e visualizar sua meta já realizada.",
    essay: [
      "Uma das correções de vocabulário mais úteis do livro inteiro aparece nessa semana: pare de chamar de preguiça o que na verdade é medo. Um artista bloqueado raramente está descansando — está gastando uma quantidade enorme de energia em autocrítica, arrependimento e dúvida, só que essa energia não produz nada visível, então de fora (e por dentro também) parece preguiça. Não é. É medo — na maioria das vezes, medo de decepcionar quem te criou, medo de ser bom demais e ter que sustentar isso, ou medo de nunca ser bom o suficiente. Nomear certo o problema já é meio caminho andado pra resolver.",
      "Outra distinção importante é entre disciplina e entusiasmo. Disciplina, no sentido de força de vontade rígida, funciona por um tempo, mas tende a se esgotar — vira só mais uma cobrança. Entusiasmo (que vem do grego, algo como 'preenchido por uma força maior') é mais sustentável porque nasce do brincar, não da obrigação. Um espaço de trabalho gostoso de estar, com objetos que dão prazer de ver, tende a sustentar a prática muito melhor do que qualquer plano rigoroso de horários.",
      "A semana também nomeia um fenômeno que costuma pegar as pessoas de surpresa: o retorno em U criativo — aquele movimento de autossabotagem que acontece bem na véspera, ou logo depois, de uma primeira vitória real. Um roteiro quase vendido que de repente para de ser revisado; uma boa recepção num sarau que, em vez de encorajar, faz a pessoa desistir de vez. Isso não é acidente — é mais confortável seguir sendo vítima do próprio bloqueio do que arriscar ter que ser produtivo e saudável de forma constante. Reconhecer o padrão, com compaixão em vez de vergonha, é o primeiro passo pra atravessá-lo da próxima vez que aparecer.",
    ],
    checklist: [
      { task: "Releia trechos das suas Morning Pages recentes: marque insights de um jeito e ações necessárias de outro.",
        detail: "Reler as próprias páginas com dois marcadores diferentes transforma o que parecia só desabafo em um mapa prático de próximos passos." },
      { task: "Faça um balanço: do que você reclamou o tempo todo? O que procrastinou? O que já mudou ou aceitou?",
        detail: "É um check-up de meio de percurso — reconhecer progresso é tão importante quanto identificar o que ainda trava." },
      { task: "Escreva, no presente, uma 'cena ideal' de você vivendo sua meta plenamente realizada.",
        detail: "Escrever no presente (não no futuro) engana a mente pra sentir a cena como possível e próxima, não distante e abstrata." },
      { task: "Leia essa cena em voz alta e deixe-a visível no seu espaço de trabalho.",
        detail: "Repetição e visibilidade diária mantêm a meta 'quente' na sua atenção, em vez de esquecida numa gaveta mental." },
      { task: "Liste suas metas criativas do ano, do mês e da semana.",
        detail: "Alinhar os três horizontes de tempo evita o erro comum de ter metas anuais grandiosas sem nenhuma ação semanal que as sustente." },
      { task: "Nomeie um projeto criativo abandonado ('retorno em U') — ele pode ser resgatado agora?",
        detail: "'Retorno em U' é o termo do livro pra quando a gente começa algo e desiste no meio por medo, não por falta de valor no projeto. Nem tudo precisa ser resgatado — mas vale perguntar." },
      { task: "Escolha um objeto para ser seu 'totem de artista' — algo que desperte ternura pela sua criança-artista.",
        detail: "Ter um objeto físico associado a autocompaixão (um bichinho, uma figura, um brinquedo) dá um lugar concreto pra depositar gentileza consigo mesmo(a) nos dias difíceis." },
    ],
    checkinBonus: "Que gentileza você teve com seu próprio processo criativo essa semana?",
  },
  {
    id: 10,
    title: "Recuperando um Senso de Autoproteção",
    intro:
      "Encarar de frente os hábitos que sabotam — e estabelecer limites concretos e gentis para proteger seu tempo e energia criativa.",
    essay: [
      "O livro trata o excesso de trabalho como um vício de verdade — só que, ao contrário de álcool ou cigarro, esse é o único vício que a sociedade aplaude abertamente. A frase 'estou trabalhando' carrega um ar de virtude inquestionável, mesmo quando, na prática, trabalhar sem parar é muitas vezes uma forma sofisticada de evitar a si mesmo, o próprio parceiro, os próprios sentimentos. Voltando à metáfora do rádio das primeiras semanas: o excesso de trabalho é estática que embaralha justamente o sinal que você mais precisa ouvir.",
      "Um sinal revelador: é bem mais fácil convencer alguém em recuperação criativa a fazer a 'tarefa extra' das Morning Pages do que a cumprir o 'dever de casa' do Artist Date, que é puro descanso e diversão sem produto final. Isso não é coincidência — descanso sem propósito produtivo costuma deixar quem trabalha compulsivamente genuinamente desconfortável. Diversão, nesse contexto, dá medo: porque diversão de verdade tende a acordar rebeldia, prazer, e uma sensação de poder pessoal que ficou muito tempo adormecida.",
      "A ferramenta prática da semana é estabelecer um limite mínimo — o livro usa o termo 'bottom line': uma lista curta e específica de comportamentos que você se compromete a não repetir mais, em vez de uma resolução vaga tipo 'vou trabalhar menos'. Regras específicas ('não trabalho depois das 20h', 'não levo notebook pra viagem') sustentam muito melhor do que boas intenções genéricas, porque tiram da mesa a necessidade de renegociar o limite toda vez que a tentação aparece.",
      "Vale reparar num padrão sutil: trabalhar demais costuma vir disfarçado de responsabilidade, então é fácil não perceber. Um bom teste é comparar as horas reais que você dedica ao trabalho com uma semana comum de quarenta horas — a diferença costuma surpreender.",
    ],
    checklist: [
      { task: "Faça o exercício 'temas difíceis': sorteie um tema (trabalho, dinheiro, família, hábitos) e escreva 5 formas como ele impactou sua criatividade.",
        detail: "Sortear em vez de escolher tira a chance de evitar o tema mais desconfortável — e costuma ser exatamente aí que mora o insight mais útil." },
      { task: "Liste seus 'pontos de referência de felicidade' — pequenas coisas que sempre te consolam — e deixe a lista visível.",
        detail: "Ter essa lista à mão facilita recorrer a ela em momentos difíceis, em vez de tentar lembrar 'o que me faz bem' no meio de uma crise." },
      { task: "Responda com honestidade: qual hábito mais atrapalha sua criatividade hoje? Qual o 'ganho' de mantê-lo?",
        detail: "Mesma lógica de semanas anteriores: todo hábito autossabotador tem uma função escondida (alívio, distração, controle). Nomear o ganho tira o peso da autocrítica pura." },
      { task: "Identifique quais amizades alimentam sua dúvida e quais acreditam genuinamente em você.",
        detail: "Não é sobre cortar ninguém definitivamente — é sobre ter clareza de quem procurar (ou evitar) em fases mais sensíveis do processo criativo." },
      { task: "Defina um 'limite mínimo': escolha 5 comportamentos dolorosos que você vai parar de aceitar.",
        detail: "'Bottom line' no livro é a ideia de linhas claras e não-negociáveis (ex.: 'não trabalho fins de semana') — funciona melhor como regra fixa do que como decisão renegociada toda vez." },
      { task: "Liste 5 pequenas vitórias recentes e 3 ações de cuidado que você já tomou por si.",
        detail: "Reconhecer vitórias pequenas contrabalança a tendência de só notar o que ainda falta fazer." },
      { task: "Faça uma coisa gentil por você mesmo(a) todos os dias dessa semana.",
        detail: "Repetir o gesto diariamente (não só uma vez) é o que de fato transforma autocuidado em hábito, não em exceção rara." },
    ],
    checkinBonus: "Que limite você conseguiu proteger essa semana, mesmo que pequeno?",
  },
  {
    id: 11,
    title: "Recuperando um Senso de Autonomia",
    intro:
      "Semana de reconhecer o quanto você já mudou — e de investir concretamente em quem você está se tornando.",
    essay: [
      "O tema central dessa semana pode ser resumido numa frase simples de dizer e difícil de viver de verdade: 'eu sou um artista'. Não como profissão, não como identidade validada por vendas ou reconhecimento externo — como um fato sobre quem você é, do mesmo jeito que se diz 'eu sou canhoto' ou 'eu sou alto'. O livro é bem direto sobre isso: sua credibilidade como artista está entre você e o próprio trabalho, não numa votação de amigos, família ou mercado.",
      "Isso tem implicações práticas incômodas. Um artista pode ter fluxo de caixa instável, pode não vender tudo o que produz, pode nunca ter uma casa de revista de decoração — e ainda assim ser, genuinamente, um artista realizado. A ideia de que dinheiro valida a legitimidade da arte é sedutora e quase sempre falsa: por esse critério, boa parte dos nomes que hoje enchem museus teria sido descartada como fracasso em vida.",
      "Aceitação, nesse contexto, significa negociar com a própria excentricidade em vez de constantemente tentar se 'normalizar' pra agradar os outros. Você pode ser um ótimo cozinheiro e uma péssima faxineira. Pode gastar dinheiro numa garrafa de perfume só porque o vidro é bonito. Pode gostar de uma peça de roupa que 'estraga' o resto do look porque ela puxa alguma memória específica. Nada disso é frivolidade — é o tipo de atenção ao particular que sustenta qualquer prática criativa de verdade.",
      "A semana também pede um inventário: olhar pra trás e nomear, com honestidade, o quanto você já mudou desde a Semana 1. Esse tipo de balanço costuma revelar uma transformação bem maior do que dá pra perceber vivendo dia a dia — e é exatamente esse reconhecimento que sustenta a autonomia necessária pra continuar sem a estrutura semanal do curso, que está prestes a acabar.",
    ],
    checklist: [
      { task: "Grave sua própria voz lendo os Princípios Básicos ou um trecho favorito do livro; use para meditar.",
        detail: "Ouvir sua própria voz repetindo essas ideias costuma ter um efeito diferente (mais pessoal) do que só ler em silêncio." },
      { task: "Escreva à mão sua Oração do Artista (da Semana 4) e guarde-a com você.",
        detail: "Levar essa declaração de intenção fisicamente com você é um lembrete de bolso do compromisso que você fez consigo mesmo(a)." },
      { task: "Comece um caderno de desejos com 7 áreas (saúde, posses, lazer, relações, criatividade, carreira, espiritualidade); liste 10 desejos em cada uma.",
        detail: "Cobrir várias áreas da vida evita o erro comum de só sonhar sobre 'trabalho e arte' e esquecer o resto da vida que também merece atenção." },
      { task: "Faça um inventário: como você mudou desde que começou esse processo?",
        detail: "Esse balanço geral, perto do fim das 12 semanas, costuma revelar uma transformação maior do que a pessoa percebeu dia a dia." },
      { task: "Liste 5 formas como pretende se cuidar nos próximos 6 meses.",
        detail: "Pensar além da duração do programa ajuda a não tratar essas 12 semanas como um evento isolado, e sim como o início de um hábito permanente." },
      { task: "Planeje uma semana inteira de autocuidado: uma ação concreta por dia.",
        detail: "Colocar no papel, dia a dia, transforma a intenção vaga de 'me cuidar mais' em algo executável de verdade." },
      { task: "Escreva e envie (a si mesmo, por carta ou mensagem) uma carta de encorajamento para sua criança-artista interior.",
        detail: "Fechar o ciclo iniciado na Semana 1 (a carta de defesa) com uma mensagem de apoio, agora vindo de um lugar mais fortalecido." },
      { task: "Reexamine seu conceito de força espiritual/criativa: ele apoia ou limita sua expansão?",
        detail: "Não precisa ser sobre religião — é sobre notar se as ideias que você tem sobre 'o que é permitido' ainda fazem sentido pra quem você é agora." },
    ],
    checkinBonus: "Que passo de autonomia criativa você deu essa semana?",
  },
  {
    id: 12,
    title: "Recuperando um Senso de Fé",
    intro:
      "A última semana: encarar os medos sobre seguir em frente sozinho(a), celebrar o percurso e decidir o que vem a seguir.",
    essay: [
      "Criatividade exige fé — e fé exige abrir mão de controle, o que é genuinamente assustador. Boa parte da resistência que aparece nessa reta final não é sobre falta de vontade: é sobre a dificuldade real de aceitar que seguir uma intuição, sem garantia nenhuma de resultado, é a única forma de qualquer coisa nova nascer. O livro sugere uma virada de perspectiva: em vez de tentar prever cada passo do caminho, basta confiar na próxima ação certa disponível agora — sem precisar enxergar a curva seguinte.",
      "Um conceito bonito dessa semana é o de que toda ideia precisa nascer no escuro, como um pão crescendo dentro do forno. Se você abre o forno cedo demais pra checar, o pão murcha. Ideias funcionam do mesmo jeito: elas pedem um período de gestação confuso e nada produtivo por fora antes de qualquer insight visível aparecer. A pressa em ter 'uma ideia de verdade' logo de cara costuma matar justamente a ideia que estava se formando devagar.",
      "A semana também propõe alargar a própria definição do que conta como criativo — a Arte com A maiúsculo, prestigiada e exposta, não é o único destino válido pra esse impulso. Costurar, cozinhar, replantar um vaso, reorganizar uma prateleira: tudo isso é, genuinamente, o mesmo músculo em ação, e frequentemente é justamente numa dessas atividades 'menores' que surge a solução pra um bloqueio criativo maior — não por acaso, é comum destravar um roteiro emperrado enquanto se cuida do jardim ou se remenda uma roupa.",
      "Pra fechar as 12 semanas, vale menos perguntar 'o que eu conquistei' e mais 'o que eu quero levar disso pra frente'. As duas ferramentas básicas — Morning Pages e Artist Date — não têm prazo de validade. A intenção nunca foi que elas terminassem com o programa; era que se tornassem, simplesmente, parte de como você vive.",
    ],
    checklist: [
      { task: "Escreva suas resistências, medos e raivas sobre continuar esse processo sem o suporte estruturado das 12 semanas.",
        detail: "É normal sentir insegurança ao perder a estrutura semanal — nomear esse medo é o primeiro passo pra criar sua própria estrutura daqui pra frente." },
      { task: "Observe suas áreas atuais de procrastinação — qual medo está escondido por trás delas?",
        detail: "Procrastinação raramente é preguiça pura — quase sempre existe um medo específico por trás (de errar, de julgamento, de sucesso até)." },
      { task: "Releia as Crenças Centrais Negativas que você escreveu na Semana 1 e note o quanto avançou.",
        detail: "Fechar o círculo com o primeiro exercício do programa é uma forma concreta de medir a distância percorrida." },
      { task: "Escreva novas afirmações sobre sua criatividade daqui para frente.",
        detail: "As afirmações da Semana 1 foram sobre curar o passado; essas são sobre sustentar o futuro." },
      { task: "Escolha um 'recipiente de preocupações' — um pote, caixa ou frasco para colocar fisicamente medos e preocupações.",
        detail: "Ter um lugar físico e simbólico para 'entregar' preocupações ajuda a soltar o controle excessivo sobre coisas que não dependem só de você." },
      { task: "Use esse recipiente: escreva um medo, coloque-o ali e tome a próxima pequena ação possível mesmo assim.",
        detail: "A ideia não é que o medo desapareça — é agir apesar dele, confiando que o processo (não o controle total) é o que sustenta a criatividade." },
      { task: "Pergunte-se com sinceridade: o que você mais gostaria de criar, sem nenhuma restrição?",
        detail: "Depois de 12 semanas de trabalho interno, essa pergunta tende a ter uma resposta mais clara e menos filtrada do que teria na Semana 1." },
      { task: "Liste 5 pessoas com quem você pode compartilhar seus sonhos criativos e planos futuros.",
        detail: "A recuperação criativa não precisa ser solitária depois que o programa termina — vale já ter em mente quem vai te acompanhar daqui pra frente." },
      { task: "Decida como você vai manter as Morning Pages e o Artist Date depois dessas 12 semanas.",
        detail: "As duas ferramentas básicas não têm prazo de validade — a intenção é que continuem fazendo parte da rotina bem depois do programa acabar." },
    ],
    checkinBonus: "O que você quer levar dessas 12 semanas para o que vem agora?",
  },
];

// Banco de ideias de Artist Date — conteúdo original, inspirado no espírito
// de encontros solo, sensoriais e sem compromisso de produtividade.
const ARTIST_DATE_IDEAS = [
  "Visite uma loja de miudezas ou papelaria e compre algo bobo e colorido.",
  "Vá sozinho(a) a uma exposição ou museu que nunca visitou.",
  "Passeie por um brechó sem intenção de comprar nada — só olhar.",
  "Vá a uma sorveteria ou confeitaria e experimente um sabor que nunca provou.",
  "Sente-se em um parque e observe as pessoas por 30 minutos, sem celular.",
  "Visite uma livraria e deixe-se levar por capas e títulos ao acaso.",
  "Vá a uma loja de tintas, tecidos ou artesanato só para tocar as texturas.",
  "Assista a um filme sozinho(a), no cinema, no meio da tarde.",
  "Explore um bairro novo da cidade a pé, sem destino definido.",
  "Vá a uma feira de rua ou mercado e compre um ingrediente que nunca usou.",
  "Visite um jardim botânico ou estufa de plantas.",
  "Vá a uma loja de discos e ouça vinis antigos.",
  "Faça uma sessão de karaokê sozinho(a), em casa ou numa cabine privada.",
  "Visite uma loja de brinquedos antigos ou colecionáveis.",
  "Vá a um aquário ou zoológico.",
  "Sente-se num café novo e escreva observando o movimento ao redor.",
  "Visite uma galeria de arte pequena e independente.",
  "Vá a uma missa, culto ou cerimônia de uma tradição espiritual diferente da sua, só para observar.",
  "Passeie por um cemitério histórico e leia os nomes e datas.",
  "Vá a uma loja de artigos vintage de cinema ou pôsteres.",
  "Assista a um pôr do sol num lugar alto da cidade.",
  "Visite uma biblioteca pública diferente da que costuma frequentar.",
  "Faça uma trilha curta na natureza, sozinho(a) e em silêncio.",
  "Vá a uma padaria e experimente um pão ou doce típico de outra cultura.",
  "Visite uma loja de instrumentos musicais e experimente tocar algo, mesmo sem saber.",
  "Vá a uma feira de antiguidades ou pulgas.",
  "Passeie de bicicleta por uma rota que nunca fez.",
  "Visite um planetário ou observatório.",
  "Vá a uma loja de perfumes e cheire fragrâncias só por curiosidade.",
  "Assista a um espetáculo de dança ou circo.",
  "Visite um mercado de flores bem cedo pela manhã.",
  "Faça uma aula avulsa de algo que sempre quis experimentar (cerâmica, dança, colagem).",
  "Vá a uma loja de mapas ou globos antigos.",
  "Passeie por uma livraria de livros usados e cheire as páginas antigas.",
  "Visite uma cachoeira, lago ou rio próximo.",
  "Vá a um bar de jogos de tabuleiro e jogue sozinho(a) ou observe.",
  "Assista ao nascer do sol uma vez, só para ver como é.",
  "Visite uma loja de bordados, linhas e aviamentos.",
  "Vá a uma sessão de cinema mudo ou clássico.",
  "Passeie por um shopping antigo ou galeria comercial histórica.",
  "Vá a uma loja de chás e experimente uma variedade nova.",
  "Visite uma oficina de vitral, cerâmica ou vidro soprado como visitante.",
  "Sente-se numa praça histórica e desenhe o que vê, mesmo sem saber desenhar.",
  "Vá a uma loja de selos ou cartas antigas.",
  "Visite um mirante ou ponto turístico da sua própria cidade que nunca foi.",
  "Passeie por uma floricultura e monte um pequeno arranjo para si mesmo(a).",
  "Vá a uma sessão de fotos instantâneas (fotomatom) sozinho(a).",
  "Visite uma loja de artigos religiosos ou espirituais de uma tradição diferente da sua.",
  "Assista a uma apresentação de música ao vivo num bar pequeno, sem compromisso.",
  "Vá a uma loja de roupas vintage e experimente algo fora do seu estilo habitual.",
  "Passeie por um cemitério de trens, barcos ou aviões antigos, se houver na sua região.",
  "Reserve uma hora para não fazer absolutamente nada — só observar o teto e devanear.",
];

// ================= TEXTO DE INTERFACE (fonte única) =================
// UI_STRINGS — dicionário plano (chave "secao.item" -> texto), pra não
// duplicar rótulos de nav, cards e diálogos entre o PWA e o UWP à mão.
// Gerado em Data/content.json (ver scripts/generate-content-json.js) e
// consumido no UWP por atribuição direta no code-behind (ContentStore.
// Content.UiStrings["chave"]), já que XAML não faz bind direto contra um
// dicionário. Só cobre texto estático e realmente duplicado — strings
// totalmente dinâmicas/interpoladas continuam locais em cada plataforma.
const UI_STRINGS = {
  "nav.home": "Início",
  "nav.progress": "Jornada",
  "nav.artistDate": "Date",
  "nav.recursos": "Recursos",
  "nav.profile": "Meu Perfil",
  "nav.settings": "Ajustes",
  "nav.sync": "Sincronizar",

  "common.save": "Salvar",
  "common.add": "Adicionar",
  "common.cancel": "Cancelar",
  "common.ok": "OK",
  "common.allDone": "Tudo certo",

  "settings.title": "Ajustes",
  "settings.subtitle": "seus rituais",
  "settings.tabs.appearance": "Aparência",
  "settings.tabs.dataSync": "Dados & Sync",
  "settings.tabs.advanced": "Avançado",
  "settings.profile.title": "Seu perfil",
  "settings.profile.saveButton": "Salvar e reativar lembretes",
  "settings.appearance.title": "Aparência",
  "settings.appearance.description": "Defina o tema do seu aplicativo. Ele será sincronizado em todos os seus dispositivos.",
  "settings.calendar.title": "Calendário do Windows",
  "settings.data.title": "Seus dados",
  "settings.data.description": "Tudo fica só no seu aparelho. Faça backup de vez em quando.",
  "settings.sync.title": "Sincronização",
  "settings.updates.title": "Atualizações",
  "settings.dangerZone.title": "Zona de risco",
  "settings.maintenance.title": "Modo manutenção",
  "settings.maintenance.description": "Depois das 12 semanas, desliga o checklist e o check-in semanal — fica só Morning Pages e Artist Date rodando indefinidamente.",
  "settings.maintenance.toggleOn": "Ativar modo manutenção",
  "settings.maintenance.toggleOff": "Desativar modo manutenção",

  "recursos.title": "Recursos",
  "recursos.subtitle": "ferramentas e exercícios vivos do livro",
  "recursos.reference.title": "Referência",
  "recursos.reference.description": "Sempre à mão, pra reler quando bater a dúvida.",
  "recursos.lists.title": "Listas e mapas",
  "recursos.lists.description": "Crescem com o tempo, não somem depois de uma semana.",
  "recursos.diaries.title": "Diários",
  "recursos.diaries.description": "Registros contínuos, não presos a nenhuma semana específica.",
  "recursos.letters.title": "Cartas",
  "recursos.letters.description": "Escritas uma vez, guardadas pra reler exatamente quando o livro pede.",
  "recursos.planning.title": "Planejamento",
  "recursos.planning.description": "Formulários estruturados de metas, estilo e dia ideal.",
  "recursos.boundaries.title": "Limites e memórias",
  "recursos.boundaries.description": "Bottom line, pontos de felicidade, totem e memórias de projetos.",
  "recursos.history.title": "Histórico",
  "recursos.history.description": "Reveja Artist Dates e check-ins de semanas passadas.",
  "recursos.quiz.title": "Quiz",
  "recursos.quiz.description": "Um teste rápido de autoavaliação do livro.",
};

// TOOL_CONFIGS — substitui o antigo LIST_CONFIGS (que só existia dentro de
// app.js). Cada entrada descreve uma ferramenta de lista/formulário
// genérica, reaproveitada pela mesma tela em ambas plataformas
// (NamedListPage no UWP, rota /list no PWA). `singleton: true` marca um
// formulário de UM registro só (editável/sobrescrito) em vez de uma lista
// que só cresce — mesmo mecanismo de armazenamento (store "lists"), só
// muda o comportamento de salvar.
const TOOL_CONFIGS = {
  // já existiam antes desta leva
  imaginaryLives: {
    listName: "imaginaryLives",
    title: "Vidas Imaginárias",
    subtitle: "Vidas que você gostaria de ter vivido — a lista cresce a cada semana, não precisa reescrever do zero.",
    fields: [{ key: "text", label: "Uma vida imaginária", multiline: true }],
  },
  thingsILike: {
    listName: "thingsILike",
    title: "20 Coisas que Gosto de Fazer",
    subtitle: "Uma lista viva — reaparece em vários exercícios do livro, inclusive como banco de ideias pra Artist Date.",
    fields: [{ key: "text", label: "Uma coisa que eu gosto de fazer", multiline: false }],
  },
  jealousyMap: {
    listName: "jealousyMap",
    title: "Mapa do Ciúme",
    subtitle: "Quem você sente inveja, por quê, e uma ação-antídoto pra cada um.",
    fields: [
      { key: "who", label: "Quem", multiline: false },
      { key: "why", label: "Por quê", multiline: true },
      { key: "antidote", label: "Ação-antídoto", multiline: true },
    ],
  },

  // novas — tipo lista (crescem, nunca são sobrescritas)
  sincronicidade: {
    listName: "sincronicidade",
    title: "Diário de Sincronicidade",
    subtitle: "Toda vez que uma coincidência boa acontecer, registre aqui — sinal de que você está alinhado(a) com sua criatividade.",
    fields: [{ key: "texto", label: "O que aconteceu", multiline: true }],
  },
  pocoCriativo: {
    listName: "pocoCriativo",
    title: "Registro do Poço Criativo",
    subtitle: "Pequenos gestos sensoriais do dia a dia que encheram seu poço criativo — um cheiro, uma música, um caminho diferente pra casa.",
    fields: [{ key: "texto", label: "O que encheu seu poço hoje", multiline: true }],
  },
  diarioResistencia: {
    listName: "diarioResistencia",
    title: "Diário de Resistência",
    subtitle: "Toda vez que perceber que evitou fazer algo, registre aqui — o livro chama isso de medo, não preguiça.",
    fields: [{ key: "texto", label: "O que você evitou fazer", multiline: true }],
  },
  cartaCriticoInterno: {
    listName: "cartaCriticoInterno",
    title: "Cartas para o Crítico Interno",
    subtitle: "Um espaço pra responder, por escrito, às vozes autocríticas — sempre que precisar.",
    fields: [{ key: "texto", label: "Sua carta", multiline: true }],
  },
  diarioLeitura: {
    listName: "diarioLeitura",
    title: "Diário de Leitura Complementar",
    subtitle: "Reflexões sobre outros livros lidos ao longo do processo — o livro incentiva leitura como parte de encher o poço criativo.",
    fields: [
      { key: "livro", label: "Livro", multiline: false },
      { key: "reflexao", label: "Sua reflexão", multiline: true },
    ],
  },
  resentimentosMedos: {
    listName: "resentimentosMedos",
    title: "Resentimentos, Medos e Ganho Oculto",
    subtitle: "Pra um projeto específico: o que te ressente nele, o que teme, e o que ganha (mesmo sem querer) em não fazê-lo.",
    fields: [
      { key: "projeto", label: "Projeto", multiline: false },
      { key: "resentimento", label: "Ressentimento", multiline: true },
      { key: "medo", label: "Medo", multiline: true },
      { key: "ganhoOculto", label: "Ganho oculto em não fazer", multiline: true },
    ],
  },
  retornosEmU: {
    listName: "retornosEmU",
    title: "Registro de Retornos em U",
    subtitle: "Um projeto criativo abandonado, o motivo (quase sempre medo) e se vale a pena resgatar agora.",
    fields: [
      { key: "projeto", label: "Projeto abandonado", multiline: false },
      { key: "motivo", label: "Motivo (o medo por trás)", multiline: true },
      { key: "resgatar", label: "Vale a pena resgatar agora?", multiline: true },
    ],
  },
  arqueologia: {
    listName: "arqueologia",
    title: "Arqueologia",
    subtitle: "Duas listas complementares: o que faltou na infância e um inventário positivo do presente.",
    fields: [
      { key: "faltou", label: "O que faltou na infância", multiline: true },
      { key: "ganho", label: "Inventário positivo de hoje", multiline: true },
    ],
  },
  buscaEstilo: {
    listName: "buscaEstilo",
    title: "Busca de Estilo",
    subtitle: "Reaproveita sua lista de 20 Coisas que Gosto de Fazer, categorizada — revela um 'perfil' de estilo criativo.",
    fields: [
      { key: "atividade", label: "Atividade", multiline: false },
      { key: "custaDinheiro", label: "Custa dinheiro?", multiline: false },
      { key: "sozinhoOuAcompanhado", label: "Sozinho(a) ou acompanhado(a)?", multiline: false },
      { key: "riscoFisico", label: "Tem risco físico?", multiline: false },
      { key: "ligadoATrabalho", label: "Ligado a trabalho?", multiline: false },
    ],
  },
  bottomLine: {
    listName: "bottomLine",
    title: "Bottom Line / Limites Não-Negociáveis",
    subtitle: "Uma lista permanente e sempre visível de limites — pra funcionar de verdade como lembrete, não só um item de checklist riscado.",
    fields: [{ key: "limite", label: "Limite", multiline: true }],
  },
  pontosFelicidade: {
    listName: "pontosFelicidade",
    title: "Pontos de Referência de Felicidade",
    subtitle: "Pequenos consolos que sempre funcionam pra você — pensados pra estar a um toque de distância nos momentos difíceis.",
    fields: [{ key: "texto", label: "O que te conforta", multiline: true }],
  },

  // novas — tipo formulário único (singleton: um registro só, sobrescrito)
  carta80anos: {
    listName: "carta80anos",
    title: "Carta de Você aos 80 Anos",
    subtitle: "Escreva pra si mesmo(a) hoje, a partir da perspectiva de quem você será daqui a décadas.",
    singleton: true,
    fields: [{ key: "texto", label: "Sua carta", multiline: true }],
  },
  carta8anos: {
    listName: "carta8anos",
    title: "Carta de Você aos 8 Anos",
    subtitle: "A carta espelhada — escrita a partir de quem você foi quando criança.",
    singleton: true,
    fields: [{ key: "texto", label: "Sua carta", multiline: true }],
  },
  oracaoArtista: {
    listName: "oracaoArtista",
    title: "Oração do Artista",
    subtitle: "Sua própria declaração de intenção e entrega — não precisa ser religiosa no sentido tradicional. Use-a todos os dias.",
    singleton: true,
    fields: [{ key: "texto", label: "Sua oração", multiline: true }],
  },
  cartaEncorajamento: {
    listName: "cartaEncorajamento",
    title: "Carta de Encorajamento à Criança-Artista",
    subtitle: "Fecha o ciclo aberto na carta de defesa da Semana 1 — uma carta de apoio, escrita já numa fase mais fortalecida.",
    singleton: true,
    fields: [{ key: "texto", label: "Sua carta", multiline: true }],
  },
  metasNorteVerdadeiro: {
    listName: "metasNorteVerdadeiro",
    title: "Busca de Metas / Norte Verdadeiro",
    subtitle: "Nomeie um sonho secreto, o que sinalizaria realizá-lo, e um plano em camadas de tempo.",
    singleton: true,
    fields: [
      { key: "sonho", label: "Sonho secreto", multiline: true },
      { key: "norteVerdadeiro", label: "Norte verdadeiro (o que sinalizaria essa realização)", multiline: true },
      { key: "horizonte5anos", label: "Em 5 anos", multiline: false },
      { key: "horizonte3anos", label: "Em 3 anos", multiline: false },
      { key: "horizonte1ano", label: "Em 1 ano", multiline: false },
      { key: "horizonte1mes", label: "Em 1 mês", multiline: false },
      { key: "horizonte1semana", label: "Em 1 semana", multiline: false },
      { key: "horizonteAgora", label: "Agora", multiline: false },
    ],
  },
  diaIdeal: {
    listName: "diaIdeal",
    title: "Dia Ideal",
    subtitle: "Planeje um dia perfeito dentro da vida atual — e depois a versão sem nenhuma restrição.",
    singleton: true,
    fields: [
      { key: "diaIdealAtual", label: "Dia ideal dentro da vida atual", multiline: true },
      { key: "diaIdealSemRestricoes", label: "Dia ideal sem nenhuma restrição", multiline: true },
    ],
  },
  cadernoDesejos: {
    listName: "cadernoDesejos",
    title: "Caderno de Desejos",
    subtitle: "7 áreas da vida — liste o que deseja em cada uma.",
    singleton: true,
    fields: [
      { key: "saude", label: "Saúde", multiline: true },
      { key: "posses", label: "Posses", multiline: true },
      { key: "lazer", label: "Lazer", multiline: true },
      { key: "relacoes", label: "Relações", multiline: true },
      { key: "criatividade", label: "Criatividade", multiline: true },
      { key: "carreira", label: "Carreira", multiline: true },
      { key: "espiritualidade", label: "Espiritualidade", multiline: true },
    ],
  },
  planoContinuidade: {
    listName: "planoContinuidade",
    title: "Plano de Continuidade",
    subtitle: "Como manter Morning Pages e Artist Date depois que o programa das 12 semanas terminar.",
    singleton: true,
    fields: [{ key: "texto", label: "Seu plano", multiline: true }],
  },
  totemArtista: {
    listName: "totemArtista",
    title: "Totem do Artista",
    subtitle: "Um objeto que desperte ternura pela sua criança-artista — guardado aqui pra não esquecer qual é.",
    singleton: true,
    fields: [{ key: "texto", label: "Seu totem", multiline: true }],
  },
};

// QUIZ_CONFIGS — quiz de múltipla escolha com pontuação. Só uma entrada
// por enquanto. Perguntas em paráfrase própria (mesmo espírito do resto
// deste arquivo), não cópia literal do livro.
const QUIZ_CONFIGS = {
  workaholismQuiz: {
    key: "workaholismQuiz",
    title: "Quiz do Vício em Trabalho",
    subtitle: "Autoavaliação rápida — sem nenhum caráter clínico, só um espelho pro seu padrão de trabalho.",
    questions: [
      { text: "Trabalho fora do horário de expediente.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Cancelo compromissos com pessoas queridas pra trabalhar mais.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Adio passeios até o prazo de um projeto passar.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Levo trabalho pra casa nos fins de semana.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Levo trabalho comigo nas férias.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Eu realmente tiro férias.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "As pessoas próximas a mim reclamam que eu só trabalho.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Tento fazer duas coisas ao mesmo tempo.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Eu me permito um tempo livre entre um projeto e outro.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "Eu consigo encerrar de verdade uma tarefa (fechar o ciclo) em vez de deixá-la sempre em aberto.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "Procrastino as pontas soltas de um trabalho até o fim.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Começo um projeto e já emendo em outros ao mesmo tempo.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Trabalho à noite, no horário que seria da família.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Deixo ligações/mensagens interromperem (e alongarem) meu dia de trabalho.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Reservo uma hora do meu dia pra trabalho criativo ou lazer de verdade.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "Coloco meus sonhos criativos antes das demandas de trabalho.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "Encaixo meu tempo livre nos planos dos outros, em vez dos meus.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Me permito um tempo de ócio, sem fazer absolutamente nada.", options: [{ label: "Nunca", value: 2 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 0 }] },
      { text: "Uso a palavra 'prazo' pra justificar o tanto que estou trabalhando.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
      { text: "Levo trabalho comigo até pra sair pra jantar.", options: [{ label: "Nunca", value: 0 }, { label: "Às vezes", value: 1 }, { label: "Sempre", value: 2 }] },
    ],
    bands: [
      { min: 0, max: 13, label: "Baixo", description: "Seu trabalho parece equilibrado com sua vida criativa e pessoal." },
      { min: 14, max: 26, label: "Moderado", description: "Vale prestar atenção — alguns padrões de excesso de trabalho já estão aparecendo." },
      { min: 27, max: 40, label: "Alto", description: "O livro chama isso de vício. Considere estabelecer um Bottom Line de limites não-negociáveis (Recursos → Limites e memórias)." },
    ],
  },
};

if (typeof module !== "undefined") {
  module.exports = {
    BASIC_TOOLS,
    CHECKIN_CORE_QUESTIONS,
    WEEKS,
    ARTIST_DATE_IDEAS,
    ROAD_RULES,
    BASIC_PRINCIPLES,
    BELIEF_TABLE,
    AFFIRMATIONS,
    UI_STRINGS,
    TOOL_CONFIGS,
    QUIZ_CONFIGS,
  };
}
