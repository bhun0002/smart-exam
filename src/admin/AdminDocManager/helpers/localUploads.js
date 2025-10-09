// src/admin/AdminDocManager/helpers/localUploads.js
export async function uploadRequirementLocal(reqId, file) {
  const fd = new FormData();
  // IMPORTANT: field name must match multer.single("file")
  fd.append("file", file);

  const url = `/api/uploads/requirements/${reqId}`;
  // (Optional) debug: console.log("Uploading to:", url);

  const res = await fetch(url, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (${res.status})`);
  }
  return res.json(); // { url, filename, mimetype, size, ... }
}
