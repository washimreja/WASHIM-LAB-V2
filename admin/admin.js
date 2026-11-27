import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const byId = id => document.getElementById(id);
const login = byId("login");
const dashboard = byId("dashboard");
const kind = byId("kind");
const contentFile = byId("contentFile");
const publishButton = byId("publishButton");
const progress = byId("progress");
const postForm = byId("postForm");
let editingPost = null;

function message(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function updateFields() {
  const hasFile = ["pdf", "image"].includes(kind.value);
  byId("fileField").hidden = !hasFile;
  contentFile.required = hasFile && !editingPost;
  contentFile.accept = kind.value === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp";
  const fileLabel = kind.value === "pdf" ? "PDF file" : "Image file";
  byId("fileField").childNodes[0].textContent = editingPost ? `Replace ${fileLabel} (optional)` : fileLabel;
  byId("linkField").hidden = kind.value !== "link";
  byId("externalUrl").required = kind.value === "link";
  byId("bodyField").childNodes[0].textContent = kind.value === "prompt" ? "Prompt text" : "Description or prompt";
}

function setPostEditor(post = null) {
  editingPost = post;
  postForm.reset();
  byId("postHeading").textContent = post ? "Edit post" : "New post";
  publishButton.textContent = post ? "Save changes" : "Publish post";
  byId("cancelEdit").hidden = !post;
  byId("publishChoice").hidden = Boolean(post);
  kind.value = post?.kind ?? "pdf";
  kind.disabled = Boolean(post);
  byId("title").value = post?.title ?? "";
  byId("body").value = post?.body ?? "";
  byId("externalUrl").value = post?.external_url ?? "";
  byId("showLatest").checked = post?.show_latest ?? true;
  const preview = byId("currentCover");
  preview.hidden = !post?.cover_url;
  if (post?.cover_url) preview.src = post.cover_url;
  else preview.removeAttribute("src");
  byId("coverHint").hidden = !post;
  byId("coverHint").textContent = post?.cover_url
    ? "Choose a new image to replace the current cover."
    : "Choose an image to add a cover.";
  message(byId("postMessage"), "");
  updateFields();
}

async function upload(bucket, file, userId) {
  const path = `${userId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function isAdmin() {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

async function showSession(session) {
  if (!session) {
    setPostEditor();
    login.hidden = false;
    dashboard.hidden = true;
    byId("signOut").hidden = true;
    return;
  }
  try {
    if (!(await isAdmin())) {
      await supabase.auth.signOut();
      message(byId("loginMessage"), "Ei account admin list-e nei.", "error");
      login.hidden = false;
      return;
    }
    login.hidden = true;
    dashboard.hidden = false;
    byId("signOut").hidden = false;
    await loadPosts();
  } catch (error) {
    message(byId("loginMessage"), error.message, "error");
    login.hidden = false;
  }
}

async function loadPosts() {
  const list = byId("postList");
  list.textContent = "Loading…";
  const { data, error } = await supabase.from("posts")
    .select("id,title,kind,status,created_at,body,external_url,cover_url,cover_path,show_latest")
    .order("created_at", { ascending: false });
  if (error) { list.textContent = error.message; return; }
  list.replaceChildren();
  if (!data.length) { list.textContent = "No posts yet."; return; }
  for (const post of data) {
    const row = document.createElement("article");
    row.className = "post-row";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = post.title;
    const meta = document.createElement("p");
    meta.textContent = `${post.kind.toUpperCase()} · ${post.status}`;
    details.append(title, meta);
    const actions = document.createElement("div");
    actions.className = "post-actions";
    const edit = document.createElement("button");
    edit.className = "quiet";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", `Edit ${post.title}`);
    edit.addEventListener("click", () => {
      if (publishButton.disabled) return;
      setPostEditor(post);
      byId("title").focus({ preventScroll: true });
      byId("postHeading").scrollIntoView({ block: "start" });
    });
    const toggle = document.createElement("button");
    toggle.className = "quiet";
    toggle.type = "button";
    toggle.textContent = post.status === "published" ? "Unpublish" : "Publish";
    toggle.addEventListener("click", async () => {
      toggle.disabled = true;
      const status = post.status === "published" ? "draft" : "published";
      const { error: updateError } = await supabase.from("posts").update({
        status, published_at: status === "published" ? new Date().toISOString() : null,
      }).eq("id", post.id);
      if (updateError) alert(updateError.message);
      await loadPosts();
    });
    actions.append(edit, toggle);
    row.append(details, actions);
    list.append(row);
  }
}

byId("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  message(byId("loginMessage"), "Logging in…");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: byId("email").value.trim(), password: byId("password").value,
  });
  if (error) { message(byId("loginMessage"), error.message, "error"); return; }
  message(byId("loginMessage"), "");
  await showSession(data.session);
});

postForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (publishButton.disabled) return;
  const post = editingPost;
  const postId = post?.id;
  const fields = {
    title: byId("title").value.trim(),
    body: byId("body").value.trim(),
    ...(kind.value === "link" ? { external_url: byId("externalUrl").value.trim() } : {}),
    show_latest: byId("showLatest").checked,
  };
  const postKind = kind.value;
  const publishNow = byId("publishNow").checked;
  const selectedFile = byId("fileField").hidden ? null : contentFile.files[0];
  const selectedCover = byId("coverFile").files[0];
  publishButton.disabled = true;
  postForm.inert = true;
  progress.hidden = false;
  progress.value = 10;
  message(byId("postMessage"), postId ? "Saving changes…" : "Uploading…");
  const uploaded = [];
  try {
    if (!fields.title) throw new Error("Enter a title.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin())) throw new Error("Admin session expired. Log in again.");
    let file = null;
    let cover = null;
    if (selectedFile) {
      file = await upload("guide-files", selectedFile, user.id);
      uploaded.push(["guide-files", file.path]);
    }
    progress.value = 48;
    if (selectedCover) {
      cover = await upload("guide-covers", selectedCover, user.id);
      uploaded.push(["guide-covers", cover.path]);
    } else if (postKind === "image" && file && !post?.cover_path) cover = file;
    progress.value = 76;
    const posts = supabase.from("posts");
    const request = postId
      ? posts.update({
          ...fields,
          ...(file ? { file_url: file.url, file_path: file.path } : {}),
          ...(cover ? { cover_url: cover.url, cover_path: selectedCover ? cover.path : null } : {}),
        }).eq("id", postId).select("id").single()
      : posts.insert({
          ...fields,
          kind: postKind,
          file_url: file?.url ?? null,
          file_path: file?.path ?? null,
          cover_url: cover?.url ?? null,
          cover_path: selectedCover ? cover.path : null,
          status: publishNow ? "published" : "draft",
          published_at: publishNow ? new Date().toISOString() : null,
          created_by: user.id,
        });
    const { error } = await request;
    if (error) throw error;
    uploaded.length = 0;
    progress.value = 100;
    setPostEditor();
    const success = postId ? "Changes saved." : (publishNow ? "Published successfully." : "Draft saved.");
    message(byId("postMessage"), success, "success");
    await loadPosts();
  } catch (error) {
    for (const [bucket, path] of uploaded) await supabase.storage.from(bucket).remove([path]);
    message(byId("postMessage"), error.message, "error");
  } finally {
    publishButton.disabled = false;
    postForm.inert = false;
    progress.hidden = true;
  }
});

kind.addEventListener("change", updateFields);
byId("cancelEdit").addEventListener("click", () => setPostEditor());
byId("refresh").addEventListener("click", loadPosts);
byId("signOut").addEventListener("click", async () => { await supabase.auth.signOut(); await showSession(null); });
updateFields();
if (!isSupabaseConfigured) byId("setup").hidden = false;
else {
  const { data: { session } } = await supabase.auth.getSession();
  await showSession(session);
}
