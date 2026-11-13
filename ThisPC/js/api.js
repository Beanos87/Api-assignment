const BASE = 'https://potterapi-fedeperin.vercel.app';
const LANGS = ['en', 'es', 'fr', 'it', 'pt', 'uk'];
const CATS = ['characters', 'spells', 'houses', 'books'];

// params: index | max | page | search
export async function request(lang, cat, params = {}) {
  if (!LANGS.includes(lang)) throw new Error(`Invalid language: ${lang}`);
  if (!CATS.includes(cat)) throw new Error(`Invalid category: ${cat}`);
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  try {
    const res = await fetch(`${BASE}/${lang}/${cat}?${new URLSearchParams(clean)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data === null || typeof data !== 'object') throw new Error('Unexpected response');
    return data;
  } catch (err) {
    throw new Error(`Failed to load ${cat}: ${err.message}`);
  }
}