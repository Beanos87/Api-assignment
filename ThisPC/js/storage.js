const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
const empty = () => ({ characters: [], spells: [], houses: [], books: [] });

export const getUser = () => safe(() => localStorage.getItem('hp_user') || '', '');
export const setUser = (n) => safe(() => (n ? localStorage.setItem('hp_user', n) : localStorage.removeItem('hp_user')));
export const getLang = () => safe(() => localStorage.getItem('hp_lang') || 'en', 'en');
export const setLang = (l) => safe(() => localStorage.setItem('hp_lang', l));

export function getFavs(user) {
  const data = safe(() => JSON.parse(localStorage.getItem(`hp_fav_${user}`)), null);
  return { ...empty(), ...(data && typeof data === 'object' ? data : {}) };
}
export function toggleFav(user, cat, index) {
  if (!user) throw new Error('No user');
  const favs = getFavs(user);
  const set = new Set(favs[cat]);
  set.has(index) ? set.delete(index) : set.add(index);
  favs[cat] = [...set];
  localStorage.setItem(`hp_fav_${user}`, JSON.stringify(favs));
  return favs;
}