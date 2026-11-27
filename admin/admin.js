import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const byId = id => document.getElementById(id);
const login = byId("login");
const dashboard = byId("dashboard");
const kind = byId("kind");
const contentFile = byId("contentFile");
const publishButton = byId("publishButton");
const progress = byId("progress");
const postForm = byId("postForm");
const library = byId("library");
const editor = byId("editor");
const postList = byId("postList");
const pageSize = 8;
const postDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
});
let posts = [];
let page = 1;
let editingPost = null;
let editorDirty = false;
let coverPreviewUrl = null;

function message(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
  element.hidden = !text;
}

function showView(showEditor, focus = true) {
  library.hidden = showEditor;
  editor.hidden = !showEditor;
  if (!focus) return;
  byId(showEditor ? "postHeading" : "libraryHeading").focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function previewCover() {
  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  const file = byId("coverFile").files[0]
    || (kind.value === "image" && !editingPost?.cover_path ? contentFile.files[0] : null);
  coverPreviewUrl = file ? URL.createObjectURL(file) : null;
  const source = coverPreviewUrl || editingPost?.cover_url;
  const preview = byId("currentCover");
  preview.hidden = !source;
  if (source) preview.src = source;
  else preview.removeAttribute("src");
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
  editorDirty = false;
  postForm.reset();
  byId("postHeading").textContent = post ? "Edit post" : "New post";
  publishButton.textContent = post ? "Save changes" : "Publish post";
  byId("publishChoice").hidden = Boolean(post);
  kind.value = post?.kind ?? "pdf";
  kind.disabled = Boolean(post);
  byId("title").value = post?.title ?? "";
  byId("body").value = post?.body ?? "";
  byId("externalUrl").value = post?.external_url ?? "";
  byId("showLatest").checked = post?.show_latest ?? true;
  previewCover();
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
    posts = [];
    postList.replaceChildren();
    showView(false, false);
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
  const refresh = byId("refresh");
  refresh.disabled = true;
  postList.setAttribute("aria-busy", "true");
  try {
    const { data, error } = await supabase.from("posts")
      .select("id,title,kind,status,created_at,published_at,body,external_url,cover_url,cover_path,show_latest")
      .order("created_at", { ascending: false });
    if (error) throw error;
    posts = data;
    renderPosts();
  } catch (error) {
    message(byId("listMessage"), error.message, "error");
  } finally {
    refresh.disabled = false;
    postList.removeAttribute("aria-busy");
  }
}

function renderPosts() {
  const query = byId("postSearch").value.trim().toLocaleLowerCase();
  const type = byId("typeFilter").value;
  const status = byId("statusFilter").value;
  const filtered = posts.filter(post => post.title.toLocaleLowerCase().includes(query)
    && (!type || post.kind === type) && (!status || post.status === status));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, pages);
  const start = (page - 1) * pageSize;
  byId("postCount").textContent = filtered.length
    ? `${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} posts`
    : (posts.length ? "No posts match these filters." : "No posts yet.");
  byId("postPages").hidden = pages === 1;
  byId("pageLabel").textContent = `${page} / ${pages}`;
  byId("prevPage").disabled = page === 1;
  byId("nextPage").disabled = page === pages;
  postList.replaceChildren();
  for (const post of filtered.slice(start, start + pageSize)) {
    const row = document.createElement("article");
    row.className = "post-row";
    const summary = document.createElement("div");
    summary.className = "post-summary";
    const thumbnail = document.createElement("img");
    thumbnail.className = "post-thumb";
    thumbnail.src = post.cover_url || "../a/washim-lab.png";
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.addEventListener("error", () => { thumbnail.src = "../a/washim-lab.png"; }, { once: true });
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = post.title;
    const meta = document.createElement("p");
    meta.textContent = post.kind.toUpperCase();
    const badge = document.createElement("span");
    badge.className = `post-status ${post.status}`;
    badge.textContent = post.status === "published" ? "Published" : "Draft";
    meta.append(" · ", badge);
    details.append(title, meta);
    const publishedAt = post.status === "published" ? post.published_at : null;
    const timestamp = publishedAt || post.created_at;
    const date = timestamp ? new Date(timestamp) : null;
    if (date && Number.isFinite(date.getTime())) {
      const timing = document.createElement("p");
      timing.className = "post-date";
      const time = document.createElement("time");
      time.dateTime = date.toISOString();
      time.textContent = postDateFormat.format(date);
      timing.append(publishedAt ? "Posted " : "Created ", time);
      details.append(timing);
    }
    summary.append(thumbnail, details);
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
      showView(true);
    });
    const toggle = document.createElement("button");
    toggle.className = "quiet";
    toggle.type = "button";
    toggle.textContent = post.status === "published" ? "Unpublish" : "Publish";
    toggle.addEventListener("click", async () => {
      toggle.disabled = true;
      const status = post.status === "published" ? "draft" : "published";
      const publishedAt = status === "published" ? new Date().toISOString() : null;
      try {
        const { error } = await supabase.from("posts").update({
          status, published_at: publishedAt,
        }).eq("id", post.id).select("id").single();
        if (error) throw error;
        post.status = status;
        post.published_at = publishedAt;
        message(byId("listMessage"), status === "published" ? "Post published." : "Post moved to drafts.", "success");
        renderPosts();
      } catch (error) {
        message(byId("listMessage"), error.message, "error");
        toggle.disabled = false;
      }
    });
    actions.append(edit);
    if (post.status === "published") {
      const view = document.createElement("a");
      view.className = "quiet action-link";
      view.href = `../post/?id=${encodeURIComponent(post.id)}`;
      view.target = "_blank";
      view.rel = "noopener";
      view.textContent = "View";
      actions.append(view);
    }
    actions.append(toggle);
    row.append(summary, actions);
    postList.append(row);
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
  byId("postFields").disabled = true;
  byId("cancelEdit").disabled = true;
  byId("signOut").disabled = true;
  postForm.setAttribute("aria-busy", "true");
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
    message(byId("listMessage"), success, "success");
    showView(false);
    await loadPosts();
  } catch (error) {
    for (const [bucket, path] of uploaded) await supabase.storage.from(bucket).remove([path]);
    message(byId("postMessage"), error.message, "error");
  } finally {
    publishButton.disabled = false;
    byId("postFields").disabled = false;
    byId("cancelEdit").disabled = false;
    byId("signOut").disabled = false;
    postForm.removeAttribute("aria-busy");
    progress.hidden = true;
  }
});

kind.addEventListener("change", () => { updateFields(); previewCover(); });
byId("coverFile").addEventListener("change", previewCover);
contentFile.addEventListener("change", previewCover);
postForm.addEventListener("input", () => { editorDirty = true; });
byId("publishNow").addEventListener("change", event => {
  publishButton.textContent = event.target.checked ? "Publish post" : "Save draft";
});
byId("newPost").addEventListener("click", () => { setPostEditor(); showView(true); });
byId("cancelEdit").addEventListener("click", () => {
  if (editorDirty && !confirm("Discard your unsaved changes?")) return;
  setPostEditor();
  showView(false);
});
for (const id of ["postSearch", "typeFilter", "statusFilter"]) {
  byId(id).addEventListener(id === "postSearch" ? "input" : "change", () => {
    page = 1;
    renderPosts();
  });
}
for (const [id, direction] of [["prevPage", -1], ["nextPage", 1]]) {
  byId(id).addEventListener("click", () => {
    page += direction;
    renderPosts();
    byId("postCount").scrollIntoView({ block: "nearest" });
  });
}
byId("refresh").addEventListener("click", loadPosts);
byId("signOut").addEventListener("click", async () => {
  if (editorDirty && !confirm("Sign out and discard unsaved changes?")) return;
  await supabase.auth.signOut();
  await showSession(null);
});
updateFields();
if (!isSupabaseConfigured) byId("setup").hidden = false;
else {
  const { data: { session } } = await supabase.auth.getSession();
  await showSession(session);
}
