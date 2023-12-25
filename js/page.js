var mediaRecorder = null;
let recognition = null;
let recognitionStopped = false;
let fullTranscript = '';
let screenStream;
let microphoneStream;
let recordedChunks = [];
// let audioUrl;

console.log("here")

//capture the recognition to convert it in text
const recognitionCapture = () => {
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
}


// logic to set the video stream
const onAccessApproved = (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    recognitionCapture();
    
    mediaRecorder.onstop = () => {
        // console.log(sendMessage("stop_recording"))
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

//To combine audio capture form tab and video from screen this will combine both and generate the single video
// const combineVideoAndAudio = (videoBlobUrl, audioBlobUrl) => {
//     const video = document.createElement('video');
//     const audio = document.createElement('audio');
//     const mediaSource = new MediaSource();

//     video.src = videoBlobUrl;
//     audio.src = audioBlobUrl;

//     video.addEventListener('loadedmetadata', () => {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         const width = video.videoWidth;
//         const height = video.videoHeight;

//         canvas.width = width;
//         canvas.height = height;

//         const sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');

//         const appendVideoData = () => {
//             ctx.drawImage(video, 0, 0, width, height);
//             canvas.toBlob((blob) => {
//                 sourceBuffer.appendBuffer(new Uint8Array(blob));
//             }, 'image/webp');
//         };

//         const appendAudioData = () => {
//             fetch(audioBlobUrl)
//                 .then(response => response.arrayBuffer())
//                 .then(data => sourceBuffer.appendBuffer(new Uint8Array(data)));
//         };

//         mediaSource.addEventListener('sourceopen', () => {
//             appendVideoData();
//             appendAudioData();
//         });

//         mediaSource.addEventListener('sourceended', () => {
//             const combinedBlob = new Blob([sourceBuffer.buffer], { type: 'video/webm' });
//             const downloadLink = document.createElement('a');
//             downloadLink.href = URL.createObjectURL(combinedBlob);
//             downloadLink.download = 'combined_video_with_audio.webm';
//             downloadLink.click();

//             // Clean up
//             document.body.removeChild(downloadLink);
//             document.body.removeChild(video);
//             document.body.removeChild(audio);
//             document.body.removeChild(canvas);
//         });

//         document.body.appendChild(video);
//         document.body.appendChild(audio);
//         document.body.appendChild(canvas);

//         video.play();
//         audio.play();
//     });

// }


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

//to send message to background
// const sendMessage = (message) => {
//     chrome.runtime.sendMessage({
//         active: message === "start_recording" ? true : false
//     }, (response) => {
//         if (!chrome.runtime.lastError) {
//             return response;
//         } else {
//             console.log(chrome.runtime.lastError)
//         }
//     })
// }


// check the request from extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_recording") {
        if (isGoogleMeet()) {

            sendResponse(`processed: ${message.action}`);
            navigator.mediaDevices.getDisplayMedia({ video: true })
                .then(stream => {
                    screenStream = stream;
                    return navigator.mediaDevices.getUserMedia({ audio: true });
                })
                .then(stream => {
                    // console.log(sendMessage("start_recording"))
                    microphoneStream = stream;
                    const combinedStream = new MediaStream([
                        ...screenStream.getVideoTracks(),
                        ...microphoneStream.getAudioTracks()
                    ]);
                    onAccessApproved(combinedStream);
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