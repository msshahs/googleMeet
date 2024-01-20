importScripts("/../encodeHelpers/WavEncoder.min.js");
let options, maxBuffers, encoder, recBuffers, sampleRate = 44100,
    numChannels = 2,
    bufferCount = 0;
function error(e) {
    self.postMessage({
        command: "error",
        message: "wav: " + e
    })
}
function init(e) {
    sampleRate = e.config.sampleRate, numChannels = e.config.numChannels, options = e.options
}
function setOptions(e) {
    encoder || recBuffers ? error("cannot set options during recording") : options = e
}
function start(e) {
    maxBuffers = Math.ceil(options.timeLimit * sampleRate / e), options.encodeAfterRecord ? recBuffers = [] : encoder = new WavAudioEncoder(sampleRate, numChannels)
}
function record(e) {
    bufferCount++ < maxBuffers && (encoder ? encoder.encode(e) : recBuffers ? recBuffers.push(e) : self.postMessage({
        command: "timeout"
    }))
}
function postProgress(e) {
    self.postMessage({
        command: "progress",
        progress: e
    })
}
function finish() {
    if (recBuffers) {
        postProgress(0), encoder = new WavAudioEncoder(sampleRate, numChannels);
        for (var e = Date.now() + options.progressInterval; recBuffers.length > 0;) {
            encoder.encode(recBuffers.shift());
            var s = Date.now();
            s > e && (postProgress((bufferCount - recBuffers.length) / bufferCount), e = s + options.progressInterval)
        }
        postProgress(1)
    }
    self.postMessage({
        command: "complete",
        blob: encoder.finish(options.wav.mimeType)
    }), cleanup()
}
function cleanup() {
    encoder = recBuffers = void 0, bufferCount = 0
}
self.onmessage = function (e) {
    var s = e.data;
    switch (s.command) {
        case "init":
            init(s);
            break;
        case "options":
            setOptions(s.options);
            break;
        case "start":
            start(s.bufferSize);
            break;
        case "record":
            record(s.buffer);
            break;
        case "finish":
            finish();
            break;
        case "cancel":
            cleanup()
    }
}, self.postMessage({
    command: "loaded"
});