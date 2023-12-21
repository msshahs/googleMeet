let mediaRecorder = null;
let recognition = null;
let recognitionStopped = false;
let fullTranscript = '';
console.log("here")
// logic to set the video stream
const onAccessApproved = (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    recognition = new webkitSpeechRecognition();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        fullTranscript += transcript
        recognitionStopped = false;
        console.log("fullTranscript :", fullTranscript)
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error :', event.error);
    };

    recognition.onend = function (num) {
        if (!recognitionStopped) {
            console.log('Speech recognition ended & restarted.');
            recognition.start();
        } else {
            downloadTranscript(fullTranscript);
            fullTranscript = ""
            console.log('Speech recognition ended completely.');
        }
    };

    recognition.lang = 'en-US';

    recognition.start()
    mediaRecorder.start();

    mediaRecorder.onstop = () => {
        stream.getTracks().forEach(function (track) {
            if (track.readyState === "live") {
                track.stop();
            }
        });
    };

    mediaRecorder.ondataavailable = (event) => {
        let recordedBlob = event.data;
        let url = URL.createObjectURL(recordedBlob);
        stopRecognition();
        downloadVideo(url);
    };
}

// stop the speech recognition
const stopRecognition = () => {

    if (recognition) {
        recognitionStopped = true;
        recognition.stop();
        console.log('Speech recognition stopped.');
    }
}

// create the date format
const dateFormat = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

// for download the transcript
const downloadTranscript = (transcript) => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    let date = new Date();
    const url = URL.createObjectURL(blob);
    console.log(url);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${dateFormat()}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// for download the video
const downloadVideo = (videoUrl) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = videoUrl;
    a.download = `screen-recording-${dateFormat()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(videoUrl);
}

// Checking if the current page is a Google Meet page
const isGoogleMeet = () => {
    const pathname = new URL(location.href).pathname;
    return (
        location.hostname === "meet.google.com" && pathname && pathname.length > 1
    );
}

// check the request from extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_recording") {
        if (isGoogleMeet()) {
            sendResponse(`processed: ${message.action}`);
            navigator.mediaDevices
                .getDisplayMedia({
                    audio: true,
                    video: {
                        width: 9999999999,
                        height: 9999999999,
                    },
                })
                .then((stream) => {
                    onAccessApproved(stream);
                })
                .catch(error => {
                    console.error('Error accessing media devices:', error);
                });
        } else {
            alert("This extension is only to record your Google meeting. So please create your meeting then start recording.");
        }
    }

    if (message.action === "stop_recording") {
        sendResponse(`processed: ${message.action}`);
        if (!mediaRecorder) return console.log("no media recorder");
        mediaRecorder.stop();
    }
});
