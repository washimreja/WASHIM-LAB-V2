(() => {
  const $ = s => document.querySelector(s);
  const box = $('#events'), feat = $('#featured'), empty = $('#empty');
  const lb = $('#lb'), lbImg = $('#lbImg'), lbC = $('#lbC');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = (id, w) => /^[a-f0-9]{24}$/.test(id) ? `photos/${id}-${w}.jpg` : '';
  const when = d => { if (!d) return ''; const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day || 1).toLocaleDateString('en-US', day ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'long', year: 'numeric' }); };
  let list = [], at = 0;

  const show = i => { at = (i + list.length) % list.length; const b = list[at]; lbImg.src = b.dataset.full; lbC.textContent = b.dataset.cap || ''; };
  const open = b => { list = [...document.querySelectorAll('.t')]; lb.hidden = false; document.body.style.overflow = 'hidden'; show(list.indexOf(b)); };
  const close = () => { lb.hidden = true; lbImg.removeAttribute('src'); document.body.style.overflow = ''; };
  $('#lbX').addEventListener('click', close);
  $('#lbP').addEventListener('click', e => { e.stopPropagation(); show(at - 1); });
  $('#lbN').addEventListener('click', e => { e.stopPropagation(); show(at + 1); });
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); x0 = null; }, { passive: true });
  document.addEventListener('click', e => { const b = e.target.closest('.t'); if (b) open(b); });

  const event = (ev, cls) => `<article class="ev ${cls}">
      <header>${cls ? '<div class="k">Featured</div>' : ''}<h2 class="d">${esc(ev.title)}</h2>${ev.caption ? `<p>${esc(ev.caption)}</p>` : ''}</header>
      <div class="ph">${ev.photos.map((ph, k) => `<button type="button" class="t" data-full="${esc(src(ph.id, 1600))}" data-cap="${esc(ev.title)} · ${k + 1}/${ev.photos.length}" aria-label="Open photo ${k + 1} of ${ev.photos.length}"><img src="${esc(src(ph.id, 800))}" alt="" loading="lazy" width="${+ph.w || 1}" height="${+ph.h || 1}" style="aspect-ratio:${+ph.w || 1}/${+ph.h || 1}"></button>`).join('')}</div>
    </article>`;

  const tile = (ph, cap) => `<button type="button" class="t" data-full="${esc(src(ph.id, 1600))}" data-cap="${esc(cap)}" aria-label="Open photo"><img src="${esc(src(ph.id, 800))}" alt="" loading="lazy" width="${+ph.w || 1}" height="${+ph.h || 1}" style="aspect-ratio:${+ph.w || 1}/${+ph.h || 1}"></button>`;

  fetch('catalog.json', { cache: 'no-store' }).then(r => r.json()).then(j => {
    const evs = j.events || [];
    feat.insertAdjacentHTML('beforeend', evs.filter(e => e.pinned).map(e => event(e, 'pin')).join(''));
    const photos = evs.filter(e => !e.pinned).flatMap(e => e.photos);
    box.innerHTML = photos.length ? `<div class="ph">${photos.map((ph, k) => tile(ph, `${k + 1} / ${photos.length}`)).join('')}</div>` : '';
    empty.hidden = photos.length > 0;
    document.querySelector('.evs-k').hidden = !evs.some(e => e.pinned) && !photos.length;
  }).catch(() => { box.innerHTML = ''; empty.hidden = false; });
})();
