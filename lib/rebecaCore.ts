import crypto from 'node:crypto';
import fs from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DATA_DIR = process.env.VERCEL
  ? path.resolve('/tmp', 'rebeca-ovo-data')
  : path.resolve(ROOT_DIR, '.data');
const SCORES_FILE = path.resolve(DATA_DIR, 'scores.json');

// Session signing key from env or ephemeral CSPRNG secret for the process lifetime
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

export interface StoredScore {
  id: string;
  score: number;
  hpRemaining: number;
  difficulty: 'chill' | 'normal' | 'apocalypse';
  ending: 'legendary' | 'perfect' | 'chaotic' | 'tragic';
  eventsCleared: number;
  maxCombo: number;
  createdAt: string;
}

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  ip?: string;
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function safePathInsideData(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return resolved.startsWith(DATA_DIR + path.sep);
}

export function readStoredScores(): StoredScore[] {
  if (!safePathInsideData(SCORES_FILE) || !fs.existsSync(SCORES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SCORES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredScore[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredScores(scores: StoredScore[]): void {
  ensureDataDir();
  if (!safePathInsideData(SCORES_FILE)) {
    throw new Error('Invalid scores path');
  }
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf8');
}

export function signSessionToken(): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'rebeca',
      iat: Date.now(),
      exp: expiresAt,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return { token: `${payload}.${sig}`, expiresAt };
}

export function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    return decoded.sub === 'rebeca' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

const attemptMap = new Map<string, { count: number; resetAt: number }>();

export function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attemptMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    attemptMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 25) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function getClientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function isAuthorizedRequest(req: ApiRequest): { ok: true } | { ok: false; error: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'Acesso exclusivo da Rebeca. Confirme primeiro!' };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifySessionToken(token)) {
    return { ok: false, error: 'Sessão expirada ou inválida. Confirme que você é a Rebeca.' };
  }
  return { ok: true };
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export async function readJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body as Record<string, unknown>;
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    let size = 0;
    const MAX_BYTES = 64 * 1024;
    req.on('data', (chunk: Buffer | string) => {
      size += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
      if (size <= MAX_BYTES) {
        raw += chunk.toString();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function buildRebecaGameBundle() {
  return {
    story: {
      headline: 'REBECA, PRECISO TE PEDIR UMA COISA...',
      prompt: 'Você pode cuidar do meu ovo rapidinho? Prometo que não vou demorar!',
      yesButton: 'CLARO! ❤️',
      hesitantButton: 'NÃO SEI SE É UMA BOA IDEIA...',
      yesReply:
        'SABIA QUE EU PODIA CONFIAR EM VOCÊ, REBECA! ❤️ Segura firme esse ovo aí, já volto em 1 minutinho (ou mais)!',
      hesitantReply:
        'Tarde demais, Rebeca! Já coloquei o ovo na sua mão e saí correndo! Confio em você de olhos fechados! 🏃💨',
    },
    difficulties: [
      {
        id: 'chill',
        name: 'Quase Tranquilo',
        badgeText: '45s · Ritmo Leve',
        description: 'Apenas alguns gatos folgados e uma garoa leve. Ideal pra aquecer os reflexos da Rebeca.',
        durationSec: 45,
        spawnIntervalMinMs: 2500,
        spawnIntervalMaxMs: 3600,
        maxSimultaneous: 1,
        speedMultiplier: 1.0,
        damageMultiplier: 0.85,
        scoreMultiplier: 1,
      },
      {
        id: 'normal',
        name: 'Caos Clássico',
        badgeText: '60s · Emoção Real',
        description: 'Gatos, cachorros caramelo, chuva e ladrões aparecem sem avisar. Clássico teste de paciência!',
        durationSec: 60,
        spawnIntervalMinMs: 1850,
        spawnIntervalMaxMs: 2800,
        maxSimultaneous: 2,
        speedMultiplier: 1.15,
        damageMultiplier: 1.0,
        scoreMultiplier: 1.5,
      },
      {
        id: 'apocalypse',
        name: 'Apocalipse do Ovo',
        badgeText: '75s · Modo Surto',
        description: 'OVNIs, frigideiras, galinhas furiosas e tudo ao mesmo tempo. Só a Rebeca lendária sobrevive.',
        durationSec: 75,
        spawnIntervalMinMs: 1300,
        spawnIntervalMaxMs: 2150,
        maxSimultaneous: 2,
        speedMultiplier: 1.38,
        damageMultiplier: 1.25,
        scoreMultiplier: 2.2,
      },
    ],
    threats: [
      {
        type: 'cat',
        title: 'UM GATO ESTÁ CHEGANDO!',
        subtitle: 'Ele já tá olhando pro ovo com cara de quem vai derrubar da mesa...',
        actionLabel: 'ESPANTAR O GATO! 🧹',
        emoji: '🐱',
        requiredTaps: 1,
        baseDurationMs: 4200,
        damage: 18,
        points: 120,
        ownerPanicMsg: 'Rebeca, por que tem um gato perto do meu ovo???',
        rebecaWinReply: 'Xô bichano! Já espantei ele daqui kkkk',
        accentBg: 'bg-[#FFE4E6]',
        accentBorder: 'border-[#FB7185]',
      },
      {
        type: 'dog',
        title: 'O CACHORRO QUER O OVO!',
        subtitle: 'Um caramelo hiperativo achou que o ovo é uma bolinha de tênis!',
        actionLabel: 'DISTRAIR O CACHORRO! 🦴',
        emoji: '🐶',
        requiredTaps: 2,
        baseDurationMs: 4800,
        damage: 20,
        points: 160,
        ownerPanicMsg: 'REBECA! O CARAMELO NÃO PODE PEGAR O OVO!',
        rebecaWinReply: 'Joguei um ossinho imaginário, ele foi atrás 😂',
        accentBg: 'bg-[#FEF3C7]',
        accentBorder: 'border-[#F59E0B]',
      },
      {
        type: 'rain',
        title: 'COMEÇOU A CHOVER!',
        subtitle: 'Temporal do nada! O ovo vai pegar friagem e escorregar!',
        actionLabel: 'PROTEGER DA CHUVA! ☂️',
        emoji: '🌧️',
        requiredTaps: 1,
        baseDurationMs: 4000,
        damage: 15,
        points: 110,
        ownerPanicMsg: 'Tá chovendo aí, Rebeca?! Cobre meu ovo agora!!',
        rebecaWinReply: 'Guarda-chuva aberto! O ovo tá sequinho ☂️',
        accentBg: 'bg-[#E0F2FE]',
        accentBorder: 'border-[#38BDF8]',
      },
      {
        type: 'hen',
        title: 'UMA GALINHA APARECEU!',
        subtitle: 'Ela tá indignada e exigindo a guarda compartilhada do ovo!',
        actionLabel: 'EXPULSAR A GALINHA! 🐔',
        emoji: '🐔',
        requiredTaps: 2,
        baseDurationMs: 4600,
        damage: 19,
        points: 155,
        ownerPanicMsg: 'UMA GALINHA?! Rebeca, NÃO ENTREGA O OVO PRA ELA!',
        rebecaWinReply: 'Falei que esse ovo já tem dona e ela vazou 💅',
        accentBg: 'bg-[#FFEDD5]',
        accentBorder: 'border-[#FB923C]',
      },
      {
        type: 'pigeon',
        title: 'UM POMBO ESTÁ SE APROXIMANDO!',
        subtitle: 'O pombo de praça veio em voo rasante sem respeito nenhum!',
        actionLabel: 'AFUGENTAR O POMBO! 💨',
        emoji: '🐦',
        requiredTaps: 1,
        baseDurationMs: 3600,
        damage: 14,
        points: 130,
        ownerPanicMsg: 'Cuidado com esse pombo folgado, Rebeca!!',
        rebecaWinReply: 'Sai pombo! Aqui não tem migalha não!',
        accentBg: 'bg-[#E2E8F0]',
        accentBorder: 'border-[#64748B]',
      },
      {
        type: 'falling',
        title: 'O OVO ESTÁ CAINDO!',
        subtitle: 'Escorregou! Pega ele no ar antes que vire omelete no chão!',
        actionLabel: 'SALVAR O OVO! 🤲',
        emoji: '💥',
        requiredTaps: 1,
        baseDurationMs: 3100,
        damage: 28,
        points: 200,
        ownerPanicMsg: 'REBECA DO CÉU O OVO TÁ CAINDOOOOOO!',
        rebecaWinReply: 'PEGUEI NO AR!! Reflexo de gata, respeita 😎',
        accentBg: 'bg-[#FEE2E2]',
        accentBorder: 'border-[#EF4444]',
      },
      {
        type: 'thief',
        title: 'ALGUÉM QUER ROUBAR O OVO!',
        subtitle: 'Um ladrão de terno e máscara quer sequestrar nosso ovo!',
        actionLabel: 'IMPEDIR O ROUBO! 🚨',
        emoji: '🕵️',
        requiredTaps: 3,
        baseDurationMs: 5000,
        damage: 24,
        points: 220,
        ownerPanicMsg: 'CHAMEM A POLÍCIA DO OVO! REBECA BATE NELE!',
        rebecaWinReply: 'Ladrão neutralizado com sucesso! 🚨',
        accentBg: 'bg-[#EDE9FE]',
        accentBorder: 'border-[#8B5CF6]',
      },
      {
        type: 'ufo',
        title: 'UM OVNI QUER ABDUZIR O OVO!',
        subtitle: 'Alienígenas descobriram que esse ovo é valioso demais!',
        actionLabel: 'CORTAR RAIO ALIEN! 🛸',
        emoji: '🛸',
        requiredTaps: 2,
        baseDurationMs: 4400,
        damage: 22,
        points: 190,
        ownerPanicMsg: 'REBECA ATÉ OS ETs QUEREM O MEU OVO?! FAZ ALGUMA COISA!',
        rebecaWinReply: 'Desliguei o raio trator, hoje não E.T. 👽🚫',
        accentBg: 'bg-[#DCFCE7]',
        accentBorder: 'border-[#22C55E]',
      },
      {
        type: 'frying_pan',
        title: 'UMA FRIGIDEIRA SE APROXIMA!',
        subtitle: 'Alguém teve a audácia de tentar transformar o ovo em café da manhã!',
        actionLabel: 'JOGAR A FRIGIDEIRA LONGE! 🍳',
        emoji: '🍳',
        requiredTaps: 2,
        baseDurationMs: 4100,
        damage: 25,
        points: 185,
        ownerPanicMsg: 'FRIGIDEIRA NÃO, REBECA! TIRA ISSO DE PERTO DELE!',
        rebecaWinReply: 'Joguei a frigideira pela janela, tá seguro 🔥',
        accentBg: 'bg-[#FCE7F3]',
        accentBorder: 'border-[#EC4899]',
      },
      {
        type: 'wind',
        title: 'VENTANIA ABSURDA!',
        subtitle: 'Um vendaval do nada quer levar o ovo pelos ares!',
        actionLabel: 'SEGURAR O OVO FIRME! 🌬️',
        emoji: '🌬️',
        requiredTaps: 2,
        baseDurationMs: 4200,
        damage: 16,
        points: 140,
        ownerPanicMsg: 'SEGURA ESSE OVO REBECA, TÁ VOANDO TUDO!',
        rebecaWinReply: 'Segurando firme! Nem furacão leva!',
        accentBg: 'bg-[#CFFAFE]',
        accentBorder: 'border-[#06B6D4]',
      },
      {
        type: 'mosquito',
        title: 'PERNILONGO GIGANTE NO OVO!',
        subtitle: 'Ele tá tentando pousar e furar a casca com o nariz!',
        actionLabel: 'DAR TAPA NO MOSQUITO! 🦟',
        emoji: '🦟',
        requiredTaps: 1,
        baseDurationMs: 3400,
        damage: 12,
        points: 135,
        ownerPanicMsg: 'Rebeca mata esse pernilongo antes que ele pique o ovo!',
        rebecaWinReply: 'PLAF! Já era o mosquito 😤',
        accentBg: 'bg-[#ECFCCB]',
        accentBorder: 'border-[#84CC16]',
      },
      {
        type: 'paparazzi',
        title: 'PAPARAZZI QUERENDO FOTO!',
        subtitle: 'Os flashes tão cegando o coitado do ovo!',
        actionLabel: 'TAMPAR A CÂMERA! 📸',
        emoji: '📸',
        requiredTaps: 1,
        baseDurationMs: 3800,
        damage: 13,
        points: 130,
        ownerPanicMsg: 'Sem fotos, Rebeca! Protege a privacidade do meu ovo!',
        rebecaWinReply: 'Tampei a lente! Ovo não dá entrevista 🕶️',
        accentBg: 'bg-[#F3E8FF]',
        accentBorder: 'border-[#A855F7]',
      },
    ],
    ambientChats: [
      [
        { sender: 'owner', text: 'Rebeca, tá tudo bem com meu ovo?' },
        { sender: 'rebeca', text: 'Tá sim kkkkk', delayMs: 1400 },
        { sender: 'owner', text: 'Você tem certeza absoluta?', delayMs: 2600 },
      ],
      [
        { sender: 'owner', text: 'Rebeca do céu, eu tô sentindo uma energia estranha...' },
        { sender: 'rebeca', text: 'Impressão sua, tá tudo sob controle 👀', delayMs: 1500 },
        { sender: 'owner', text: 'REBECA, NÃO ME DECEPCIONE!', delayMs: 2800 },
      ],
      [
        { sender: 'owner', text: 'CADÊ MEU OVO?! Manda foto pra eu ver!' },
        { sender: 'rebeca', text: 'Calma, ele tá tirando um cochilo 🥚✨', delayMs: 1700 },
        { sender: 'owner', text: 'EU CONFIEI EM VOCÊ, REBECA!', delayMs: 3000 },
      ],
    ],
    standalonePanicLines: [
      'REBECA, NÃO ME DECEPCIONE!',
      'EU CONFIEI EM VOCÊ!',
      'CADÊ MEU OVO?',
      'NÃO DEIXA ELE QUEBRAR!',
      'REBECA, PELO AMOR DE DEUS!',
      'O meu coração não aguenta, Rebeca!!',
      'Se esse ovo sobreviver eu te pago um açaí, Rebeca!',
      'Rebeca, você ainda tá segurando ele direito?!',
    ],
    quickReplies: [
      'Tá tudo bem kkkkk 😅',
      'Relaxa, eu sou profissional 😎',
      'SOCORRO TEM MUITA COISA AQUI 🆘',
      'Confia na mãe! 💪🥚',
    ],
    endings: {
      legendary: {
        id: 'legendary',
        title: 'FINAL LENDÁRIO 🏆',
        headline: 'Rebeca é oficialmente a melhor cuidadora de ovos do mundo!',
        subtext:
          'Nem gato, nem caramelo, nem galinha revoltada e nem alienígena conseguiram arranhar a casca. O dono chorou de emoção ao ver o ovo brilhando!',
        ownerFinalMsg: 'REBECA, VOCÊ É UMA LENDA! Nunca duvidei de você! O ovo tá até mais feliz! 🏆🥚❤️',
        badge: 'Guardiã Suprema do Ovo',
        toneBg: 'bg-[#FEF3C7]',
        toneBorder: 'border-[#F59E0B]',
      },
      perfect: {
        id: 'perfect',
        title: 'FINAL PERFEITO 🎉',
        headline: 'Rebeca protegeu o ovo com honra e maestria!',
        subtext:
          'Rolou uns sustos pelo caminho, mas a Rebeca segurou a onda como ninguém. O ovo voltou inteiro e pronto pra outra!',
        ownerFinalMsg: 'MANDOU MUITO BEM, REBECA! Meu ovo tá inteirinho graças a você! 🎉🥚',
        badge: 'Protetora Oficial',
        toneBg: 'bg-[#DCFCE7]',
        toneBorder: 'border-[#22C55E]',
      },
      chaotic: {
        id: 'chaotic',
        title: 'FINAL CAÓTICO 🩹',
        headline: 'O ovo sobreviveu por muito pouco, Rebeca!',
        subtext:
          'Ele voltou com três band-aids, trauma de gatos e olhando desconfiado pro horizonte... mas tecnicamente NÃO quebrou!',
        ownerFinalMsg: 'Rebeca... por que meu ovo tá tremendo e usando band-aid?? Pelo menos tá inteiro 😅🩹',
        badge: 'Sobrevivente do Caos',
        toneBg: 'bg-[#FFEDD5]',
        toneBorder: 'border-[#F97316]',
      },
      tragic: {
        id: 'tragic',
        title: 'FINAL TRÁGICO 💔',
        headline: 'REBECA... EU CONFIEI EM VOCÊ. 💔',
        subtext:
          'O ovo quebrou e Rebeca decepcionou o dono. Só sobrou a gema no chão e um silêncio constrangedor no WhatsApp.',
        ownerFinalMsg: 'REBECA... EU CONFIEI EM VOCÊ. 💔 Não precisa responder minhas mensagens hoje...',
        badge: 'Virou Omelete',
        toneBg: 'bg-[#FFE4E6]',
        toneBorder: 'border-[#E11D48]',
      },
    },
  };
}

export async function handleConfirmRebeca(req: ApiRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  const clientIp = getClientIp(req);
  if (!checkAuthRateLimit(clientIp)) {
    sendJson(res, 429, { error: 'Muitas tentativas em sequência. Aguarde um pouquinho!' });
    return;
  }

  const body = await readJsonBody(req);
  if (body.confirmedAsRebeca !== true) {
    sendJson(res, 400, { error: 'Confirme clicando em SOU A REBECA ❤️ primeiro!' });
    return;
  }

  const session = signSessionToken();
  sendJson(res, 200, { ok: true, token: session.token, expiresAt: session.expiresAt });
}

export async function handleGetBundle(req: ApiRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Método não permitido.' });
    return;
  }

  const auth = isAuthorizedRequest(req);
  if (!auth.ok) {
    sendJson(res, 401, { error: auth.error });
    return;
  }

  sendJson(res, 200, buildRebecaGameBundle());
}

export async function handleScores(req: ApiRequest, res: ServerResponse): Promise<void> {
  const auth = isAuthorizedRequest(req);
  if (!auth.ok) {
    sendJson(res, 401, { error: auth.error });
    return;
  }

  if (req.method === 'GET') {
    const scores = readStoredScores()
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    sendJson(res, 200, { scores });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const validDiffs = ['chill', 'normal', 'apocalypse'] as const;
    const validEndings = ['legendary', 'perfect', 'chaotic', 'tragic'] as const;

    const score =
      typeof body.score === 'number' && Number.isFinite(body.score)
        ? Math.max(0, Math.min(999999, Math.round(body.score)))
        : -1;
    const hpRemaining =
      typeof body.hpRemaining === 'number' && Number.isFinite(body.hpRemaining)
        ? Math.max(0, Math.min(100, Math.round(body.hpRemaining)))
        : -1;
    const eventsCleared =
      typeof body.eventsCleared === 'number' && Number.isFinite(body.eventsCleared)
        ? Math.max(0, Math.min(999, Math.round(body.eventsCleared)))
        : 0;
    const maxCombo =
      typeof body.maxCombo === 'number' && Number.isFinite(body.maxCombo)
        ? Math.max(0, Math.min(999, Math.round(body.maxCombo)))
        : 0;
    const difficulty = validDiffs.includes(body.difficulty as (typeof validDiffs)[number])
      ? (body.difficulty as StoredScore['difficulty'])
      : null;
    const ending = validEndings.includes(body.ending as (typeof validEndings)[number])
      ? (body.ending as StoredScore['ending'])
      : null;

    if (score < 0 || hpRemaining < 0 || !difficulty || !ending) {
      sendJson(res, 400, { error: 'Dados da partida inválidos.' });
      return;
    }

    const entry: StoredScore = {
      id: crypto.randomUUID(),
      score,
      hpRemaining,
      difficulty,
      ending,
      eventsCleared,
      maxCombo,
      createdAt: new Date().toISOString(),
    };

    const existing = readStoredScores();
    const updated = [...existing, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    writeStoredScores(updated);

    sendJson(res, 201, {
      saved: entry,
      scores: updated.slice(0, 10),
    });
    return;
  }

  sendJson(res, 405, { error: 'Método não permitido.' });
}
