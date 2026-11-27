import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const $ = selector => document.querySelector(selector);
const grid = $("#grid");
const search = $("#q");
const colours = ["peach", "lilac", "sky", "sage", "butter"];
let items = [];

const tidy = name => name.replace(/\.pdf$/i, "").replace(/\s*\(\d+\)$/, "").replace(/_+/g, " ").replace(/\s+-\s+|\s*-\s*(?=[A-Z])/g, " – ").replace(/\s{2,}/g, " ").trim();
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
const formatDate = value => new Date(value).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

function card(item, index) {
  const title = tidy(item.name);
  const isNew = (Date.now() - new Date(item.createdTime)) / 864e5 < 14;
  return `<a class="card c-${colours[index % colours.length]}" id="g-${escapeHtml(item.id)}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
    <div class="cover"><span class="ph d">${escapeHtml(title)}</span>${item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="${index < 6 ? "eager" : "lazy"}">` : ""}</div>
    <div class="meta">${isNew ? '<span class="new">New</span>' : ""}<span class="date">${formatDate(item.createdTime)}</span></div>
    <h3 class="t">${escapeHtml(title)}</h3><span class="go">Open PDF</span></a>`;
}

function render() {
  const term = (search.value || "").trim().toLowerCase();
  const visible = term ? items.filter(item => tidy(item.name).toLowerCase().includes(term)) : items;
  grid.innerHTML = visible.map(card).join("");
  grid.querySelectorAll(".cover img").forEach(image => {
    const remove = () => image.remove();
    if (image.complete && !image.naturalWidth) remove();
    else image.addEventListener("error", remove, { once:true });
  });
  $("#empty").hidden = visible.length > 0 || !term;
}

async function legacyGuides() {
  const response = await fetch("catalog.json", { cache:"no-store" });
  if (!response.ok) throw new Error("Static catalog unavailable");
  const data = await response.json();
  return (data.files || []).filter(file => file?.id && typeof file.name === "string").map(file => ({
    id:file.id, name:file.name, createdTime:file.createdTime,
    url:`pdf/${encodeURIComponent(file.id)}.pdf`, image:`cover/${encodeURIComponent(file.id)}.jpg`,
  }));
}

async function dynamicGuides() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("posts")
    .select("id,legacy_id,title,file_url,cover_url,published_at,created_at")
    .eq("status", "published").eq("kind", "pdf").order("published_at", { ascending:false });
  if (error) throw error;
  return data.filter(post => post.file_url).map(post => ({
    id:post.legacy_id || post.id, name:post.title,
    createdTime:post.published_at || post.created_at, url:post.file_url, image:post.cover_url,
  }));
}

function spotlight() {
  const parameters = new URLSearchParams(location.search);
  const guide = parameters.get("g") || "";
  const exactId = parameters.get("f") || (/^[A-Za-z0-9_-]{20,}$/.test(guide) ? guide : null);
  const words = exactId ? [] : guide.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  const selected = exactId ? items.find(item => item.id === exactId) : items.find(item => words.length && words.every(word => item.name.toLowerCase().includes(word)));
  const box = $("#spot");
  if (!selected) { box.hidden = true; return; }
  const title = tidy(selected.name);
  box.innerHTML = `<a class="sp-cover" href="${escapeHtml(selected.url)}" target="_blank" rel="noopener"><span class="ph d">${escapeHtml(title)}</span>${selected.image ? `<img src="${escapeHtml(selected.image)}" alt="">` : ""}</a>
    <div class="sp-txt"><div class="k">Your free guide</div><h2 class="d">${escapeHtml(title)}</h2><a class="btn yellow big" href="${escapeHtml(selected.url)}" target="_blank" rel="noopener">Open the PDF</a><p>Opens in your browser. Use the share or download button there to save it.</p></div>`;
  box.querySelector("img")?.addEventListener("error", event => event.currentTarget.remove(), { once:true });
  box.hidden = false; $("#moreK").hidden = false; document.body.classList.add("has-spot");
  items = items.filter(item => item !== selected);
}

async function load() {
  const [legacyResult, dynamicResult] = await Promise.allSettled([legacyGuides(), dynamicGuides()]);
  const legacy = legacyResult.status === "fulfilled" ? legacyResult.value : [];
  const dynamic = dynamicResult.status === "fulfilled" ? dynamicResult.value : [];
  const dynamicIds = new Set(dynamic.map(item => item.id));
  items = [...dynamic, ...legacy.filter(item => !dynamicIds.has(item.id))];
  if (!items.length) { grid.innerHTML = ""; $("#fallback").hidden = false; return; }
  spotlight(); $("#searchWrap").hidden = items.length < 7; render();
}

search.addEventListener("input", render);
load();
