const year = (d) => String(d || '').match(/\d{4}/)?.[0] || '?';
const pages = (n) => (n < 300 ? '< 300' : n < 500 ? '300–499' : '500+');

export const CATS = {
  characters: {
    title: (i) => i.fullName, sub: (i) => i.hogwartsHouse || '', img: (i) => i.image,
    f1: (i) => i.hogwartsHouse || '—', f2: (i) => String(i.children?.length || 0)
  },
  spells: {
    title: (i) => i.spell, sub: (i) => i.use, img: () => '',
    f1: (i) => (i.spell || '?')[0].toUpperCase(), f2: (i) => String((i.spell || '').trim().split(/\s+/).length)
  },
  houses: {
    title: (i) => `${i.emoji || ''} ${i.house}`, sub: (i) => i.founder, img: () => '',
    f1: (i) => i.animal, f2: (i) => i.colors?.[0] || '—'
  },
  books: {
    title: (i) => i.title, sub: (i) => i.releaseDate, img: (i) => i.cover,
    f1: (i) => year(i.releaseDate), f2: (i) => pages(i.pages)
  }
};