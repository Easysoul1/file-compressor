//importing necessary modules
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { exec } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Storage for uploaded files
const upload = multer({ dest: "uploads/" });

// Test route
app.get("/", (req, res) => {
  res.send("File Compressor Backend Running");
});

// Compress Image Route
app.post("/compress/image", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const outputPath = `uploads/compressed-${Date.now()}-${req.file.originalname}`;

  try {
    await sharp(filePath)
      .resize({ width: 800 }) // Resize for demo; can customize
      .jpeg({ quality: 60 })  // Compress
      .toFile(outputPath);

    const compressedBuffer = fs.readFileSync(outputPath);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(compressedBuffer);
  } catch (error) {
    res.status(500).json({ error: "Compression failed" });
  } finally {
    fs.unlinkSync(filePath); // cleanup
  }
});

// PDF Compression using Ghostscript
app.post("/compress/pdf", upload.single("file"), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `uploads/compressed-${Date.now()}-${req.file.originalname}`;

  const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "PDF compression failed" });
    }

    const compressedBuffer = fs.readFileSync(outputPath);
    res.setHeader("Content-Type", "application/pdf");
    res.send(compressedBuffer);

    // cleanup
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
  });
});

// Compress Video using ffmpeg
app.post("/compress/video", upload.single("file"), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `uploads/compressed-${Date.now()}.mp4`;

  ffmpeg(inputPath)
    .videoCodec('libx264')
    .size('640x?') // Resize
    .outputOptions('-crf 28') // Compression quality
    .on('end', () => {
      const compressedBuffer = fs.readFileSync(outputPath);
      res.setHeader("Content-Type", "video/mp4");
      res.send(compressedBuffer);

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: "Video compression failed" });
    })
    .save(outputPath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
