
// let startTabId;
// let completeTabID;
// let audioURL = null;
// let mediaRecorder;
// let audioCtx;
// let liveStream;

// Listening for messages from content scripts
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.active) {
//         audioCapture();
//         sendResponse({ msg: "started" });
//     }
//     else {
//         stopCapture();
//         sendResponse({ msg: "ended" });
//     }
// });


// const audioCapture = () => {

//     chrome.tabCapture.capture({
//         audio: true
//     }).then(stream => {
//         chrome.tabs.query({
//             active: true,
//             currentWindow: true
//         }, (tabs) => startTabId = tabs[0].id)

//         liveStream = stream;
//         audioCtx = new AudioContext();
//         const source = audioCtx.createMediaStreamSource(stream);
//         mediaRecorder = new Recorder(source);

//         mediaRecorder.startRecording();

//         mediaRecorder.onComplete = (recorder, blob) => {
//             audioURL = window.URL.createObjectURL(blob);
//             if (startTabId) {
//                 chrome.tabs.sendMessage(startTabId, {
//                     type: "encodingComplete",
//                     url: audioURL
//                 });
//             }
//             mediaRecorder = null;
//         }
//     }).catch(error => {
//         console.error('Error accessing media devices:', error);
//     });
// }

// const stopCapture = () => {
//     audioCtx.close();
//     liveStream.getAudioTracks()[0].stop();
//     mediaRecorder.finishRecording();
// }
