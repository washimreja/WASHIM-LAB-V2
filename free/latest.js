import { feed } from "./feed.js";

const { posts } = await feed;
const latest = posts.filter(post => post.latest).slice(0, 10);
if (latest.length) mountCarousel(latest);

function mountCarousel(posts) {
  const section = document.querySelector(".latest");
  const viewport = section.querySelector(".latest-window");
  const track = section.querySelector(".latest-track");
  const button = section.querySelector(".motion-toggle");
  const group = document.createElement("div");
  group.className = "latest-group";
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  for (const post of posts) {
    const card = document.createElement("a");
    card.href = post.url;
    card.title = post.title;
    card.setAttribute("aria-label", post.title);
    const image = document.createElement("img");
    image.alt = "";
    image.addEventListener("error", () => { image.src = "/a/washim-lab.png"; }, { once: true });
    image.src = post.cover || "/a/washim-lab.png";
    const title = document.createElement("span");
    title.className = "post-title";
    const chars = segmenter ? Array.from(segmenter.segment(post.title), part => part.segment) : Array.from(post.title);
    if (chars.length > 32) {
      const fade = document.createElement("i");
      fade.textContent = chars.slice(27, 32).join("");
      title.append(chars.slice(0, 27).join(""), fade);
    } else title.textContent = post.title;
    card.append(image, title);
    group.append(card);
  }
  const copy = group.cloneNode(true);
  copy.setAttribute("aria-hidden", "true");
  copy.querySelectorAll("a").forEach(link => { link.tabIndex = -1; });
  copy.querySelectorAll("img").forEach(image => image.addEventListener("error",
    () => { image.src = "/a/washim-lab.png"; }, { once: true }));
  track.append(group, copy);
  section.hidden = false;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = motion.matches;
  let visible = true;
  let hovered = false;
  let cycle = 0;
  let frame = 0;
  let lastTime = 0;
  let position = 0;

  function step(now) {
    const elapsed = lastTime ? Math.min(now - lastTime, 50) : 0;
    lastTime = now;
    position = (position + elapsed * 0.042) % cycle;
    viewport.scrollLeft = position;
    frame = requestAnimationFrame(step);
  }

  function sync() {
    button.textContent = paused ? "Play" : "Pause";
    if (!cycle || paused || hovered || !visible || document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (!frame) {
      position = viewport.scrollLeft % cycle;
      lastTime = 0;
      frame = requestAnimationFrame(step);
    }
  }

  function measure() {
    const width = group.getBoundingClientRect().width;
    cycle = width - 12 > viewport.clientWidth && posts.length > 1 ? width : 0;
    copy.hidden = !cycle;
    button.hidden = !cycle;
    if (cycle) position = viewport.scrollLeft % cycle;
    sync();
  }

  function pause() { paused = true; sync(); }
  button.addEventListener("click", () => { paused = !paused; sync(); });
  viewport.addEventListener("pointerdown", pause, { passive: true });
  viewport.addEventListener("wheel", event => { if (event.deltaX || event.shiftKey) pause(); }, { passive: true });
  viewport.addEventListener("focusin", pause);
  viewport.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") { hovered = true; sync(); }
  });
  viewport.addEventListener("pointerleave", () => { hovered = false; sync(); });
  motion.addEventListener("change", event => { paused = event.matches; sync(); });
  document.addEventListener("visibilitychange", sync);
  const resize = new ResizeObserver(measure);
  resize.observe(viewport);
  resize.observe(group);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(viewport);
  }
  measure();
}
