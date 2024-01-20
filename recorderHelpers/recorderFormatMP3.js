importScripts("/../encodeHelpers/Mp3Encoder.min.js");
let options, maxBuffers, encoder, recBuffers, NUM_CH = 2,
    sampleRate = 44100,
    bufferCount = 0;
function error(e) {
    self.postMessage({
        command: "error",
        message: "mp3: " + e
    })
}
function init(e) {
    e.config.numChannels === NUM_CH ? (sampleRate = e.config.sampleRate, options = e.options) : error("numChannels must be " + NUM_CH)
}
function setOptions(e) {
    encoder || recBuffers ? error("cannot set options during recording") : options = e
}
function start(e) {
    maxBuffers = Math.ceil(options.timeLimit * sampleRate / e), options.encodeAfterRecord ? recBuffers = [] : encoder = new Mp3LameEncoder(sampleRate, options.mp3.bitRate)
}
function record(e) {
    bufferCount++ < maxBuffers ? encoder ? encoder.encode(e) : recBuffers.push(e) : self.postMessage({
        command: "timeout"
    })
}
function postProgress(e) {
    self.postMessage({
        command: "progress",
        progress: e
    })
}
function finish() {
    if (recBuffers) {
        postProgress(0), encoder = new Mp3LameEncoder(sampleRate, options.mp3.bitRate);
        let e = Date.now() + options.progressInterval;
        for (; recBuffers.length > 0;) {
            encoder.encode(recBuffers.shift());
            let o = Date.now();
            o > e && (postProgress((bufferCount - recBuffers.length) / bufferCount), e = o + options.progressInterval)
        }
        postProgress(1)
    }
    self.postMessage({
        command: "complete",
        blob: encoder.finish(options.mp3.mimeType)
    }), cleanup()
}
function cleanup() {
    encoder = recBuffers = void 0, bufferCount = 0
}
self.onmessage = function(e) {
    let o = e.data;
    switch (o.command) {
        case "init":
            init(o);
            break;
        case "options":
            setOptions(o.options);
            break;
        case "start":
            start(o.bufferSize);
            break;
        case "record":
            record(o.buffer);
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
Sourc