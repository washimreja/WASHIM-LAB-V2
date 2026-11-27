(async () => {
  const section = document.querySelector('.latest');
  const track = section.querySelector('.latest-track');
  const button = section.querySelector('button');
  const response = await fetch('posts.json', { cache: 'no-cache' });
  if (!response.ok) return;
  const posts = await response.json();
  if (!posts.length) return;

  const TITLE_LIMIT = 32;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const group = document.createElement('div');
  group.className = 'latest-group';
  for (const { title, image, url } of posts) {
    const card = document.createElement('a');
    card.href = url;
    const cover = document.createElement('img');
    cover.src = image;
    cover.alt = '';
    const label = document.createElement('span');
    label.className = 'post-title';
    const characters = Array.from(segmenter.segment(title), part => part.segment);
    if (characters.length > TITLE_LIMIT) {
      const end = document.createElement('i');
      end.textContent = characters.slice(TITLE_LIMIT - 5, TITLE_LIMIT).join('');
      label.append(characters.slice(0, TITLE_LIMIT - 5).join(''), end);
    } else {
      label.textContent = title;
    }
    card.title = title;
    card.setAttribute('aria-label', title);
    card.append(cover, label);
    group.append(card);
  }
  const copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach(link => link.tabIndex = -1);
  track.append(group, copy);
  track.style.animationDuration = (posts.length * 5) + 's';
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function update() {
    section.classList.toggle('paused', paused);
    button.textContent = paused ? 'Play' : 'Pause';
  }
  button.onclick = () => { paused = !paused; update(); };
  update();
  section.hidden = false;
  function checkWrapping() {
    const originals = group.querySelectorAll('.post-title');
    const copies = copy.querySelectorAll('.post-title');
    originals.forEach((label, i) => {
      const clipped = label.scrollHeight > label.clientHeight + 1;
      label.classList.toggle('clipped', clipped);
      copies[i].classList.toggle('clipped', clipped);
    });
  }
  new ResizeObserver(checkWrapping).observe(group);
  document.fonts.ready.then(checkWrapping);
})().catch(console.error);
