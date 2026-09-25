const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The API rate-limits bursts of requests. Its "429 Too Many Requests" responses carry no CORS
// header, so in the browser they surface as a generic network error rather than a 429 status.
// To stay under the limit: at most MAX_CONCURRENT requests run at once, failures are retried
// with a growing delay, and successful responses are cached for the rest of the visit.
const MAX_CONCURRENT = 6;
const RETRY_DELAYS = [1500, 3000, 6000];
const responseCache = new Map();
let activeRequests = 0;
const requestQueue = [];

async function withRequestSlot(task) {
  if (activeRequests >= MAX_CONCURRENT) await new Promise((resolve) => requestQueue.push(resolve));
  activeRequests++;
  try {
    return await task();
  } finally {
    activeRequests--;
    requestQueue.shift()?.();
  }
}

async function request(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await withRequestSlot(() => fetch(url));
      if (response.status !== 429 && response.status < 500) {
        if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
        // Some bad requests (e.g. a non-numeric id) get an empty body, which means "no data".
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
      if (attempt >= RETRY_DELAYS.length) throw new Error(`Request failed (${response.status}): ${url}`);
    } catch (error) {
      // TypeError = network/CORS failure (including a hidden 429); anything else is final.
      if (!(error instanceof TypeError) || attempt >= RETRY_DELAYS.length) throw error;
    }
    await wait(RETRY_DELAYS[attempt]);
  }
}

function fetchJson(url) {
  if (!responseCache.has(url)) {
    const pending = request(url);
    responseCache.set(url, pending);
    pending.catch(() => responseCache.delete(url));
  }
  return responseCache.get(url);
}

// "No results" comes back as null, and some filters return the string "no data found".
const asArray = (value) => (Array.isArray(value) ? value : []);

const uniqueById = (drinks) => [...new Map(drinks.map((drink) => [drink.idDrink, drink])).values()];

// The free API key caps every response at 25 drinks, so the full catalogue is gathered
// by searching each first letter/digit. Cached so it is only downloaded once per visit.
const CATALOGUE_KEYS = [...'abcdefghijklmnopqrstuvwxyz0123456789'];
let cataloguePromise = null;

// A copy of the catalogue is kept in localStorage for a day, so reloading the site doesn't
// repeat the 36 requests (and risk the API's rate limit). Storage can be full or blocked, so
// every access is wrapped in try/catch and the site works the same without it.
const STORAGE_KEY = 'cocktail-catalogue-v1';
const STORAGE_TTL = 24 * 60 * 60 * 1000;

function readStoredCatalogue() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Date.now() - stored.savedAt < STORAGE_TTL && Array.isArray(stored.drinks)) return stored.drinks;
  } catch {
    // Ignore unreadable storage and fall back to the network.
  }
  return null;
}

function storeCatalogue(drinks) {
  try {
    // Drop empty fields (most of the 15 ingredient slots) to keep the stored copy small.
    const compact = drinks.map((drink) =>
      Object.fromEntries(Object.entries(drink).filter(([, value]) => value !== null && value !== ''))
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), drinks: compact }));
  } catch {
    // Storage full or unavailable — the in-memory copy still works for this visit.
  }
}

export function fetchAllCocktails() {
  if (!cataloguePromise) {
    const stored = typeof localStorage === 'undefined' ? null : readStoredCatalogue();
    if (stored) {
      cataloguePromise = Promise.resolve(stored);
      return cataloguePromise;
    }

    cataloguePromise = Promise.allSettled(
      CATALOGUE_KEYS.map((key) => fetchJson(`${API_BASE}/search.php?f=${key}`))
    ).then((results) => {
      const loaded = results.filter((result) => result.status === 'fulfilled');
      if (loaded.length === 0) throw new Error('Could not load the cocktail catalogue.');
      const drinks = uniqueById(loaded.flatMap((result) => asArray(result.value.drinks)));
      // If only some letters loaded, show what we have but fetch the rest again next time.
      if (loaded.length < results.length) cataloguePromise = null;
      else if (typeof localStorage !== 'undefined') storeCatalogue(drinks);
      return drinks;
    });
    // Allow a retry on the next call if everything failed.
    cataloguePromise.catch(() => {
      cataloguePromise = null;
    });
  }
  return cataloguePromise;
}

export async function fetchCocktails(searchTerm = '') {
  const term = searchTerm.trim();
  if (!term) return fetchAllCocktails();

  // Combine the API's name search with matches from the catalogue for the widest result set.
  const [searchData, catalogue] = await Promise.all([
    fetchJson(`${API_BASE}/search.php?s=${encodeURIComponent(term)}`).catch(() => ({})),
    fetchAllCocktails().catch(() => [])
  ]);
  const normalizedTerm = term.toLowerCase();
  const catalogueMatches = catalogue.filter((drink) => drink.strDrink?.toLowerCase().includes(normalizedTerm));

  return uniqueById([...asArray(searchData.drinks), ...catalogueMatches]);
}

export async function fetchCocktailById(id) {
  const data = await fetchJson(`${API_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  return asArray(data.drinks)[0] ?? null;
}

export async function fetchIngredient(name) {
  const data = await fetchJson(`${API_BASE}/search.php?i=${encodeURIComponent(name)}`);
  return asArray(data.ingredients)[0] ?? null;
}

export const getIngredientImage = (name, size = 'Small') =>
  `https://www.thecocktaildb.com/images/ingredients/${encodeURIComponent(name)}-${size}.png`;

// Returns up to `count` random drinks from a category or glass list, excluding `excludeId`.
export async function fetchRelatedDrinks(type, value, excludeId, count = 4) {
  const param = type === 'glass' ? 'g' : 'c';
  const data = await fetchJson(`${API_BASE}/filter.php?${param}=${encodeURIComponent(value)}`);
  const drinks = asArray(data.drinks).filter((drink) => drink.idDrink !== excludeId);

  for (let i = drinks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [drinks[i], drinks[j]] = [drinks[j], drinks[i]];
  }
  return drinks.slice(0, count);
}

const INSTRUCTION_LANGUAGES = [
  { key: 'strInstructions', label: 'English' },
  { key: 'strInstructionsES', label: 'Español' },
  { key: 'strInstructionsDE', label: 'Deutsch' },
  { key: 'strInstructionsFR', label: 'Français' },
  { key: 'strInstructionsIT', label: 'Italiano' },
  { key: 'strInstructionsZH-HANS', label: '简体中文' },
  { key: 'strInstructionsZH-HANT', label: '繁體中文' }
];

export const getInstructionLanguages = (cocktail) =>
  INSTRUCTION_LANGUAGES.filter(({ key }) => cocktail[key]?.trim());

// Splits an instruction paragraph into individual steps, one per sentence.
export const getInstructionSteps = (text = '') =>
  text
    .split(/(?<=[.!?])\s+|(?<=。)/)
    .map((step) => step.trim())
    .filter(Boolean);

// Turns a YouTube watch/share link into an embeddable player URL, or null if it isn't YouTube.
export function getVideoEmbedUrl(videoUrl) {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    let videoId = null;

    if (host === 'youtu.be') videoId = url.pathname.slice(1);
    else if (host === 'youtube.com' && url.pathname === '/watch') videoId = url.searchParams.get('v');
    else if (host === 'youtube.com' && url.pathname.startsWith('/embed/')) videoId = url.pathname.split('/')[2];

    return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null;
  } catch {
    return null;
  }
}

export const getTags = (cocktail) =>
  (cocktail.strTags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

// The API has slots for up to 15 ingredients per drink.
export const getIngredients = (cocktail) =>
  Array.from({ length: 15 }, (_, index) => cocktail[`strIngredient${index + 1}`]?.trim()).filter(Boolean);

export const getIngredientsWithMeasures = (cocktail) =>
  Array.from({ length: 15 }, (_, index) => ({
    ingredient: cocktail[`strIngredient${index + 1}`]?.trim(),
    measure: cocktail[`strMeasure${index + 1}`]?.trim()
  })).filter(({ ingredient }) => ingredient);

const getSearchScore = (cocktail, term) => {
  const name = (cocktail.strDrink || '').toLowerCase();
  const normalizedTerm = term.toLowerCase();

  if (name === normalizedTerm) return 100;
  if (name.startsWith(normalizedTerm)) return 90;
  if (name.includes(normalizedTerm)) return 80;
  return 0;
};

export function sortCocktails(cocktails, sortType, term = '') {
  const filteredCocktails = term
    ? cocktails.filter((cocktail) => (cocktail.strDrink || '').toLowerCase().includes(term.toLowerCase()))
    : cocktails;

  return [...filteredCocktails].sort((a, b) => {
    if (term) {
      const scoreDiff = getSearchScore(b, term) - getSearchScore(a, term);
      if (scoreDiff !== 0) return scoreDiff;
    }

    if (sortType === 'ingredients') {
      return getIngredients(b).length - getIngredients(a).length;
    }

    if (sortType === 'alphabetical') {
      return (a.strDrink || '').localeCompare(b.strDrink || '');
    }

    return 0;
  });
}
