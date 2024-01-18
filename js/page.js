var mediaRecorder = null;
var microphoneRecorder = null;
let recognition = null;
let recognitionStopped = false;
let fullTranscript = '';
let screenStream;
let microphoneStream;
let speakerStream;
let recordedChunks = [];
let audioOutputDevices = [];
let audioInputDevices = [];
let videoInputDevices = [];
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

// for recording the microphone audio
const microphoneCapture = (stream) => {
    microphoneRecorder = new MediaRecorder(stream);
    let chunks = [];

    microphoneRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    microphoneRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(audioBlob);
        downloadLink.download = 'recorded_audio.wav';
        downloadLink.click();
        stream.getTracks().forEach(function (track) {
            if (track.readyState === "live") {
                track.stop();
            }
        });
    };

    microphoneRecorder.start();
}

// logic to set the video stream
const onAccessApproved = (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    // recognitionCapture();

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
        // stopRecognition();
        downloadVideo(url);
    };
}

// fetch all the audio devices if you want to get the video(output & input both) then make video "true"
const fetchAllDevices = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    let devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach(device => {
        if (device.kind === "audioinput")
            audioInputDevices.push(device);
        if (device.kind === "audiooutput")
            audioOutputDevices.push(device)
        if (device.kind === "videoinput")
            videoInputDevices.push(device);
    })

    return audioOutputDevices;
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

// only for testing purpose
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
            audioCtx.close()
            stream.getTracks().forEach(function (track) {
                if (track.readyState === "live") {
                    track.stop();
                }
            });
        };

        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
        }, 10000);

    }).catch((error) => {
        console.error('Error accessing microphone:', error);
    });
}

// get only microphone stream
const microphoneOnly = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((microphoneStream) => {
            microphoneCapture(microphoneStream)
        })
        .catch((error) => {
            console.error('Error accessing media devices:', error);
        })
}

// get the whole tab stream 
const getTabStream = (streamId) => {
    navigator.mediaDevices.getUserMedia({
        video: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        },
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        }
    }).then((stream) => {
        screenStream = stream;
        onAccessApproved(screenStream);
    }).catch(error => {
        console.error('Error accessing media devices:', error);
    });
}

// check the request from extension
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "start_recording") {
        // speakerOnly(message.streamId)
        if (isGoogleMeet()) {
            sendResponse(`processed: ${message.action}`);
            getTabStream(message.streamId)
            microphoneOnly()
        } else {
            alert("This extension is only to record your Google meeting. So please create your meeting then start recording.");
        }
    }

    if (message.action === "stop_recording") {
        sendResponse(`processed: ${message.action}`);
        if (!mediaRecorder) return console.log("no media recorder");
        mediaRecorder.stop();
        microphoneRecorder.stop();
    }
});