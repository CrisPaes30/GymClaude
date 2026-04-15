import { Exercise } from '../types';

export const exercisesDatabase: Exercise[] = [

  // ==================== PEITORAL ====================
  {
    id: 'push-ups',
    name: 'Flexões',
    muscleGroup: ['peitoral', 'triceps', 'ombros'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Deite-se de bruços no chão',
      'Coloque as mãos no chão na largura dos ombros',
      'Mantenha o corpo em linha reta do calcanhar à cabeça',
      'Desça até quase tocar o peito no chão',
      'Empurre o corpo para cima com força'
    ],
    sets: 3, reps: '8-15', rest: 60
  },
  {
    id: 'bench-press',
    name: 'Supino Reto com Barra',
    muscleGroup: ['peitoral', 'triceps', 'ombros'],
    difficulty: 'intermediate',
    equipment: ['barra', 'banco'],
    instructions: [
      'Deite no banco com os pés no chão',
      'Pegue a barra com pegada um pouco mais larga que os ombros',
      'Desça a barra controladamente até tocar o peito',
      'Empurre a barra para cima em linha reta',
      'Não trave os cotovelos no topo'
    ],
    sets: 4, reps: '6-10', rest: 90
  },
  {
    id: 'incline-bench-press',
    name: 'Supino Inclinado com Halteres',
    muscleGroup: ['peitoral', 'triceps', 'ombros'],
    difficulty: 'intermediate',
    equipment: ['halteres', 'banco inclinado'],
    instructions: [
      'Ajuste o banco a 30-45 graus',
      'Segure os halteres na altura do peito superior',
      'Empurre os pesos para cima e levemente para dentro',
      'Desça controladamente até sentir o alongamento no peitoral',
      'Foco total no peitoral superior'
    ],
    sets: 4, reps: '8-12', rest: 75
  },
  {
    id: 'decline-bench-press',
    name: 'Supino Declinado',
    muscleGroup: ['peitoral', 'triceps'],
    difficulty: 'intermediate',
    equipment: ['barra', 'banco declinado'],
    instructions: [
      'Deite no banco declinado com pés presos',
      'Pegue a barra com pegada na largura dos ombros',
      'Desça a barra até a parte inferior do peitoral',
      'Empurre com força para cima'
    ],
    sets: 3, reps: '8-12', rest: 75
  },
  {
    id: 'dumbbell-fly',
    name: 'Crucifixo com Halteres',
    muscleGroup: ['peitoral'],
    difficulty: 'intermediate',
    equipment: ['halteres', 'banco'],
    instructions: [
      'Deite no banco com halteres acima do peito',
      'Abra os braços em arco controlando a descida',
      'Sinta o alongamento máximo no peitoral',
      'Feche os braços como se estivesse abraçando uma árvore',
      'Nunca trave os cotovelos'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'cable-crossover',
    name: 'Cross-Over no Cabo',
    muscleGroup: ['peitoral'],
    difficulty: 'intermediate',
    equipment: ['cabo'],
    instructions: [
      'Posicione as roldanas na altura superior',
      'Fique no centro com um cabo em cada mão',
      'Incline levemente o tronco para frente',
      'Feche os braços em arco descendo até a altura do umbigo',
      'Contraia o peitoral no ponto de fechamento'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'chest-dips',
    name: 'Paralelas para Peitoral',
    muscleGroup: ['peitoral', 'triceps'],
    difficulty: 'intermediate',
    equipment: ['paralelas'],
    instructions: [
      'Apoie nas paralelas com pegada afastada',
      'Incline o tronco para frente',
      'Desça até sentir o alongamento no peitoral',
      'Empurre para cima sem travar os cotovelos'
    ],
    sets: 3, reps: '8-12', rest: 75
  },

  // ==================== COSTAS ====================
  {
    id: 'pull-ups',
    name: 'Barra Fixa Pronada',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'intermediate',
    equipment: ['barra'],
    instructions: [
      'Pendure-se na barra com pegada pronada (palma para frente)',
      'Afaste as mãos um pouco mais que a largura dos ombros',
      'Puxe o corpo para cima até o queixo passar da barra',
      'Desça de forma controlada',
      'Não balance o corpo'
    ],
    sets: 3, reps: '5-10', rest: 90
  },
  {
    id: 'chin-ups',
    name: 'Barra Fixa Supinada',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'intermediate',
    equipment: ['barra'],
    instructions: [
      'Pendure-se na barra com pegada supinada (palma para você)',
      'Afaste as mãos na largura dos ombros',
      'Puxe o corpo para cima até o queixo passar da barra',
      'Desça controladamente'
    ],
    sets: 3, reps: '5-10', rest: 90
  },
  {
    id: 'lat-pulldown',
    name: 'Puxada Frontal na Polia',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'beginner',
    equipment: ['polia', 'cabo'],
    instructions: [
      'Sente-se na máquina fixando as coxas sob o apoio',
      'Pegue a barra com pegada pronada mais larga que os ombros',
      'Puxe a barra até a altura do queixo contraindo o latíssimo',
      'Controle a subida da barra',
      'Mantenha o peito aberto durante todo o movimento'
    ],
    sets: 4, reps: '10-12', rest: 75
  },
  {
    id: 'bent-over-row',
    name: 'Remada Curvada com Barra',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'intermediate',
    equipment: ['barra'],
    instructions: [
      'Fique de pé com os pés afastados na largura dos ombros',
      'Segure a barra e curve o tronco a 45 graus',
      'Puxe a barra em direção ao abdômen baixo',
      'Controle a descida sem arredondar as costas'
    ],
    sets: 4, reps: '8-12', rest: 75
  },
  {
    id: 'seated-cable-row',
    name: 'Remada Sentado no Cabo',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'beginner',
    equipment: ['cabo', 'polia'],
    instructions: [
      'Sente-se na máquina com os pés no apoio',
      'Segure o triângulo com os dois braços estendidos',
      'Puxe em direção ao abdômen, cotovelos para trás',
      'Contraia bem as escápulas no final do movimento',
      'Retorne controladamente'
    ],
    sets: 4, reps: '10-12', rest: 75
  },
  {
    id: 'single-arm-dumbbell-row',
    name: 'Remada Unilateral com Halter',
    muscleGroup: ['costas', 'biceps'],
    difficulty: 'beginner',
    equipment: ['halteres', 'banco'],
    instructions: [
      'Apoie um joelho e a mão do mesmo lado no banco',
      'Segure o halter com o braço estendido',
      'Puxe o halter até a cintura com o cotovelo para cima',
      'Controle a descida',
      'Complete as repetições e troque o lado'
    ],
    sets: 3, reps: '10-12 cada lado', rest: 60
  },
  {
    id: 'deadlift',
    name: 'Levantamento Terra',
    muscleGroup: ['costas', 'glúteos', 'pernas'],
    difficulty: 'advanced',
    equipment: ['barra'],
    instructions: [
      'Fique em pé com a barra sobre o meio dos pés',
      'Agache e pegue a barra com pegada dupla pronada',
      'Mantenha a coluna neutra e o peito aberto',
      'Empurre o chão com os pés ao subir',
      'Estenda o quadril e os joelhos simultaneamente',
      'Desça controlando cada fase do movimento'
    ],
    sets: 4, reps: '4-6', rest: 120
  },
  {
    id: 'hyperextension',
    name: 'Hiperextensão Lombar',
    muscleGroup: ['costas', 'glúteos'],
    difficulty: 'beginner',
    equipment: ['banco romano'],
    instructions: [
      'Posicione-se no banco romano com os quadris no apoio',
      'Cruze os braços no peito ou atrás da cabeça',
      'Desça o tronco para baixo com controle',
      'Suba até ficar alinhado com o corpo',
      'Não hiperextenda a lombar no topo'
    ],
    sets: 3, reps: '12-15', rest: 60
  },

  // ==================== PERNAS ====================
  {
    id: 'squats',
    name: 'Agachamento Livre',
    muscleGroup: ['quadriceps', 'glúteos', 'pernas'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Fique de pé com os pés na largura dos ombros',
      'Pés ligeiramente abertos para fora',
      'Desça como se fosse sentar numa cadeira atrás de você',
      'Mantenha o peito ereto e os joelhos alinhados com os pés',
      'Desça até as coxas ficarem paralelas ao chão',
      'Suba empurrando o chão com os calcanhares'
    ],
    sets: 4, reps: '12-20', rest: 75
  },
  {
    id: 'barbell-squat',
    name: 'Agachamento com Barra',
    muscleGroup: ['quadriceps', 'glúteos', 'pernas'],
    difficulty: 'intermediate',
    equipment: ['barra', 'rack'],
    instructions: [
      'Posicione a barra sobre os trapézios',
      'Pés na largura dos ombros, ligeiramente abertos',
      'Desça controlando o movimento',
      'Coxas paralelas ou abaixo do paralelo',
      'Suba com força empurrando o chão'
    ],
    sets: 4, reps: '8-12', rest: 90
  },
  {
    id: 'leg-press',
    name: 'Leg Press 45°',
    muscleGroup: ['quadriceps', 'glúteos', 'pernas'],
    difficulty: 'beginner',
    equipment: ['leg press'],
    instructions: [
      'Sente-se na máquina com as costas bem apoiadas',
      'Posicione os pés na plataforma na largura dos ombros',
      'Destrave e desça controlando até 90 graus',
      'Empurre a plataforma sem travar os joelhos no topo',
      'Nunca tire as costas do apoio'
    ],
    sets: 4, reps: '12-15', rest: 75
  },
  {
    id: 'leg-extension',
    name: 'Extensora de Perna',
    muscleGroup: ['quadriceps'],
    difficulty: 'beginner',
    equipment: ['extensora'],
    instructions: [
      'Ajuste o banco para que os joelhos fiquem alinhados ao eixo',
      'Sente-se com as costas apoiadas',
      'Estenda as pernas até a horizontal',
      'Contraia o quadríceps no topo',
      'Desça controlando o movimento'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'leg-curl',
    name: 'Flexora de Perna Deitado',
    muscleGroup: ['isquiotibiais', 'pernas'],
    difficulty: 'beginner',
    equipment: ['flexora'],
    instructions: [
      'Deite de barriga para baixo na máquina',
      'Posicione o apoio atrás dos tornozelos',
      'Dobre os joelhos trazendo os calcanhares em direção ao glúteo',
      'Contraia os isquiotibiais no ponto máximo',
      'Desça controlando o retorno'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'lunges',
    name: 'Afundo',
    muscleGroup: ['quadriceps', 'glúteos', 'pernas'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Fique em pé com os pés juntos',
      'Dê um passo grande para frente',
      'Desça até o joelho de trás quase tocar o chão',
      'O joelho da frente não pode passar do pé',
      'Volte à posição inicial e alterne as pernas'
    ],
    sets: 3, reps: '10-15 cada perna', rest: 60
  },
  {
    id: 'romanian-deadlift',
    name: 'Stiff (Levantamento Terra Romeno)',
    muscleGroup: ['isquiotibiais', 'glúteos', 'costas'],
    difficulty: 'intermediate',
    equipment: ['barra', 'halteres'],
    instructions: [
      'Fique em pé com a barra na frente das coxas',
      'Mantenha as pernas quase estendidas com leve flexão',
      'Descça a barra deslizando pelas pernas até sentir o alongamento',
      'Mantenha as costas retas durante todo o movimento',
      'Suba contraindo os glúteos e os isquiotibiais'
    ],
    sets: 4, reps: '10-12', rest: 75
  },
  {
    id: 'calf-raise',
    name: 'Panturrilha em Pé',
    muscleGroup: ['panturrilha', 'pernas'],
    difficulty: 'beginner',
    equipment: ['plataforma'],
    instructions: [
      'Fique em pé com a ponta dos pés na borda da plataforma',
      'Suba na ponta dos pés o mais alto possível',
      'Contraia a panturrilha no topo por 1 segundo',
      'Desça abaixo do nível da plataforma para alongar',
      'Movimento completo em todas as repetições'
    ],
    sets: 4, reps: '15-20', rest: 45
  },
  {
    id: 'glute-bridge',
    name: 'Ponte de Glúteos',
    muscleGroup: ['glúteos', 'isquiotibiais'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Deite de costas com joelhos dobrados e pés no chão',
      'Eleve o quadril contraindo os glúteos',
      'Segure 2 segundos no topo',
      'Desça controlando o movimento',
      'Foco total na contração dos glúteos'
    ],
    sets: 3, reps: '15-20', rest: 45
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroup: ['glúteos', 'isquiotibiais'],
    difficulty: 'intermediate',
    equipment: ['barra', 'banco'],
    instructions: [
      'Apoie a parte superior das costas no banco',
      'Coloque a barra sobre o quadril com proteção',
      'Pés no chão afastados na largura do quadril',
      'Empurre o quadril para cima até ficar paralelo ao chão',
      'Contraia os glúteos no topo por 2 segundos'
    ],
    sets: 4, reps: '10-15', rest: 75
  },

  // ==================== OMBROS ====================
  {
    id: 'shoulder-press',
    name: 'Desenvolvimento com Halteres',
    muscleGroup: ['ombros', 'triceps'],
    difficulty: 'intermediate',
    equipment: ['halteres'],
    instructions: [
      'Segure os halteres na altura dos ombros',
      'Cotovelos a 90 graus, palmas para frente',
      'Empurre os pesos para cima sem travar os cotovelos',
      'Desça controlando até a altura dos ombros'
    ],
    sets: 4, reps: '8-12', rest: 75
  },
  {
    id: 'military-press',
    name: 'Desenvolvimento Militar com Barra',
    muscleGroup: ['ombros', 'triceps'],
    difficulty: 'advanced',
    equipment: ['barra', 'rack'],
    instructions: [
      'Posicione a barra na frente dos ombros',
      'Pegada levemente mais larga que os ombros',
      'Empurre a barra verticalmente para cima',
      'Traga a cabeça levemente para frente ao subir',
      'Desça controlando até a altura do queixo'
    ],
    sets: 4, reps: '6-10', rest: 90
  },
  {
    id: 'lateral-raise',
    name: 'Elevação Lateral',
    muscleGroup: ['ombros'],
    difficulty: 'beginner',
    equipment: ['halteres'],
    instructions: [
      'Fique em pé com halteres ao lado do corpo',
      'Eleve os braços lateralmente até a altura dos ombros',
      'Cotovelos levemente dobrados',
      'Controle a descida de forma lenta',
      'Não balance o tronco para ganhar impulso'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'front-raise',
    name: 'Elevação Frontal',
    muscleGroup: ['ombros'],
    difficulty: 'beginner',
    equipment: ['halteres'],
    instructions: [
      'Fique em pé com halteres na frente das coxas',
      'Eleve um braço de cada vez até a altura dos ombros',
      'Mantenha o cotovelo levemente dobrado',
      'Controle a descida'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'rear-delt-fly',
    name: 'Crucifixo Inverso (Deltóide Posterior)',
    muscleGroup: ['ombros', 'costas'],
    difficulty: 'intermediate',
    equipment: ['halteres'],
    instructions: [
      'Incline o tronco a 45 graus ou deite no banco inclinado',
      'Segure os halteres com os braços pendurados',
      'Abra os braços lateralmente contraindo o deltóide posterior',
      'Controle o retorno'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'upright-row',
    name: 'Encolhimento em Pé (Upright Row)',
    muscleGroup: ['ombros', 'trapézio'],
    difficulty: 'intermediate',
    equipment: ['barra', 'halteres'],
    instructions: [
      'Segure a barra com pegada pronada à largura dos ombros',
      'Puxe a barra para cima ao longo do corpo até a altura do queixo',
      'Cotovelos sobem acima das mãos',
      'Desça controlando o movimento'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'shrugs',
    name: 'Encolhimento de Ombros (Trapézio)',
    muscleGroup: ['trapézio', 'ombros'],
    difficulty: 'beginner',
    equipment: ['halteres', 'barra'],
    instructions: [
      'Segure os halteres ao lado do corpo',
      'Eleve os ombros em direção às orelhas',
      'Segure 1 segundo no topo',
      'Desça controlando o movimento',
      'Não gire os ombros'
    ],
    sets: 3, reps: '12-15', rest: 60
  },

  // ==================== BÍCEPS ====================
  {
    id: 'bicep-curls',
    name: 'Rosca Direta com Barra',
    muscleGroup: ['biceps'],
    difficulty: 'beginner',
    equipment: ['barra'],
    instructions: [
      'Fique em pé segurando a barra com pegada supinada',
      'Cotovelos fixos ao lado do corpo',
      'Dobre os cotovelos trazendo a barra até os ombros',
      'Contraia os bíceps no topo',
      'Desça de forma lenta e controlada'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'hammer-curl',
    name: 'Rosca Martelo',
    muscleGroup: ['biceps', 'braquiorradial'],
    difficulty: 'beginner',
    equipment: ['halteres'],
    instructions: [
      'Segure os halteres com a pegada neutra (polegar para cima)',
      'Cotovelos fixos ao lado do corpo',
      'Dobre os cotovelos levando o peso até os ombros',
      'Controle a descida',
      'Pode alternar os braços ou fazer simultâneo'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'concentration-curl',
    name: 'Rosca Concentrada',
    muscleGroup: ['biceps'],
    difficulty: 'beginner',
    equipment: ['halteres'],
    instructions: [
      'Sente-se num banco e apoie o cotovelo na face interna da coxa',
      'Segure o halter com pegada supinada',
      'Suba o peso contraindo ao máximo o bíceps',
      'Desça controlando o movimento',
      'Foco total na contração do pico do bíceps'
    ],
    sets: 3, reps: '12-15 cada braço', rest: 45
  },
  {
    id: 'preacher-curl',
    name: 'Rosca Scott',
    muscleGroup: ['biceps'],
    difficulty: 'intermediate',
    equipment: ['banco scott', 'barra'],
    instructions: [
      'Apoie os braços no banco scott',
      'Segure a barra com pegada supinada',
      'Suba a barra até 90 graus mantendo os braços apoiados',
      'Desça controlando até quase a extensão completa'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'cable-curl',
    name: 'Rosca no Cabo',
    muscleGroup: ['biceps'],
    difficulty: 'beginner',
    equipment: ['cabo', 'polia'],
    instructions: [
      'Posicione a polia na parte inferior',
      'Segure o cabo com pegada supinada',
      'Cotovelos fixos ao lado do corpo',
      'Suba o cabo contraindo os bíceps',
      'Tensão constante em todo o movimento'
    ],
    sets: 3, reps: '12-15', rest: 60
  },

  // ==================== TRÍCEPS ====================
  {
    id: 'tricep-dips',
    name: 'Mergulho no Banco',
    muscleGroup: ['triceps'],
    difficulty: 'beginner',
    equipment: ['banco', 'cadeira'],
    instructions: [
      'Apoie as mãos na borda do banco atrás de você',
      'Estenda as pernas à frente',
      'Desça o corpo dobrando os cotovelos a 90 graus',
      'Empurre para cima',
      'Mantenha os cotovelos próximos ao corpo'
    ],
    sets: 3, reps: '10-15', rest: 60
  },
  {
    id: 'tricep-pushdown',
    name: 'Tríceps no Cabo (Pushdown)',
    muscleGroup: ['triceps'],
    difficulty: 'beginner',
    equipment: ['cabo', 'polia'],
    instructions: [
      'Posicione a polia na parte superior',
      'Segure a barra ou corda com pegada pronada',
      'Cotovelos fixos ao lado do corpo',
      'Empurre para baixo até a extensão completa',
      'Controle o retorno'
    ],
    sets: 3, reps: '12-15', rest: 60
  },
  {
    id: 'skull-crusher',
    name: 'Tríceps Testa (Skull Crusher)',
    muscleGroup: ['triceps'],
    difficulty: 'intermediate',
    equipment: ['barra', 'banco'],
    instructions: [
      'Deite no banco segurando a barra acima do peito',
      'Cotovelos apontados para o teto',
      'Dobre os cotovelos descendo a barra em direção à testa',
      'Estenda os cotovelos voltando à posição inicial',
      'Nunca abra os cotovelos para os lados'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Tríceps Francês (Overhead)',
    muscleGroup: ['triceps'],
    difficulty: 'intermediate',
    equipment: ['halteres'],
    instructions: [
      'Segure um halter com as duas mãos acima da cabeça',
      'Cotovelos apontados para cima',
      'Desça o halter atrás da cabeça dobrando os cotovelos',
      'Estenda os cotovelos voltando ao topo',
      'Mantenha os cotovelos estáveis durante todo o movimento'
    ],
    sets: 3, reps: '10-12', rest: 60
  },
  {
    id: 'close-grip-bench',
    name: 'Supino Fechado (Tríceps)',
    muscleGroup: ['triceps', 'peitoral'],
    difficulty: 'intermediate',
    equipment: ['barra', 'banco'],
    instructions: [
      'Deite no banco com pegada pronada estreita na barra',
      'Cotovelos próximos ao corpo durante o movimento',
      'Desça a barra até o peitoral inferior',
      'Empurre para cima contraindo o tríceps'
    ],
    sets: 3, reps: '8-12', rest: 75
  },

  // ==================== ABDÔMEN ====================
  {
    id: 'plank',
    name: 'Prancha Isométrica',
    muscleGroup: ['abdômen', 'core'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Deite de bruços e apoie-se nos antebraços e pontas dos pés',
      'Mantenha o corpo em linha reta da cabeça aos calcanhares',
      'Contraia o abdômen e os glúteos',
      'Respire normalmente durante a execução',
      'Segure a posição pelo tempo determinado'
    ],
    sets: 3, reps: '30-60 segundos', rest: 45
  },
  {
    id: 'crunches',
    name: 'Abdominal Crunch',
    muscleGroup: ['abdômen'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Deite de costas com joelhos dobrados e pés no chão',
      'Coloque as mãos atrás da cabeça levemente',
      'Contraia o abdômen levantando os ombros do chão',
      'Não puxe o pescoço com as mãos',
      'Desça controlando o movimento'
    ],
    sets: 3, reps: '20-30', rest: 45
  },
  {
    id: 'leg-raise',
    name: 'Elevação de Pernas',
    muscleGroup: ['abdômen', 'core'],
    difficulty: 'intermediate',
    equipment: ['barra'],
    instructions: [
      'Pendure-se na barra com braços estendidos',
      'Eleve as pernas até 90 graus mantendo os joelhos levemente dobrados',
      'Controle a descida sem balançar',
      'Foco na contração abdominal'
    ],
    sets: 3, reps: '12-15', rest: 45
  },
  {
    id: 'russian-twist',
    name: 'Rotação Russa',
    muscleGroup: ['abdômen', 'oblíquos'],
    difficulty: 'intermediate',
    equipment: ['anilha'],
    instructions: [
      'Sente-se no chão com os joelhos dobrados',
      'Incline levemente o tronco para trás',
      'Segure a anilha com as duas mãos',
      'Gire o tronco de um lado para o outro',
      'Pode elevar os pés do chão para aumentar a dificuldade'
    ],
    sets: 3, reps: '20-30 (10-15 cada lado)', rest: 45
  },
  {
    id: 'bicycle-crunch',
    name: 'Abdominal Bicicleta',
    muscleGroup: ['abdômen', 'oblíquos'],
    difficulty: 'beginner',
    equipment: [],
    instructions: [
      'Deite de costas com as mãos atrás da cabeça',
      'Eleve as pernas do chão com joelhos a 90 graus',
      'Leve o cotovelo direito ao joelho esquerdo simultaneamente',
      'Alterne os lados em movimento de pedalada',
      'Mantenha o abdômen contraído durante todo o exercício'
    ],
    sets: 3, reps: '20-30 (cada lado)', rest: 45
  },
  {
    id: 'cable-crunch',
    name: 'Abdominal no Cabo',
    muscleGroup: ['abdômen'],
    difficulty: 'intermediate',
    equipment: ['cabo', 'polia'],
    instructions: [
      'Ajoelhe-se de frente para a polia alta',
      'Segure a corda atrás da cabeça',
      'Curve o tronco para baixo contraindo o abdômen',
      'Não puxe com os braços — o movimento vem do abdômen',
      'Retorne controladamente'
    ],
    sets: 3, reps: '15-20', rest: 45
  },

  // ==================== CARDIO / FUNCIONAL ====================
  {
    id: 'burpee',
    name: 'Burpee',
    muscleGroup: ['core', 'peitoral', 'pernas', 'ombros'],
    difficulty: 'intermediate',
    equipment: [],
    instructions: [
      'Fique em pé e salte para a posição de prancha',
      'Faça uma flexão',
      'Volte para a posição agachada',
      'Salte para cima com os braços acima da cabeça',
      'Aterrisse suavemente e repita'
    ],
    sets: 3, reps: '10-15', rest: 60
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    muscleGroup: ['core', 'abdômen', 'pernas'],
    difficulty: 'intermediate',
    equipment: [],
    instructions: [
      'Comece na posição de prancha alta',
      'Traga um joelho em direção ao peito',
      'Alterne rapidamente as pernas',
      'Mantenha os quadris baixos e estáveis',
      'Respire de forma controlada'
    ],
    sets: 3, reps: '30-45 segundos', rest: 45
  },
  {
    id: 'jump-squat',
    name: 'Agachamento com Salto',
    muscleGroup: ['quadriceps', 'glúteos', 'pernas'],
    difficulty: 'intermediate',
    equipment: [],
    instructions: [
      'Posição de agachamento com pés na largura dos ombros',
      'Desça até as coxas paralelas ao chão',
      'Salte explosivamente para cima',
      'Aterrisse suavemente voltando à posição de agachamento',
      'Mantenha o controle em toda a execução'
    ],
    sets: 3, reps: '12-15', rest: 60
  }
];
