import express from "express";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

const app = express();
const upload = multer(); // handle multipart/form-data

const PAGE_ID = "621898520998013";
const ACCESS_TOKEN = "EAAUG0iogqEYBQ89EY0zyisuNsN2KxPQPSpA7MIv87dn1oQUmL38XVQCnUtBmziCJLRKXbX3fED8JbXMT9FXfHzHKm8AiCTZBDG1lZCDZAQ54IIPyLJHZB1AZACKqUiIDL9Y469aYjWevtsxkEt4BuLH60yeLOXtkjoGp0ZBtASh9cLRnhdcNVrRfK5MI4JHxAX8f3BKB16";

// Endpoint to receive video from browser
app.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    const videoBlob = req.file.buffer;

    const form = new FormData();
    form.append("source", videoBlob, "video.mp4");
    form.append("description", "🎬 Successfully Recorded ✔");
    form.append("access_token", ACCESS_TOKEN);

    const response = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
      method: "POST",
      body: form
    });

    const result = await response.json();
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));
