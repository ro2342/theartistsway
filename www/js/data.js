// data.js — Conteúdo do programa de 12 semanas
// Todo o texto aqui é uma reescrita/paráfrase original inspirada na estrutura
// de "The Artist's Way" (Julia Cameron) e materiais complementares (Toolkit,
// Workbook, Artist's Date Book) — não é cópia literal do livro.

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
    checklist: [
      "Comece as Morning Pages: 3 páginas à mão, toda manhã, sem reler.",
      "Escolha 2–3 afirmações e repita-as ao final das páginas de cada dia.",
      "Liste três antigos 'vilões' da sua autoconfiança criativa (professores, críticos, vozes internalizadas).",
      "Escreva em detalhe sobre um desses episódios — o que aconteceu, como você se sentiu.",
      "Escreva uma carta 'em sua defesa' na voz da sua criança-artista ferida.",
      "Liste três 'campeões' que apoiaram sua criatividade e escreva um agradecimento a um deles.",
      "Liste 5 vidas imaginárias que você gostaria de ter vivido; escolha uma e faça algo dela essa semana.",
      "Faça seu primeiro Artist Date da jornada, sozinho(a).",
      "Leve seu artista interior para uma caminhada de 20 minutos.",
    ],
    checkinBonus: "O que essa semana te lembrou sobre o que você precisa para se sentir seguro(a) ao criar?",
  },
  {
    id: 2,
    title: "Recuperando um Senso de Identidade",
    intro:
      "Semana para separar o que você realmente quer fazer do que acha que 'deveria' fazer — e mapear quem apoia (ou sabota) essa busca.",
    checklist: [
      "Leia os Princípios Básicos em voz alta, de manhã e à noite.",
      "Liste as 5 atividades que mais tomaram seu tempo essa semana e quanto foi 'quero' vs. 'deveria'.",
      "Desenhe um mapa de segurança: quem apoia sua criatividade agora e de quem você precisa se proteger por um tempo.",
      "Liste 20 coisas que você gosta de fazer, com a data da última vez que fez cada uma.",
      "Escolha duas dessas coisas 'esquecidas' como metas para essa semana.",
      "Volte às afirmações da Semana 1 e note quais ainda incomodam — geralmente são as mais importantes.",
      "Adicione mais 5 vidas imaginárias à sua lista da semana passada.",
      "Desenhe seu 'Life Pie': divida um círculo em fatias (espiritualidade, exercício, lazer, trabalho, amigos, romance) e marque o quanto está satisfeito em cada uma.",
      "Liste 10 pequenas mudanças que gostaria de fazer e execute uma delas.",
    ],
    checkinBonus: "Que 'deveria' você conseguiu trocar por um 'eu quero de verdade' essa semana?",
  },
  {
    id: 3,
    title: "Recuperando um Senso de Poder",
    intro:
      "Reconectar com a energia e os instintos da infância — e reconhecer hábitos e amizades que drenam (ou nutrem) sua força criativa.",
    checklist: [
      "Descreva seu quarto de infância e o que você mais gostava nele; traga um pouco desse espírito para seu espaço atual.",
      "Liste 5 traços que você gostava em si mesmo quando criança.",
      "Liste 5 conquistas e 5 comidas favoritas da infância — presenteie-se com uma delas essa semana.",
      "Identifique 3 hábitos autodestrutivos óbvios e 3 mais sutis; anote o 'ganho' de mantê-los.",
      "Liste amigos que realmente te nutrem (vs. os que te fazem sentir incapaz).",
      "Ligue para alguém que acredita em você e na sua capacidade de realizar coisas.",
      "Reserve uma hora para uma atividade 'cérebro de artista' (caminhar, pintar, dirigir, esfregar a casa) e preste atenção ao que emerge.",
      "Liste 5 pessoas que você admira abertamente e 5 que admira em segredo; compare os traços.",
    ],
    checkinBonus: "Que fonte de energia ou poder pessoal você redescobriu essa semana?",
  },
  {
    id: 4,
    title: "Recuperando um Senso de Integridade",
    intro:
      "Semana de honestidade com quem você foi, é e quer ser — inclui considerar uma pausa de leitura para dar mais espaço à sua própria voz.",
    checklist: [
      "Descreva seu ambiente ideal e cole/desenhe uma imagem dele perto de onde você trabalha.",
      "Escreva uma carta de você aos 80 anos para você hoje.",
      "Escreva uma carta de você aos 8 anos para você hoje.",
      "Veja se há um canto da casa que possa virar seu espaço criativo secreto.",
      "Revise o 'Life Pie' da Semana 2 — o que já mudou de forma?",
      "Escreva sua própria Oração do Artista e use-a todos os dias dessa semana.",
      "Planeje um Artist Date estendido (um dia ou fim de semana só seu).",
      "Doe uma peça de roupa que te faz sentir mal consigo mesmo(a).",
      "Considere uma semana de 'jejum de leitura' (sem livros, TV ou redes por alguns dias) — se topar, registre como foi.",
    ],
    checkinBonus: "Você notou alguma sincronicidade essa semana? Qual foi?",
  },
  {
    id: 5,
    title: "Recuperando um Senso de Possibilidade",
    intro:
      "Semana para encarar as queixas sobre um universo que não apoia — e começar a colecionar imagens do que você secretamente deseja.",
    checklist: [
      "Liste 5 razões pelas quais é difícil confiar num universo/força apoiadora.",
      "Comece um 'arquivo de imagens': recorte ou salve imagens dos seus 5 maiores desejos.",
      "Revise sua lista de vidas imaginárias — mudou algo? Adicione imagens dela ao arquivo.",
      "Liste 5 aventuras que faria se tivesse 20 anos e dinheiro sobrando.",
      "Liste 5 prazeres que você tem adiado e faria se tivesse 65 anos e dinheiro sobrando.",
      "Liste 10 formas pelas quais você é duro(a) demais consigo mesmo(a).",
      "Liste 10 coisas que gostaria de ter e não tem.",
      "Descreva (em palavras ou desenho) qual é o seu bloqueio criativo favorito.",
      "Escreva: qual é o 'ganho' de continuar bloqueado(a)? Quem você culpa por isso?",
    ],
    checkinBonus: "Que novo desejo ou possibilidade você deixou aparecer essa semana, mesmo sem saber como realizá-lo ainda?",
  },
  {
    id: 6,
    title: "Recuperando um Senso de Abundância",
    intro:
      "Semana sobre riqueza que não é dinheiro — pequenos prazeres, cores favoritas e permissão para receber coisas boas de graça.",
    checklist: [
      "Encontre e carregue com você 5 pedrinhas ou objetos naturais interessantes.",
      "Colete 5 flores ou folhas e prense-as.",
      "Doe ou jogue fora 5 peças de roupa gastas que não te representam mais.",
      "Cozinhe algo simples como ato criativo (não precisa ser 'arte').",
      "Mande postais ou mensagens para 5 pessoas que você adoraria ouvir de volta.",
      "Liste seus 'favoritos' em categorias livres: cores, comidas, bandas, cheiros, lugares.",
      "Releia os Princípios Básicos e sua Oração do Artista uma vez por dia.",
      "Faça pelo menos uma pequena mudança no seu ambiente doméstico.",
      "Pratique dizer 'sim' a algo bom e gratuito que te oferecerem essa semana.",
    ],
    checkinBonus: "Onde você sentiu abundância essa semana — não necessariamente em dinheiro?",
  },
  {
    id: 7,
    title: "Recuperando um Senso de Conexão",
    intro:
      "Sobre se tratar como algo precioso, buscar espaços de silêncio e transformar fragmentos da sua vida em uma colagem autobiográfica.",
    checklist: [
      "Transforme a frase 'me tratar como algo precioso me fortalece' em algo visual e deixe à vista.",
      "Reserve 20 minutos só para ouvir um álbum inteiro, sem fazer mais nada.",
      "Visite um espaço silencioso e sagrado para você (igreja, biblioteca, mata, museu) e savoreie o silêncio.",
      "Crie um cheiro bom em casa — sopa, incenso, velas, flores.",
      "Use sua roupa favorita num dia comum, sem ocasião especial.",
      "Compre para si algo pequeno e reconfortante.",
      "Monte uma colagem: 20 minutos recortando revistas, junte imagens que reflitam sua vida e seus interesses.",
      "Liste 5 filmes favoritos e observe temas em comum — eles aparecem na sua colagem?",
      "Dê à sua colagem um lugar de honra, mesmo que secreto.",
    ],
    checkinBonus: "Que conexão — com você, com outra pessoa ou com algo maior — se fortaleceu essa semana?",
  },
  {
    id: 8,
    title: "Recuperando um Senso de Força",
    intro:
      "Semana de nomear sonhos escondidos, traçar um plano de ação realista e desenhar um 'dia ideal' dentro e fora dos limites atuais.",
    checklist: [
      "Nomeie um sonho secreto: 'Em um mundo perfeito, eu adoraria ser ___'.",
      "Defina uma meta concreta que sinalizaria a realização desse sonho.",
      "Trace um plano de ação em camadas: 5 anos, 3 anos, 1 ano, 1 mês, 1 semana, agora.",
      "Escreva sobre a infância que você teria tido com o cuidado perfeito.",
      "Escolha uma cor e escreva-se na primeira pessoa como se você fosse ela.",
      "Liste 5 coisas que você 'não pode' fazer — e expresse uma delas no papel, no desenho ou dançando.",
      "Liste 20 coisas que gosta de fazer e categorize (custa dinheiro? sozinho ou acompanhado? relacionado a trabalho?).",
      "Planeje seu Dia Ideal dentro da vida atual — e depois um Dia Ideal sem nenhuma restrição.",
      "Viva hoje um pedacinho festivo do seu Dia Ideal.",
    ],
    checkinBonus: "Que pedacinho do seu Dia Ideal você já colocou em prática essa semana?",
  },
  {
    id: 9,
    title: "Recuperando um Senso de Compaixão",
    intro:
      "Uma pausa para reler seu próprio percurso com gentileza — reconhecer o quanto mudou e visualizar sua meta já realizada.",
    checklist: [
      "Releia trechos das suas Morning Pages recentes: marque insights de um jeito e ações necessárias de outro.",
      "Faça um balanço: do que você reclamou o tempo todo? O que procrastinou? O que já mudou ou aceitou?",
      "Escreva, no presente, uma 'cena ideal' de você vivendo sua meta plenamente realizada.",
      "Leia essa cena em voz alta e deixe-a visível no seu espaço de trabalho.",
      "Liste suas metas criativas do ano, do mês e da semana.",
      "Nomeie um projeto criativo abandonado ('retorno em U') — ele pode ser resgatado agora?",
      "Escolha um objeto para ser seu 'totem de artista' — algo que desperte ternura pela sua criança-artista.",
    ],
    checkinBonus: "Que gentileza você teve com seu próprio processo criativo essa semana?",
  },
  {
    id: 10,
    title: "Recuperando um Senso de Autoproteção",
    intro:
      "Encarar de frente os hábitos que sabotam — e estabelecer limites concretos e gentis para proteger seu tempo e energia criativa.",
    checklist: [
      "Faça o exercício 'temas difíceis': sorteie um tema (trabalho, dinheiro, família, hábitos) e escreva 5 formas como ele impactou sua criatividade.",
      "Liste seus 'pontos de referência de felicidade' — pequenas coisas que sempre te consolam — e deixe a lista visível.",
      "Responda com honestidade: qual hábito mais atrapalha sua criatividade hoje? Qual o 'ganho' de mantê-lo?",
      "Identifique quais amizades alimentam sua dúvida e quais acreditam genuinamente em você.",
      "Defina um 'limite mínimo': escolha 5 comportamentos dolorosos que você vai parar de aceitar.",
      "Liste 5 pequenas vitórias recentes e 3 ações de cuidado que você já tomou por si.",
      "Faça uma coisa gentil por você mesmo(a) todos os dias dessa semana.",
    ],
    checkinBonus: "Que limite você conseguiu proteger essa semana, mesmo que pequeno?",
  },
  {
    id: 11,
    title: "Recuperando um Senso de Autonomia",
    intro:
      "Semana de reconhecer o quanto você já mudou — e de investir concretamente em quem você está se tornando.",
    checklist: [
      "Grave sua própria voz lendo os Princípios Básicos ou um trecho favorito do livro; use para meditar.",
      "Escreva à mão sua Oração do Artista (da Semana 4) e guarde-a com você.",
      "Comece um caderno de desejos com 7 áreas (saúde, posses, lazer, relações, criatividade, carreira, espiritualidade); liste 10 desejos em cada uma.",
      "Faça um inventário: como você mudou desde que começou esse processo?",
      "Liste 5 formas como pretende se cuidar nos próximos 6 meses.",
      "Planeje uma semana inteira de autocuidado: uma ação concreta por dia.",
      "Escreva e envie (a si mesmo, por carta ou mensagem) uma carta de encorajamento para sua criança-artista interior.",
      "Reexamine seu conceito de força espiritual/criativa: ele apoia ou limita sua expansão?",
    ],
    checkinBonus: "Que passo de autonomia criativa você deu essa semana?",
  },
  {
    id: 12,
    title: "Recuperando um Senso de Fé",
    intro:
      "A última semana: encarar os medos sobre seguir em frente sozinho(a), celebrar o percurso e decidir o que vem a seguir.",
    checklist: [
      "Escreva suas resistências, medos e raivas sobre continuar esse processo sem o suporte estruturado das 12 semanas.",
      "Observe suas áreas atuais de procrastinação — qual medo está escondido por trás delas?",
      "Releia as Crenças Centrais Negativas que você escreveu na Semana 1 e note o quanto avançou.",
      "Escreva novas afirmações sobre sua criatividade daqui para frente.",
      "Escolha um 'recipiente de preocupações' — um pote, caixa ou frasco para colocar fisicamente medos e preocupações.",
      "Use esse recipiente: escreva um medo, coloque-o ali e tome a próxima pequena ação possível mesmo assim.",
      "Pergunte-se com sinceridade: o que você mais gostaria de criar, sem nenhuma restrição?",
      "Liste 5 pessoas com quem você pode compartilhar seus sonhos criativos e planos futuros.",
      "Decida como você vai manter as Morning Pages e o Artist Date depois dessas 12 semanas.",
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

if (typeof module !== "undefined") {
  module.exports = { BASIC_TOOLS, CHECKIN_CORE_QUESTIONS, WEEKS, ARTIST_DATE_IDEAS };
}
