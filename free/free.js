(() => {
  const $ = s => document.querySelector(s);
  const grid = $('#grid'), empty = $('#empty'), fallback = $('#fallback'), q = $('#q');
  const COLOURS = ['peach', 'lilac', 'sky', 'sage', 'butter'];
  const NEW_DAYS = 14;
  const tidy = name => name.replace(/\.pdf$/i, '').replace(/\s*\(\d+\)$/, '').replace(/[_]+/g, ' ').replace(/\s+-\s+|\s*-\s*(?=[A-Z])/g, ' – ').replace(/\s{2,}/g, ' ').trim();
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let items = [];

  const card = (f, i) => {
    const title = tidy(f.name);
    const isNew = (Date.now() - new Date(f.createdTime)) / 864e5 < NEW_DAYS;
    const open = `pdf/${encodeURIComponent(f.id)}.pdf`;
    const thumb = `cover/${encodeURIComponent(f.id)}.jpg`;
    return `<a class="card c-${COLOURS[i % COLOURS.length]}" id="g-${esc(f.id)}" href="${esc(open)}" target="_blank" rel="noopener">
      <div class="cover"><span class="ph d">${esc(title)}</span><img src="${esc(thumb)}" alt="" loading="${i < 6 ? 'eager' : 'lazy'}"></div>
      <div class="meta">${isNew ? '<span class="new">New</span>' : ''}<span class="date">${fmtDate(f.createdTime)}</span></div>
      <h3 class="t">${esc(title)}</h3>
      <span class="go">Open PDF <span aria-hidden="true">↗</span></span>
    </a>`;
  };

  const render = () => {
    const term = (q.value || '').trim().toLowerCase();
    const list = term ? items.filter(f => tidy(f.name).toLowerCase().includes(term)) : items;
    grid.innerHTML = list.map(card).join('');
    grid.querySelectorAll('.cover img').forEach(img => {
      const bad = () => img.remove();
      if (img.complete && !img.naturalWidth) bad(); else img.addEventListener('error', bad, { once: true });
    });
    empty.hidden = list.length > 0 || !term;
  };
  const params0 = new URLSearchParams(location.search);
  const g = params0.get('g') || '';
  const isId = s => /^[A-Za-z0-9_-]{20,}$/.test(s);
  let spot = params0.get('f') || (isId(g) ? g : null);
  const want = spot ? '' : g.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const pick = () => {
    if (!spot && want) {
      const words = want.split(' ');
      const hit = items.find(f => { const n = f.name.toLowerCase().replace(/[^a-z0-9]+/g, ' '); return words.every(w => n.includes(w)); });
      if (hit) spot = hit.id;
    }
    const box = $('#spot');
    if (!spot) { box.hidden = true; return; }
    const f = items.find(x => x.id === spot);
    if (!f) { box.hidden = true; return; }
    const title = tidy(f.name), open = `pdf/${encodeURIComponent(f.id)}.pdf`;
    box.innerHTML = `<a class="sp-cover" href="${esc(open)}" target="_blank" rel="noopener"><span class="ph d">${esc(title)}</span><img src="cover/${encodeURIComponent(f.id)}.jpg" alt=""></a>
      <div class="sp-txt"><div class="k">Your free guide</div><h2 class="d">${esc(title)}</h2>
      <a class="btn yellow big" href="${esc(open)}" target="_blank" rel="noopener">Open the PDF <span aria-hidden="true">↗</span></a>
      <p>Opens in your browser. Use the share or download button there to save it.</p></div>`;
    const img = box.querySelector('img'); img.addEventListener('error', () => img.remove(), { once: true });
    box.hidden = false; $('#moreK').hidden = false; document.body.classList.add('has-spot');
    items = items.filter(x => x.id !== f.id);
  };

  const fail = why => {
    grid.innerHTML = ''; fallback.hidden = false;
  };

  const load = async () => {
    try {
      const r = await fetch('catalog.json', { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return fail(j.error || `${r.status}: request failed`);
      items = (j.files || []).filter(f => f && /^[A-Za-z0-9_-]{10,}$/.test(f.id) && typeof f.name === 'string');
      done();
    } catch (e) { fail('temporarily unavailable'); }
  };

  const done = () => {
    pick();
    $('#searchWrap').hidden = items.length < 7;
    render();
    if (!items.length && $('#spot').hidden) fail();
    if (!items.length) $('#moreK').hidden = true;
  };

  q.addEventListener('input', render);
  load();
})();
