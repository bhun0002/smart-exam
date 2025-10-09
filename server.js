// server.js
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");
const { v4: uuid } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Static for served files (GET only) ----
// Files are saved on disk under ./uploads and publicly available at /uploads/**
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOAD_ROOT, { etag: true, maxAge: "7d" }));

// (Optional) simple request logger to verify requests hit the right path
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ---- helpers ----
const clean = (s) => String(s).replace(/[^a-zA-Z0-9-_]/g, "_");
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// ---- Multer storage: auto-create folder per requirement, safe filename ----
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const reqId = clean(req.params.reqId);
      const dest = path.join(UPLOAD_ROOT, "requirements", reqId);
      await ensureDir(dest);
      cb(null, dest);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const original = file.originalname || "file";
    const dot = original.lastIndexOf(".");
    const base = clean(dot > 0 ? original.slice(0, dot) : original).slice(0, 80);
    const ext = dot > 0 ? original.slice(dot) : "";
    cb(null, `${base}-${uuid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25MB
});

// ================== ADMIN DOCS UPLOADS (API) ==================
// Upload a single file for a requirement (POST only via /api/uploads/**)
app.post("/api/uploads/requirements/:reqId", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file field 'file' provided" });

    const rel = req.file.path.replace(UPLOAD_ROOT, "").split(path.sep).join("/");
    return res.status(201).json({
      message: "Uploaded",
      url: `/uploads${rel}`, // public URL you can store and later GET
      name: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: Date.now(),
    });
  });
});

// (Optional) list files for a requirement (GET via API)
app.get("/api/uploads/requirements/:reqId", async (req, res) => {
  try {
    const reqId = clean(req.params.reqId);
    const dir = path.join(UPLOAD_ROOT, "requirements", reqId);
    const list = await fs.readdir(dir);
    res.json({ files: list.map((n) => `/uploads/requirements/${reqId}/${n}`) });
  } catch (e) {
    if (e.code === "ENOENT") return res.json({ files: [] });
    res.status(500).json({ error: e.message });
  }
});

// (Optional) delete one file for a requirement (DELETE via API)
app.delete("/api/uploads/requirements/:reqId/:filename", async (req, res) => {
  try {
    const reqId = clean(req.params.reqId);
    const filename = clean(req.params.filename);
    const full = path.join(UPLOAD_ROOT, "requirements", reqId, filename);
    await fs.unlink(full);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(e.code === "ENOENT" ? 404 : 500).json({ error: e.message });
  }
});

// ---- If you also want this same server to serve your React build, uncomment: ----
// const CLIENT_BUILD = path.join(process.cwd(), "build"); // CRA
// app.use(express.static(CLIENT_BUILD));
// app.get("*", (req, res) => res.sendFile(path.join(CLIENT_BUILD, "index.html")));

app.listen(PORT, () => {
  console.log(`Admin docs + uploads on http://localhost:${PORT}`);
});
