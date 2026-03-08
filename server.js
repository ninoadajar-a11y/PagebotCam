import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // memory storage
const PORT = process.env.PORT || 3000;

const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Accept video upload
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        const description = req.body.description || "Claim Video";

        if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

        const form = new FormData();
        form.append("source", videoFile.buffer, videoFile.originalname);
        form.append("description", description);
        form.append("access_token", ACCESS_TOKEN);

        const response = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
            method: "POST",
            body: form,
            headers: form.getHeaders() // important for node-fetch
        });

        const result = await response.json();
        console.log("Posted video:", result);
        res.json(result);

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend files
app.use(express.static("frontend"));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
