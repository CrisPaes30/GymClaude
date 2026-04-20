const API_BASE = 'https://exercisedb.p.rapidapi.com';

// Cache de ID numérico (nome-do-exercício → ID da API, ex: "0308")
const idCache = new Map<string, string | null>();
// Cache de blob URLs por resolução
const blobCache = new Map<string, string | null>();

function idToSearch(id: string): string {
  return id.replace(/-/g, ' ');
}

function apiHeaders(): Record<string, string> | null {
  const key = process.env.REACT_APP_EXERCISEDB_KEY;
  return key
    ? { 'x-rapidapi-key': key, 'x-rapidapi-host': 'exercisedb.p.rapidapi.com' }
    : null;
}

/** Obtém o ID numérico da ExerciseDB para um exercício (com cache). */
async function getNumericId(exerciseId: string): Promise<string | null> {
  if (idCache.has(exerciseId)) return idCache.get(exerciseId)!;

  const headers = apiHeaders();
  if (!headers) { idCache.set(exerciseId, null); return null; }

  try {
    const term = encodeURIComponent(idToSearch(exerciseId));
    const res = await fetch(`${API_BASE}/exercises/name/${term}?limit=1&offset=0`, { headers });
    if (!res.ok) { idCache.set(exerciseId, null); return null; }

    const data = await res.json();
    const numericId: string | undefined = data?.[0]?.id;
    idCache.set(exerciseId, numericId ?? null);
    return numericId ?? null;
  } catch {
    idCache.set(exerciseId, null);
    return null;
  }
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
