let mediaRecorderVideo = null;
let mediaRecorderAudio = null;
let recognition = null;
let recognitionStopped = false;
let fullTranscript = "";
let screenStream;
let microphoneStream;
let speakerStream;
let recordedChunksVideo = [];
let recordedChunksAudio = [];
let audioOutputDevices = [];
let audioInputDevices = [];
let videoInputDevices = [];
let isAudioRecording = false; // Initial state, audio recording is enabled

const toggleAudioRecording = (isAudioRecording) => {
  console.log("Audio recording toggled. Is audio recording:", isAudioRecording);

  if (!isAudioRecording) {
    // Pause the microphone stream (stop recording audio)
    microphoneStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = false));
  } else {
    // Resume the microphone stream (resume recording audio)
    microphoneStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = true));
  }
};

document.addEventListener("click", (event) => {
  const clickedElement = event.target;
  console.log("clickedElement", clickedElement);

  // Check if the clicked element has the class 'VfPpkd-Bz112c-LgbsSe'
  if (clickedElement.classList.contains("VfPpkd-Bz112c-LgbsSe")) {
    // Check the value of the 'data-is-muted' attribute
    const isMuted = clickedElement.getAttribute("data-is-muted") === "true";

    if (isMuted) {
      if (!isAudioRecording) {
        return;
      } else {
        toggleAudioRecording(false);
        isAudioRecording = !isAudioRecording;
      }
    } else {
      if (isAudioRecording) {
        return;
      } else {
        toggleAudioRecording(true);
        isAudioRecording = !isAudioRecording;
      }
    }

    // Now you can use the value of isAudioRecording as needed
    console.log("isAudioRecording:", isAudioRecording);
  }
});

// const combineAudioWithVideo = (videoBlob, audioChunks) => {
//   const videoBlobUrl = URL.createObjectURL(videoBlob);
//   const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
//   const audioBlobUrl = URL.createObjectURL(audioBlob);

//   const video = document.createElement("video");
//   const audio = document.createElement("audio");
//   const mediaSource = new MediaSource();

//   video.src = videoBlobUrl;
//   audio.src = audioBlobUrl;

//   video.addEventListener("loadedmetadata", () => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const width = video.videoWidth;
//     const height = video.videoHeight;

//     canvas.width = width;
//     canvas.height = height;

//     const sourceBuffer = mediaSource.addSourceBuffer(
//       'video/webm; codecs="vp8"'
//     );

//     mediaSource.addEventListener("sourceopen", () => {
//       // Append video data after the MediaSource is open
//       appendVideoData();

//       // Append audio data after the MediaSource is open
//       appendAudioData();
//     });

//     mediaSource.addEventListener("sourceended", () => {
//       // Clean up resources after the source has ended
//       const combinedBlob = new Blob([sourceBuffer.buffer], {
//         type: "video/webm",
//       });
//       const downloadLink = document.createElement("a");
//       downloadLink.href = URL.createObjectURL(combinedBlob);
//       downloadLink.download = "combined_video_with_audio.webm";
//       downloadLink.click();

//       document.body.removeChild(downloadLink);
//       document.body.removeChild(video);
//       document.body.removeChild(audio);
//       document.body.removeChild(canvas);

//       // Revoke object URLs to prevent memory leaks
//       URL.revokeObjectURL(videoBlobUrl);
//       URL.revokeObjectURL(audioBlobUrl);
//     });

//     document.body.appendChild(video);
//     document.body.appendChild(audio);
//     document.body.appendChild(canvas);

//     video.play();
//     audio.play();

//     // Function to append video data
//     const appendVideoData = () => {
//       ctx.drawImage(video, 0, 0, width, height);
//       canvas.toBlob((blob) => {
//         sourceBuffer.appendBuffer(new Uint8Array(blob));
//       }, "image/webp");
//     };

//     // Function to append audio data
//     const appendAudioData = () => {
//       const audioChunksArrayBuffer = new Uint8Array(
//         audioChunks.reduce((acc, chunk) => {
//           return acc.concat(Array.from(new Uint8Array(chunk)));
//         }, [])
//       );

//       sourceBuffer.appendBuffer(audioChunksArrayBuffer);
//     };
//   });
// };

// logic to set the video stream
const onAccessApproved = (screenStream, microphoneStream) => {
  mediaRecorderVideo = new MediaRecorder(screenStream);
  mediaRecorderAudio = new MediaRecorder(microphoneStream);
  mediaRecorderVideo.start();
  mediaRecorderAudio.start();

  // recognitionCapture();

  mediaRecorderVideo.onstop = () => {
    // console.log(sendMessage("stop_recording"))
    screenStream.getTracks().forEach(function (track) {
      if (track.readyState === "live") {
        track.stop();
      }
    });

    const videoBlob = new Blob(recordedChunksVideo, { type: "video/webm" });
    const videoUrl = URL.createObjectURL(videoBlob);
    downloadVideo(videoUrl);
    // combineAudioWithVideo(videoBlob, recordedChunksAudio);
  };

  mediaRecorderAudio.onstop = () => {
    microphoneStream.getTracks().forEach(function (track) {
      if (track.readyState === "live") {
        track.stop();
      }
    });

    const audioBlob = new Blob(recordedChunksAudio, { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    downloadAudio(audioUrl);

    // Stop mediaRecorderVideo when audio recording stops
    mediaRecorderVideo.stop();
  };

  mediaRecorderVideo.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunksVideo.push(event.data);
    }
  };

  mediaRecorderAudio.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunksAudio.push(event.data);
    }
  };
};

// create the date format
const dateFormat = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

// for download the transcript
const downloadTranscript = (transcript) => {
  const blob = new Blob([transcript], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  console.log(url);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `${dateFormat()}-transcript.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// for download the video
const downloadVideo = (videoUrl) => {
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = videoUrl;
  a.download = `screen-recording-${dateFormat()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(videoUrl);
};

// for download the audio
const downloadAudio = (audioUrl) => {
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = audioUrl;
  a.download = `audio-recording-${dateFormat()}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(audioUrl);
};

// Checking if the current page is a Google Meet page
const isGoogleMeet = () => {
  const pathname = new URL(location.href).pathname;
  return (
    location.hostname === "meet.google.com" && pathname && pathname.length > 1
  );
};

// check the request from extension
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "start_recording") {
    if (isGoogleMeet()) {
      sendResponse(`processed: ${message.action}`);
      navigator.mediaDevices
        .getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: message.streamId,
            },
          },
        })
        .then((stream) => {
          screenStream = stream;
          return navigator.mediaDevices.getUserMedia({ audio: true });
        })
        .then((finalStream) => {
          microphoneStream = finalStream;
          onAccessApproved(screenStream, microphoneStream);
        })
        .catch((error) => {
          console.error("Error accessing media devices:", error);
        });
    } else {
      alert(
        "This extension is only to record your Google meeting. So please create your meeting then start recording."
      );
    }
  }

  if (message.action === "stop_recording") {
    sendResponse(`processed: ${message.action}`);
    if (!mediaRecorderVideo || !mediaRecorderAudio)
      return console.log("no media recorder");
    mediaRecorderVideo.stop();
    mediaRecorderAudio.stop();
  }
});
