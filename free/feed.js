import { supabase } from "../supabase-client.js";
import { postCover, postDetail, webUrl } from "../post-model.js";
import { useStaticCatalog } from "./legacy-mode.js";

async function fromDatabase() {
  if (!supabase) return [];
  const posts = [];
  const batch = 200;
  for (let start = 0; ; start += batch) {
    const { data, error } = await supabase.from("posts")
      .select("id,legacy_id,title,kind,file_url,cover_url,published_at,created_at,show_latest")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true }).range(start, start + batch - 1);
    if (error) throw error;
    posts.push(...data);
    if (data.length < batch) break;
  }
  return posts.map(post => ({
    id: post.legacy_id || post.id,
    title: post.title, kind: post.kind, date: post.published_at || post.created_at,
    file: webUrl(post.file_url), cover: postCover(post),
    url: postDetail(post.id), latest: post.show_latest,
  }));
}

async function readJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function fromStaticCatalog() {
  if (!(await useStaticCatalog)) return [];
  const [{ files }, featured] = await Promise.all([
    readJSON("catalog.json"), readJSON("posts.json").catch(() => []),
  ]);
  const latestUrls = new Set(featured.map(post => post.url));
  return files.map(file => {
    const path = `pdf/${encodeURIComponent(file.id)}.pdf`;
    const url = new URL(path, location.href).href;
    return {
      id: file.id, kind: "pdf", date: file.createdTime, file: url, url,
      title: file.name.replace(/\.pdf$/i, "").replace(/\s*\(\d+\)$/, "")
        .replace(/_+/g, " ").replace(/\s+-\s+|\s*-\s*(?=[A-Z])/g, " – ").replace(/\s{2,}/g, " ").trim(),
      cover: new URL(`cover/${encodeURIComponent(file.id)}.jpg`, location.href).href,
      latest: latestUrls.has(path),
    };
  });
}

export const feed = (async () => {
  const [database, legacy] = await Promise.allSettled([fromDatabase(), fromStaticCatalog()]);
  const posts = new Map();
  for (const result of [legacy, database]) {
    if (result.status === "fulfilled") {
      for (const post of result.value) posts.set(post.id, post);
    }
  }
  return {
    posts: [...posts.values()].sort((a, b) =>
      (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.id.localeCompare(b.id)),
    unavailable: database.status === "rejected" || legacy.status === "rejected",
  };
})();
