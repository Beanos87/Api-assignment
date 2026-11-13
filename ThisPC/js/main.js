import { request } from './api.js';
import { CATS } from './config.js';
import { LANGS, t, filterLabels } from './i18n.js';
import * as store from './storage.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { lang: store.getLang(), cat: 'characters', data: [], f1: '', f2: '', sort: 'idx', q: '', shown: 12, favOnly: false, user: store.getUser(), error: '', loading: false };
const tr = (k) => t(S.lang, k);

let reqId = 0;
async function load() {
  const id = ++reqId; // ignore stale responses when the user switches fast
  S.loading = true; S.error = ''; render();
  try {
    const data = await request(S.lang, S.cat, { search: S.q });
    if (id !== reqId) return;
    S.data = Array.isArray(data) ? data : [data];
  } catch (err) {
    if (id !== reqId) return;
    S.data = []; S.error = err.message;
  } finally {
    if (id === reqId) { S.loading = false; render(); }
  }
}

// Cascading filters: f2 options depend on f1 selection
const cfg = () => CATS[S.cat];
const byF1 = () => S.data.filter((i) => !S.f1 || cfg().f1(i) === S.f1);
const options = (items, fn) => [...new Set(items.map(fn))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

function view() {
  const c = cfg();
  let items = byF1().filter((i) => !S.f2 || c.f2(i) === S.f2);
  if (S.favOnly && S.user) { const favs = store.getFavs(S.user)[S.cat]; items = items.filter((i) => favs.includes(i.index)); }
  if (S.sort !== 'idx') items.sort((a, b) => c.title(a).localeCompare(c.title(b), S.lang) * (S.sort === 'za' ? -1 : 1));
  return items;
}

function fill(sel, first, opts, value) {
  sel.innerHTML = `<option value="">${esc(first)}</option>` + opts.map((o) => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('');
}

function render() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = tr(el.dataset.i18n)));
  document.querySelectorAll('[data-ph]').forEach((el) => (el.placeholder = tr(el.dataset.ph)));
  document.title = tr('title');
  $('lang').innerHTML = Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === S.lang ? 'selected' : ''}>${v}</option>`).join('');
  $('tabs').innerHTML = Object.keys(CATS).map((k) => `<button data-cat="${k}" class="fx px-4 py-2 rounded ${k === S.cat ? 'bg-red-700 text-stone-950' : 'bg-stone-800 hover:bg-stone-700'}">${tr(k)}</button>`).join('');
  const [l1, l2] = filterLabels(S.lang, S.cat);
  fill($('f1'), `${l1}: ${tr('all1')}`, options(S.data, cfg().f1), S.f1);
  fill($('f2'), `${l2}: ${tr('all1')}`, options(byF1(), cfg().f2), S.f2);
  $('sort').innerHTML = [['idx', 'sortIdx'], ['az', 'sortAz'], ['za', 'sortZa']].map(([v, k]) => `<option value="${v}" ${v === S.sort ? 'selected' : ''}>${tr(k)}</option>`).join('');
  $('favOnly').checked = S.favOnly;
  $('userForm').classList.toggle('hidden', !!S.user);
  $('userBox').classList.toggle('hidden', !S.user); $('userBox').classList.toggle('flex', !!S.user);
  $('hello').textContent = `${tr('hello')} ${S.user}`;

  const items = view(), favs = S.user ? store.getFavs(S.user)[S.cat] : [], c = cfg();
  $('status').innerHTML = S.loading ? `<p class="text-red-700">${tr('loading')}</p>`
    : S.error ? `<p class="text-red-400 mb-2">${esc(S.error)}</p><button id="retry" class="bg-red-600 text-stone-950 rounded px-4 py-1">${tr('retry')}</button>`
    : items.length ? '' : `<p class="text-stone-400">${tr('empty')}</p>`;
  $('grid').innerHTML = items.slice(0, S.shown).map((i) => `
    <article class="bg-stone-900 border border-stone-700 rounded-lg overflow-hidden flex flex-col">
      ${c.img(i) ? `<img src="${esc(c.img(i))}" alt="" loading="lazy" class="h-48 w-full object-cover object-top bg-stone-800">` : ''}
      <div class="p-4 flex-1"><h3 class="font-semibold text-lg text-red-700">${esc(c.title(i))}</h3><p class="text-sm text-stone-300 mt-1">${esc(c.sub(i))}</p></div>
      <div class="flex justify-between px-4 pb-3"><button data-detail="${i.index}" class="text-sm underline">${tr('details')}</button>
      <button data-fav="${i.index}" aria-label="favorite" class="text-xl ${favs.includes(i.index) ? 'text-red-500' : 'text-stone-500'}">♥</button></div>
    </article>`).join('');
  $('more').classList.toggle('hidden', items.length <= S.shown);
}

async function showDetail(index) {
  $('modal').classList.replace('hidden', 'flex');
  $('modalBody').textContent = tr('loading');
  try {
    const item = await request(S.lang, S.cat, { index });
    const c = cfg();
    $('modalBody').innerHTML = `${c.img(item) ? `<img src="${esc(c.img(item))}" alt="" class="w-full max-h-64 object-contain mb-3">` : ''}<h2 class="text-xl text-red-300 mb-2">${esc(c.title(item))}</h2>` +
      Object.entries(item).filter(([k]) => !['image', 'cover'].includes(k)).map(([k, v]) => `<p class="text-sm mb-1"><b>${esc(k)}:</b> ${esc(Array.isArray(v) ? v.join(', ') : v)}</p>`).join('');
  } catch (err) { $('modalBody').innerHTML = `<p class="text-red-400">${esc(err.message)}</p>`; }
}

const reset = () => { S.f1 = ''; S.f2 = ''; S.shown = 12; };
let timer;
$('search').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { S.q = e.target.value.trim(); reset(); load(); }, 400); });
$('f1').addEventListener('change', (e) => { S.f1 = e.target.value; S.f2 = ''; S.shown = 12; render(); });
$('f2').addEventListener('change', (e) => { S.f2 = e.target.value; render(); });
$('sort').addEventListener('change', (e) => { S.sort = e.target.value; render(); });
$('favOnly').addEventListener('change', (e) => { S.favOnly = e.target.checked; render(); });
$('lang').addEventListener('change', (e) => { S.lang = e.target.value; store.setLang(S.lang); reset(); load(); });
$('more').addEventListener('click', () => { S.shown += 12; render(); });
$('close').addEventListener('click', () => $('modal').classList.replace('flex', 'hidden'));
$('logout').addEventListener('click', () => { store.setUser(''); S.user = ''; S.favOnly = false; render(); });
$('userForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('userName').value.trim().slice(0, 30);
  if (!name) return;
  store.setUser(name); S.user = name; render();
});
$('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { S.cat = b.dataset.cat; S.data = []; S.q = ''; $('search').value = ''; reset(); load(); } });
$('status').addEventListener('click', (e) => { if (e.target.id === 'retry') load(); });
$('grid').addEventListener('click', (e) => {
  const d = e.target.closest('[data-detail]'), f = e.target.closest('[data-fav]');
  if (d) showDetail(Number(d.dataset.detail));
  if (f) {
    if (!S.user) { alert(tr('needName')); $('userName').focus(); return; }
    try { store.toggleFav(S.user, S.cat, Number(f.dataset.fav)); render(); } catch (err) { S.error = err.message; render(); }
  }
});

load();