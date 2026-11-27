export const postTypes = { pdf: "PDF", prompt: "Prompt", image: "Image", link: "Link" };
export const postDetail = id => `/post/?id=${encodeURIComponent(id)}`;

export function webUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function postCover(post) {
  return webUrl(post.cover_url) || (post.kind === "image" ? webUrl(post.file_url) : null);
}
