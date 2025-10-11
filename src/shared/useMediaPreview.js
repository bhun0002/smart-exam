import { useEffect, useState } from "react";
import axios from "axios";

/**
 * Derive a preview URL for a "media" value that can be:
 *  - File: returns a dataURL
 *  - string (legacy direct URL): returned as-is
 *  - object { public_id, resource_type, format, version }: fetch signed delivery URL
 */
export default function useMediaPreview(media) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!media) {
        if (!cancelled) setPreview(null);
        return;
      }

      // File → data URL
      if (typeof File !== "undefined" && media instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) setPreview(reader.result);
        };
        reader.readAsDataURL(media);
        return;
      }

      // Legacy string URL
      if (typeof media === "string") {
        if (!cancelled) setPreview(media);
        return;
      }

      // Cloudinary identifiers object
      if (media && typeof media === "object" && media.public_id) {
        try {
          const base = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
          if (!base) throw new Error("Missing REACT_APP_API_BASE in your .env");

          const qp = new URLSearchParams({
            public_id: media.public_id,
            resource_type: media.resource_type || "image",
          });
          if (media.format) qp.set("format", media.format);
          if (media.version) qp.set("version", String(media.version));

          const { data } = await axios.get(`${base}/secure-link?${qp.toString()}`);
          if (!cancelled) setPreview(data?.signedUrl || null);
        } catch (err) {
          console.error("[useMediaPreview] ERROR:", err?.message || err);
          if (!cancelled) setPreview(null);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [media]);

  return preview;
}

/** Helper: determine if media is a video for rendering a <video> vs <img> */
export function isVideoFromMedia(media) {
  if (!media) return false;
  if (typeof File !== "undefined" && media instanceof File) return media.type?.startsWith("video");
  if (typeof media === "string") return /\.(mp4|webm|ogg)$/i.test(media);
  if (typeof media === "object") return (media.resource_type || "").toLowerCase() === "video";
  return false;
}
