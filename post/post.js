import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const content = document.getElementById("content");
const id = new URLSearchParams(location.search).get("id");

function linkButton(text, href) {
  const link = document.createElement("a");
  link.className = "button"; link.textContent = text; link.href = href;
  link.target = "_blank"; link.rel = "noopener";
  return link;
}

if (!isSupabaseConfigured || !id) content.innerHTML = '<p class="error">Post not found.</p>';
else {
  const { data: post, error } = await supabase.from("posts")
    .select("id,title,kind,body,file_url,cover_url,external_url,published_at")
    .eq("id", id).eq("status", "published").maybeSingle();
  if (error || !post) content.innerHTML = '<p class="error">This post is unavailable.</p>';
  else {
    document.title = `${post.title} · Washim Lab`;
    content.replaceChildren();
    const type = document.createElement("div"); type.className = "type"; type.textContent = post.kind;
    const title = document.createElement("h1"); title.textContent = post.title;
    content.append(type, title);
    const imageUrl = post.cover_url || (post.kind === "image" ? post.file_url : null);
    if (imageUrl) {
      const image = document.createElement("img"); image.className = "cover"; image.src = imageUrl; image.alt = "";
      content.append(image);
    }
    if (post.body) {
      const body = document.createElement("div"); body.className = "body"; body.textContent = post.body;
      content.append(body);
    }
    const actions = document.createElement("div"); actions.className = "actions";
    if (post.file_url) actions.append(linkButton(post.kind === "pdf" ? "Open PDF" : "Open image", post.file_url));
    if (post.external_url) actions.append(linkButton("Open link", post.external_url));
    if (post.kind === "prompt" && post.body) {
      const copy = document.createElement("button"); copy.className = "button secondary"; copy.type = "button"; copy.textContent = "Copy prompt";
      copy.addEventListener("click", async () => { await navigator.clipboard.writeText(post.body); copy.textContent = "Copied"; });
      actions.append(copy);
    }
    content.append(actions);
  }
}
