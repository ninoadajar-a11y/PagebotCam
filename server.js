import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // keep memory storage
const PORT = process.env.PORT || 3000;

const PAGE_ID = process.env.PAGE_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Make sure you have a royalty-free music file in /music folder
const MUSIC_FILE = path.join("music", "background.mp3"); // relative path

// Endpoint to receive video
app.post("/upload-video", upload.single("video"), async (req, res) => {
    try {
        const videoFile = req.file;
        if (!videoFile) return res.status(400).json({ error: "No video uploaded" });

        // Save uploaded video temporarily
        const tempVideoPath = path.join("uploads", `video_${Date.now()}.webm`);
        fs.writeFileSync(tempVideoPath, videoFile.buffer);

        // Output path after merging music
        const outputVideoPath = path.join("uploads", `final_${Date.now()}.mp4`);

        // Merge video + music using ffmpeg
        // Adjust volume of music to 0.3 to not overpower the video
        const ffmpegCmd = `ffmpeg -i "${tempVideoPath}" -i "${MUSIC_FILE}" -filter_complex "[1:a]volume=0.3[a1];[0:a][a1]amix=inputs=2:duration=shortest" -c:v copy "${outputVideoPath}" -y`;

        exec(ffmpegCmd, async (err) => {
            if (err) {
                console.error("FFMPEG Error:", err);
                return res.status(500).json({ error: err.message });
            }

            // Upload merged video to Facebook Page
            const form = new FormData();
            form.append("source", fs.createReadStream(outputVideoPath));
            form.append("description", "🎬 Successfully Recorded with Music ✔");
            form.append("access_token", ACCESS_TOKEN);

            try {
                const response = await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
                    method: "POST",
                    body: form,
                });

                const result = await response.json();

                // Cleanup temporary files
                fs.unlinkSync(tempVideoPath);
                fs.unlinkSync(outputVideoPath);

                res.json(result);
            } catch (fbErr) {
                console.error("Facebook Upload Error:", fbErr);
                res.status(500).json({ error: fbErr.message });
            }
        });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend files
app.use(express.static("frontend"));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
