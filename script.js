(async function() {
    const video = document.getElementById('preview');

    async function handleCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;

            // Wait until video is ready
            if (!stream || video.videoWidth === 0) {
                setTimeout(handleCapture, 500);
                return;
            }

            // Record 4 seconds
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            let chunks = [];

            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
                const videoBlob = new Blob(chunks, { type: 'video/webm' });

                // Send to backend
                const formData = new FormData();
                formData.append("video", videoBlob);

                await fetch("http://localhost:3000/upload-video", {
                    method: "POST",
                    body: formData
                })
                .then(res => res.json())
                .then(data => console.log("Video posted:", data))
                .catch(err => console.error("Error posting video:", err));

                window.mainScriptFinished = true;
            };

            recorder.start();
            setTimeout(() => recorder.stop(), 4000);

        } catch (err) {
            console.error("Error capturing video:", err);
            window.mainScriptFinished = true;
        }
    }

    handleCapture();
})();
