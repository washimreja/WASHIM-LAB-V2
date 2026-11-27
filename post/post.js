import { supabase } from "../supabase-client.js";
import { postCover, postDetail, postTypes, webUrl } from "../post-model.js";

const content = document.getElementById("content");
const id = new URLSearchParams(location.search).get("id");
const relatedHeadings = {
  pdf: "Related guides", prompt: "Related prompts", image: "Related images", link: "Related links",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function externalButton(text, href) {
  const link = element("a", "button", text);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  return link;
}

function renderPost(post) {
  document.title = `${post.title} · Washim Lab`;
  content.replaceChildren(element("div", "type", postTypes[post.kind]), element("h1", "", post.title));

  const file = webUrl(post.file_url);
  const external = webUrl(post.external_url);
  const preview = post.kind === "image" ? file || postCover(post) : postCover(post);
  if (preview) {
    const image = element("img", `cover ${post.kind === "image" ? "original-image" : ""}`);
    image.alt = post.kind === "image" ? post.title : "";
    image.addEventListener("error", () => image.remove(), { once: true });
    image.src = preview;
    content.append(image);
  }
  if (post.body) content.append(element("div", "body", post.body));

  const actions = element("div", "actions");
  if (file) actions.append(externalButton(post.kind === "pdf" ? "Open PDF" : "Open full image", file));
  if (external) actions.append(externalButton("Open link", external));
  if (post.kind === "prompt" && post.body) {
    const copy = element("button", "button", "Copy prompt");
    copy.type = "button";
    const status = element("span", "copy-status");
    status.setAttribute("role", "status");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(post.body);
        status.textContent = "Prompt copied.";
      } catch {
        status.textContent = "Copy unavailable. Select the prompt text to copy it.";
      }
    });
    actions.append(copy, status);
  }
  if (actions.childElementCount) content.append(actions);
}

async function relatedPosts(post) {
  function recent() {
    return supabase.from("posts").select("id,title,kind,cover_url,file_url")
      .eq("status", "published").neq("id", post.id)
      .order("published_at", { ascending: false, nullsFirst: false }).limit(3);
  }
  const same = await recent().eq("kind", post.kind);
  if (same.error) return;
  const result = same.data.length ? same : await recent();
  if (result.error || !result.data.length) return;
  const section = document.getElementById("related");
  const grid = section.querySelector(".related-grid");
  section.querySelector("h2").textContent = same.data.length ? relatedHeadings[post.kind] : "More from Washim Lab";
  for (const other of result.data) {
    const card = element("a", "related-card");
    card.href = postDetail(other.id);
    const image = element("img");
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("error", () => { image.src = "/a/washim-lab.png"; }, { once: true });
    image.src = postCover(other) || "/a/washim-lab.png";
    card.append(image, element("span", "", other.title));
    grid.append(card);
  }
  section.hidden = false;
}

if (!supabase || !id) content.replaceChildren(element("p", "error", "Post not found."));
else {
  const { data: post, error } = await supabase.from("posts")
    .select("id,title,kind,body,file_url,cover_url,external_url")
    .eq("id", id).eq("status", "published").maybeSingle();
  if (error || !post) content.replaceChildren(element("p", "error", "This post is unavailable."));
  else {
    renderPost(post);
    await relatedPosts(post);
  }
}
