const speakerOnly = (streamId) => {
    navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        }
    }).then(async (stream) => {
        speakerStream = stream;
        const output = new AudioContext();
        const source = output.createMediaStreamSource(stream);
        source.connect(output.destination);
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/wav' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(audioBlob);
            downloadLink.download = 'recorded_audio.wav';
            downloadLink.click();
            output.close();
            stream.getTracks().forEach(function (track) {
                if (track.readyState === "live") {
                    track.stop();
                }
            });
        };

        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
        }, 15000);

    }).catch((error) => {
        console.error('Error accessing microphone:', error);
    });
}

chrome.runtime.onMessage.addListener(
    (req, sender, sendResponse) => {
        console.log("Message received in background script:", req);
        speakerOnly(req.streamId)
        // You can do something with the message and send a response back if needed
        sendResponse({ farewell: "Goodbye from background script!" });
    }
);

