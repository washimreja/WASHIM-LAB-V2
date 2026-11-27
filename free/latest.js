import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const section = document.querySelector(".latest");
const track = section.querySelector(".latest-track");
const button = section.querySelector("button");
const segmenter = new Intl.Segmenter(undefined, { granularity:"grapheme" });

async function staticPosts() {
  const response = await fetch("posts.json", { cache:"no-cache" });
  return response.ok ? response.json() : [];
}

async function dynamicPosts() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("posts")
    .select("id,title,kind,cover_url,file_url,published_at")
    .eq("status", "published").eq("show_latest", true)
    .order("published_at", { ascending:false }).limit(20);
  if (error) throw error;
  return data.map(post => ({ title:post.title,
    image:post.cover_url || (post.kind === "image" ? post.file_url : "../a/washim-lab.png"),
    url:`../post/?id=${encodeURIComponent(post.id)}` }));
}

function createGroup(posts) {
  const group = document.createElement("div"); group.className = "latest-group";
  for (const { title, image, url } of posts) {
    const card = document.createElement("a"); card.href = url; card.title = title; card.setAttribute("aria-label", title);
    const cover = document.createElement("img"); cover.src = image; cover.alt = "";
    const label = document.createElement("span"); label.className = "post-title";
    const characters = Array.from(segmenter.segment(title), part => part.segment);
    if (characters.length > 32) {
      const end = document.createElement("i"); end.textContent = characters.slice(27, 32).join("");
      label.append(characters.slice(0, 27).join(""), end);
    } else label.textContent = title;
    card.append(cover, label); group.append(card);
  }
  return group;
}

const [staticResult, dynamicResult] = await Promise.allSettled([staticPosts(), dynamicPosts()]);
const posts = [
  ...(dynamicResult.status === "fulfilled" ? dynamicResult.value : []),
  ...(staticResult.status === "fulfilled" ? staticResult.value : []),
];
if (posts.length) {
  const group = createGroup(posts); const copy = group.cloneNode(true);
  copy.setAttribute("aria-hidden", "true"); copy.querySelectorAll("a").forEach(link => { link.tabIndex = -1; });
  track.append(group, copy); track.style.animationDuration = `${posts.length * 5}s`;
  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const update = () => { section.classList.toggle("paused", paused); button.textContent = paused ? "Play" : "Pause"; };
  button.addEventListener("click", () => { paused = !paused; update(); }); update(); section.hidden = false;
  const check = () => {
    const originals = group.querySelectorAll(".post-title"); const copies = copy.querySelectorAll(".post-title");
    originals.forEach((label, index) => { const clipped = label.scrollHeight > label.clientHeight + 1; label.classList.toggle("clipped", clipped); copies[index].classList.toggle("clipped", clipped); });
  };
  new ResizeObserver(check).observe(group); document.fonts.ready.then(check);
}
