import { exercisesDatabase } from '../data/exercises';

const API_BASE = 'https://exercisedb.p.rapidapi.com';

// Cache de ID numérico (nome-do-exercício → ID da API, ex: "0308")
const idCache = new Map<string, string | null>();
// Cache de blob URLs por resolução
const blobCache = new Map<string, string | null>();

// Mapeamento de equipamento em português → inglês (para busca no ExerciseDB)
const EQUIPMENT_EN: Record<string, string> = {
  'halteres': 'dumbbell',
  'halter': 'dumbbell',
  'barra': 'barbell',
  'cabo': 'cable',
  'polia': 'cable',
  'kettlebell': 'kettlebell',
  'anilha': 'plate',
};

function idToSearch(id: string): string {
  return id.replace(/-/g, ' ');
}

/**
 * Constrói o termo de busca para o ExerciseDB enriquecido com o tipo de
 * equipamento, quando o exercício está no banco local. Isso evita retornos
 * de variantes erradas (ex: "shoulder press" → pode vir barbell; com
 * "dumbbell shoulder press" a correspondência é muito mais precisa).
 */
function buildSearchTerm(exerciseId: string): string {
  const local = exercisesDatabase.find(e => e.id === exerciseId);
  if (local?.equipment?.length) {
    const eqEn = local.equipment
      .map(e => EQUIPMENT_EN[e.toLowerCase().trim()])
      .find(Boolean);
    if (eqEn) return `${eqEn} ${idToSearch(exerciseId)}`;
  }
  return idToSearch(exerciseId);
}

function apiHeaders(): Record<string, string> | null {
  const key = process.env.REACT_APP_EXERCISEDB_KEY;
  return key
    ? { 'x-rapidapi-key': key, 'x-rapidapi-host': 'exercisedb.p.rapidapi.com' }
    : null;
}

async function searchByName(term: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/exercises/name/${encodeURIComponent(term)}?limit=1&offset=0`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** Obtém o ID numérico da ExerciseDB para um exercício (com cache). */
async function getNumericId(exerciseId: string): Promise<string | null> {
  if (idCache.has(exerciseId)) return idCache.get(exerciseId)!;

  const headers = apiHeaders();
  if (!headers) { idCache.set(exerciseId, null); return null; }

  // Tenta primeiro com equipamento enriquecido (ex: "dumbbell shoulder press")
  const enriched = buildSearchTerm(exerciseId);
  let numericId = await searchByName(enriched, headers);

  // Fallback: busca só pelo nome sem equipamento
  if (!numericId && enriched !== idToSearch(exerciseId)) {
    numericId = await searchByName(idToSearch(exerciseId), headers);
  }

  idCache.set(exerciseId, numericId);
  return numericId;
}

/** Busca a imagem/GIF em uma resolução específica e retorna um blob URL local. */
async function fetchImage(exerciseId: string, resolution: number): Promise<string | null> {
  const cacheKey = `${exerciseId}_${resolution}`;
  if (blobCache.has(cacheKey)) return blobCache.get(cacheKey)!;

  const headers = apiHeaders();
  if (!headers) { blobCache.set(cacheKey, null); return null; }

  const numericId = await getNumericId(exerciseId);
  if (!numericId) { blobCache.set(cacheKey, null); return null; }

  try {
    const res = await fetch(`${API_BASE}/image?exerciseId=${numericId}&resolution=${resolution}`, { headers });
    if (!res.ok) { blobCache.set(cacheKey, null); return null; }

    const blob = await res.blob();
    if (!blob.size) { blobCache.set(cacheKey, null); return null; }

    const url = URL.createObjectURL(blob);
    blobCache.set(cacheKey, url);
    return url;
  } catch {
    blobCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Busca o GIF animado em alta resolução para o detalhe do exercício.
 * Tenta 360px, depois 180px como fallback.
 */
export async function fetchExerciseGif(exerciseId: string): Promise<string | null> {
  return (await fetchImage(exerciseId, 360)) ?? (await fetchImage(exerciseId, 180));
}

/**
 * Busca a imagem em resolução reduzida para thumbnails na lista.
 * Reutiliza o cache de ID — não faz nova busca se o GIF já foi carregado.
 */
export async function fetchExerciseThumbnail(exerciseId: string): Promise<string | null> {
  return fetchImage(exerciseId, 180);
}
