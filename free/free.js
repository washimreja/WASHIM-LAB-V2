import { feed } from "./feed.js";
import { postTypes } from "../post-model.js";

const $ = selector => document.querySelector(selector);
const grid = $("#grid");
const search = $("#q");
const more = $("#load-more");
const count = $("#post-count");
const filters = [...document.querySelectorAll(".post-filters button")];
const colours = ["peach", "lilac", "sky", "sage", "butter"];
const pageSize = 12;
const dates = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const { posts, unavailable } = await feed;
let kind = "";
let rendered = 0;
let matches = [];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function poster(post, className, eager = false) {
  const cover = element("div", className);
  cover.append(element("span", "ph d", postTypes[post.kind]));
  if (post.cover) {
    const image = element("img");
    image.alt = "";
    image.loading = eager ? "eager" : "lazy";
    image.addEventListener("error", () => image.remove(), { once: true });
    image.src = post.cover;
    cover.append(image);
  }
  return cover;
}

function card(post, index) {
  const link = element("a", `card c-${colours[index % colours.length]}`);
  link.id = `g-${post.id}`;
  link.href = post.url;
  const meta = element("div", "meta");
  meta.append(element("span", "post-kind", postTypes[post.kind]));
  if (Number.isFinite(Date.parse(post.date))) {
    const date = element("time", "date", dates.format(new Date(post.date)));
    date.dateTime = post.date;
    meta.append(date);
  }
  link.append(poster(post, "cover", index < 3), meta, element("h3", "t", post.title));
  return link;
}

function addPage(moveFocus = false) {
  const next = matches.slice(rendered, rendered + pageSize);
  const cards = next.map((post, index) => card(post, rendered + index));
  grid.append(...cards);
  rendered += cards.length;
  more.hidden = rendered >= matches.length;
  count.textContent = matches.length
    ? `Showing ${rendered} of ${matches.length} posts`
    : (posts.length ? "No posts match these filters." : (unavailable ? "" : "No published posts yet."));
  if (moveFocus) cards[0]?.focus();
}

function filterPosts() {
  const term = search.value.trim().toLowerCase();
  matches = posts.filter(post => (!kind || kind === post.kind) && post.title.toLowerCase().includes(term));
  rendered = 0;
  grid.replaceChildren();
  addPage();
}

function spotlight() {
  const params = new URLSearchParams(location.search);
  const guide = params.get("g") || "";
  const exactId = params.get("f") || (/^[A-Za-z0-9_-]{20,}$/.test(guide) ? guide : null);
  const words = guide.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const selected = posts.find(post => post.kind === "pdf" && post.file && (exactId
    ? post.id === exactId
    : words.length && words.every(word => post.title.toLowerCase().includes(word))));
  if (!selected) return;
  const box = $("#spot");
  const coverLink = element("a", "sp-cover");
  coverLink.href = selected.file;
  coverLink.setAttribute("aria-label", `Open PDF: ${selected.title}`);
  coverLink.append(poster(selected, "spot-poster", true));
  const details = element("div", "sp-txt");
  const download = element("a", "btn yellow big", "Open the PDF");
  download.href = selected.file;
  for (const link of [coverLink, download]) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  details.append(element("div", "k", "Your free guide"), element("h2", "d", selected.title), download);
  box.append(coverLink, details);
  box.hidden = false;
  document.body.classList.add("has-spot");
}

search.addEventListener("input", filterPosts);
more.addEventListener("click", () => addPage(true));
filters.forEach(button => button.addEventListener("click", () => {
  kind = button.dataset.kind;
  filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
  filterPosts();
}));
$("#fallback").hidden = !unavailable;
spotlight();
filterPosts();
