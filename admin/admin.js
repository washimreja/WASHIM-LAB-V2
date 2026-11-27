import { isSupabaseConfigured, supabase } from "../supabase-client.js";

const byId = id => document.getElementById(id);
const login = byId("login");
const dashboard = byId("dashboard");
const kind = byId("kind");
const contentFile = byId("contentFile");
const publishButton = byId("publishButton");
const progress = byId("progress");

function message(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function updateFields() {
  const needsFile = ["pdf", "image"].includes(kind.value);
  byId("fileField").hidden = !needsFile;
  contentFile.required = needsFile;
  contentFile.accept = kind.value === "pdf" ? "application/pdf" : "image/jpeg,image/png,image/webp";
  byId("fileField").childNodes[0].textContent = kind.value === "pdf" ? "PDF file" : "Image file";
  byId("linkField").hidden = kind.value !== "link";
  byId("externalUrl").required = kind.value === "link";
  byId("bodyField").childNodes[0].textContent = kind.value === "prompt" ? "Prompt text" : "Description or prompt";
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
    .select("id,title,kind,status,created_at").order("created_at", { ascending: false });
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
    row.append(details, toggle);
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

byId("postForm").addEventListener("submit", async event => {
  event.preventDefault();
  publishButton.disabled = true;
  progress.hidden = false;
  progress.value = 10;
  message(byId("postMessage"), "Uploading…");
  const uploaded = [];
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin())) throw new Error("Admin session expired. Log in again.");
    let file = null;
    let cover = null;
    const selectedFile = contentFile.files[0];
    const selectedCover = byId("coverFile").files[0];
    if (selectedFile) {
      file = await upload("guide-files", selectedFile, user.id);
      uploaded.push(["guide-files", file.path]);
    }
    progress.value = 48;
    if (selectedCover) {
      cover = await upload("guide-covers", selectedCover, user.id);
      uploaded.push(["guide-covers", cover.path]);
    } else if (kind.value === "image" && file) cover = file;
    progress.value = 76;
    const publishNow = byId("publishNow").checked;
    const { error } = await supabase.from("posts").insert({
      title: byId("title").value.trim(), kind: kind.value,
      body: byId("body").value.trim(), file_url: file?.url || null,
      file_path: file?.path || null, cover_url: cover?.url || null,
      cover_path: selectedCover ? cover?.path : null,
      external_url: byId("externalUrl").value.trim() || null,
      status: publishNow ? "published" : "draft",
      show_latest: byId("showLatest").checked,
      published_at: publishNow ? new Date().toISOString() : null,
      created_by: user.id,
    });
    if (error) throw error;
    progress.value = 100;
    byId("postForm").reset();
    byId("showLatest").checked = true;
    byId("publishNow").checked = true;
    kind.value = "pdf";
    updateFields();
    message(byId("postMessage"), publishNow ? "Published successfully." : "Draft saved.", "success");
    await loadPosts();
  } catch (error) {
    for (const [bucket, path] of uploaded) await supabase.storage.from(bucket).remove([path]);
    message(byId("postMessage"), error.message, "error");
  } finally {
    publishButton.disabled = false;
    setTimeout(() => { progress.hidden = true; }, 700);
  }
});

kind.addEventListener("change", updateFields);
byId("refresh").addEventListener("click", loadPosts);
byId("signOut").addEventListener("click", async () => { await supabase.auth.signOut(); await showSession(null); });
updateFields();
if (!isSupabaseConfigured) byId("setup").hidden = false;
else {
  const { data: { session } } = await supabase.auth.getSession();
  await showSession(session);
}
