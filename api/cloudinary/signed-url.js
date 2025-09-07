// api/cloudinary/signed-url.js
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { public_id, resource_type = "image", version, expiresIn = 60 } = req.body || {};
    if (!public_id) return res.status(400).json({ error: "public_id required" });

    // expire this URL soon
    const expiresAt = Math.floor(Date.now() / 1000) + Math.max(10, Math.min(expiresIn, 300));

    // For authenticated assets, use sign_url + type: "authenticated"
    const url = cloudinary.v2.url(public_id, {
      resource_type,
      type: "authenticated",
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      version // optional; can help cache-busting if you store it
    });

    return res.status(200).json({ url, expiresAt });
  } catch (err) {
    console.error("signed-url error", err);
    return res.status(500).json({ error: "Failed to create signed URL" });
  }
}
