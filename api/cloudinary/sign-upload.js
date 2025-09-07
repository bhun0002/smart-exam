// api/cloudinary/sign-upload.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      folder = "exam-assets",
      public_id,                     // optional, let Cloudinary assign if omitted
      timestamp = Math.floor(Date.now() / 1000), // client can send, or we set here
      resource_type = "image",
      type = "authenticated"         // <— important: private delivery
    } = req.body || {};

    // Build the params to sign — order & keys must match Cloudinary rules
    const paramsToSign = {
      folder,
      timestamp,
      type,
      ...(public_id ? { public_id } : {})
    };

    // Create the query string in alphabetical order
    const toSign = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    // Sign with your API secret
    const signature = crypto
      .createHash("sha1")
      .update(toSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    return res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      signature,
      timestamp,
      folder,
      type,
      resource_type,
      public_id: public_id || null,
      // (optional) how long the client should treat this signature as valid
      expiresIn: 60
    });
  } catch (err) {
    console.error("sign-upload error", err);
    return res.status(500).json({ error: "Failed to sign upload" });
  }
}
