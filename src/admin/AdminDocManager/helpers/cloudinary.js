import axios from "axios";

/** Uploads a file to Cloudinary with your existing signed-upload API. */
export async function uploadRefFile(
  file,
  { folder = "student-docs/refs", access_mode = "authenticated" } = {}
) {
  const base = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
  if (!base) throw new Error("Missing REACT_APP_API_BASE in your .env");

  const { data: sign } = await axios.get(`${base}/sign-upload`, {
    params: { folder, access_mode },
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("timestamp", sign.timestamp);
  formData.append("api_key", sign.apiKey);
  formData.append("signature", sign.signature);
  if (sign.folder) formData.append("folder", sign.folder);
  if (sign.access_mode) formData.append("access_mode", sign.access_mode);

  const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;
  const res = await axios.post(endpoint, formData);

  const { public_id, resource_type, format: rawFormat, version, secure_url } = res.data || {};
  if (!public_id) throw new Error("Missing Cloudinary public_id");

  const extFromName =
    file?.name && file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : null;
  const extFromId =
    public_id && public_id.includes(".") ? public_id.split(".").pop().toLowerCase() : null;

  const safeFormat = rawFormat ?? extFromName ?? extFromId ?? null;

  return {
    public_id: public_id ?? null,
    resource_type: resource_type ?? null,
    format: safeFormat,
    version: typeof version === "number" || typeof version === "string" ? version : null,
    secure_url: secure_url ?? null, // preview-only
  };
}

/** Returns a signed, time-bound URL for the ref file (image/video/raw) */
export async function getSignedDocUrlLikeWorking(refMedia) {
  if (!refMedia?.public_id) return null;
  const base = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
  if (!base) throw new Error("Missing REACT_APP_API_BASE in your .env");

  const ext = (refMedia.format || "").toLowerCase();
  const IMAGE_EXTS = new Set(["jpg","jpeg","png","gif","bmp","tiff","tif","webp","avif","heic","svg","pdf"]);
  const VIDEO_EXTS = new Set(["mp4","webm","ogg","ogv","mov","mkv","m4v","avi"]);

  let pathResourceType = "raw";
  if (ext && IMAGE_EXTS.has(ext)) pathResourceType = "image";
  else if (ext && VIDEO_EXTS.has(ext)) pathResourceType = "video";

  const qp = new URLSearchParams({
    public_id: refMedia.public_id,
    delivery_type: "upload",
    path_resource_type: pathResourceType,
  });

  if (ext && !refMedia.public_id.toLowerCase().endsWith(`.${ext}`)) qp.set("format", ext);
  if (refMedia.version) qp.set("version", String(refMedia.version));

  const { data } = await axios.get(`${base}/secure-link?${qp.toString()}`);
  return data?.signedUrl || null;
}
