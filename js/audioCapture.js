let interval, timeLeft, mediaRecorder, audioURL, startTabId, liveStream, audioCtx, currentTabId = null,
    currentTab = null;
const getCurrentTabId = () => new Promise((e => {
    chrome.tabs.query({
        active: !0
    }, (t => {
        chrome.runtime.lastError || (currentTabId = t[0].id, currentTab = t[0], e(currentTabId))
    }))
})),
    handleHotKeysDown = function (e) {
        (e.ctrlKey || e.metaKey) && e.shiftKey && 85 === e.keyCode ? startCapture() : (e.ctrlKey || e.metaKey) && e.shiftKey && 88 === e.keyCode && stopCapture()
    };
    
document.addEventListener("DOMContentLoaded", (function () {
    new Promise((e => {
        chrome.tabs.query({
            active: !0
        }, (t => {
            chrome.runtime.lastError || (currentTabId = t[0].id, currentTab = t[0], e(currentTabId))
        }))
    })), displayStatus();
    const e = document.getElementById("startKey"),
        t = document.getElementById("endKey"),
        o = document.getElementById("start"),
        n = document.getElementById("finish"),
        r = document.getElementById("cancel");
    o.onclick = () => {
        startCapture()
    }, n.onclick = () => {
        stopCapture()
    }, r.onclick = () => {
        cancelCapture()
    }, chrome.runtime.getPlatformInfo((o => {
        const n = navigator.userAgent;
        let r = /Edg.+/.test(n);
        "mac" !== o.os || r ? (e.innerHTML = "Ctrl + Shift + S to start capture on current tab", t.innerHTML = "Ctrl + Shift + X to stop capture on current tab") : (e.innerHTML = "Command + Shift + U to start capture on current tab", t.innerHTML = "Command + Shift + X to stop capture on current tab")
    }));
    document.getElementById("options")
        .onclick = () => {
            chrome.runtime.openOptionsPage()
        };
    document.getElementById("review")
        .onclick = () => {
            const e = navigator.userAgent;
            let t = /Edg.+/.test(e);
            url = t ? "https://microsoftedge.microsoft.com/addons/detail/" + chrome.runtime.id : "https://chrome.google.com/webstore/detail/" + chrome.runtime.id + "/reviews", chrome.tabs.create({
                url: url
            })
        }
})), document.addEventListener("keydown", handleHotKeysDown);
const displayStatus = function () {
    chrome.tabs.query({
        active: !0,
        currentWindow: !0
    }, (e => {
        const t = document.getElementById("status"),
            o = document.getElementById("timeRem"),
            n = document.getElementById("start"),
            r = document.getElementById("finish"),
            i = document.getElementById("cancel");
        chrome.runtime.sendMessage({
            currentTab: e[0].id
        }, (e => {
            e ? (chrome.storage.sync.get({
                maxTime: 12e5,
                limitRemoved: !1
            }, (n => {
                n.maxTime > 12e5 ? (chrome.storage.sync.set({
                    maxTime: 12e5
                }), timeLeft = 12e5 - (Date.now() - e)) : timeLeft = n.maxTime - (Date.now() - e), t.innerHTML = "Tab is currently being captured", n.limitRemoved ? (o.innerHTML = `${parseTime(Date.now() - e)}`, interval = setInterval((() => {
                    o.innerHTML = `${parseTime(Date.now() - e)}`
                }))) : (o.innerHTML = `${parseTime(timeLeft)} remaining`, interval = setInterval((() => {
                    timeLeft -= 1e3, o.innerHTML = `${parseTime(timeLeft)} remaining`
                }), 1e3))
            })), r.style.display = "block", i.style.display = "block") : n.style.display = "block"
        }))
    }))
},
    parseTime = function (e) {
        let t = Math.floor(e / 1e3 / 60),
            o = Math.floor(e / 1e3 % 60);
        return t < 10 && t >= 0 ? t = "0" + t : t < 0 && (t = "00"), o < 10 && o >= 0 ? o = "0" + o : o < 0 && (o = "00"), `${t}:${o}`
    },
    startCapture = async function () {
        const e = (await chrome.tabs.getCurrent())
            ?.id;
        chrome.storage.sync.get({
            maxTime: 12e5,
            muteTab: !1,
            format: "mp3",
            quality: 192,
            limitRemoved: !1
        }, (t => {
            let o = t.maxTime;
            o > 12e5 && (o = 12e5), audioCapture(o, t.muteTab, t.format, t.quality, t.limitRemoved, e)
        })), displayPopupButtons({
            captureStarted: !0,
            startTime: Date.now()
        })
    }, getMediaStream = e => new Promise((t => {
        t(navigator.mediaDevices.getUserMedia({
            video: !1,
            audio: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: e
                }
            }
        }))
    })), audioCapture = (e, t, o, n, r, i) => {
        let a;
        chrome.tabCapture.getMediaStreamId({
            consumerTabId: i,
            targetTabId: currentTabId
        }, (i => {
            getMediaStream(i)
                .then((i => {
                    liveStream = i, audioCtx = new AudioContext;
                    const s = audioCtx.createMediaStreamSource(i);
                    if (mediaRecorder = new Recorder(s), mediaRecorder.setEncoding(o), r ? mediaRecorder.setOptions({
                        timeLimit: 10800
                    }) : mediaRecorder.setOptions({
                        timeLimit: e / 1e3
                    }), "mp3" === o && mediaRecorder.setOptions({
                        mp3: {
                            bitRate: n
                        }
                    }), mediaRecorder.startRecording(), chrome.runtime.onMessage.addListener((function (e) {
                        "stopCapture" === e ? stopCapture() : "cancelCapture" === e ? cancelCapture() : e.cancelEncodeID && e.cancelEncodeID === startTabId && mediaRecorder && mediaRecorder.cancelEncoding()
                    })), mediaRecorder.onComplete = (e, t) => {
                        audioURL = window.URL.createObjectURL(t), mediaRecorder = null
                    }, mediaRecorder.onEncodingProgress = (e, t) => {
                        a
                    }, mediaRecorder.onTimeout = stopCapture, !t) {
                        let e = new Audio;
                        e.srcObject = liveStream, e.play()
                    }
                }))
        }))
    }, displayPopupButtons = e => {
        const t = document.getElementById("status"),
            o = document.getElementById("timeRem"),
            n = (document.getElementById("buttons"), document.getElementById("start")),
            r = document.getElementById("finish"),
            i = document.getElementById("cancel");
        e.captureStarted ? (chrome.storage.sync.get({
            maxTime: 12e5,
            limitRemoved: !1
        }, (n => {
            n.maxTime > 12e5 ? (chrome.storage.sync.set({
                maxTime: 12e5
            }), timeLeft = 12e5 - (Date.now() - e.startTime)) : timeLeft = n.maxTime - (Date.now() - e.startTime), t.innerHTML = "Tab is currently being captured", n.limitRemoved ? (o.innerHTML = `${parseTime(Date.now() - e.startTime)}`, interval = setInterval((() => {
                o.innerHTML = `${parseTime(Date.now() - e.startTime)}`
            }), 1e3)) : (o.innerHTML = `${parseTime(timeLeft)} remaining`, interval = setInterval((() => {
                timeLeft -= 1e3, o.innerHTML = `${parseTime(timeLeft)} remaining`
            }), 1e3))
        })), r.style.display = "block", i.style.display = "block", n.style.display = "none") : e.captureStopped && (t.innerHTML = "", r.style.display = "none", i.style.display = "none", n.style.display = "block", o.innerHTML = "", clearInterval(interval))
    }, stopCapture = function () {
        chrome.storage.local.get((e => {
            let t = e.format;
            mediaRecorder.finishRecording(), chrome.tabs.create({
                url: "html/complete.html"
            }, (e => {
                completeTabID = e.id;
                setTimeout((() => {
                    chrome.tabs.sendMessage(e.id, {
                        type: "createTab",
                        format: t,
                        audioURL: audioURL,
                        startID: currentTabId
                    })
                }), 1e3)
            })), closeStream(undefined)
        }))
    }, cancelCapture = function () {
        let e;
        chrome.tabs.query({
            active: !0
        }, (t => {
            e = t[0].id, mediaRecorder && (mediaRecorder.cancelRecording(), closeStream(e))
        }))
    }, closeStream = function (e) {
        mediaRecorder.onTimeout = () => { }, audioCtx.close(), liveStream.getAudioTracks()[0].stop(), sessionStorage.removeItem(e), displayPopupButtons({
            captureStopped: !0
        })
    }, extend = function () {
        let e = arguments[0],
            t = [].slice.call(arguments, 1);
        for (let o = 0; o < t.length; ++o) {
            let n = t[o];
            for (key in n) {
                let t = n[key];
                e[key] = "object" == typeof t ? extend("object" == typeof e[key] ? e[key] : {}, t) : t
            }
        }
        return e
    }, RECORD_HELPER = {
        wav: "recorderFormatWav.js",
        mp3: "recorderFormatMP3.js"
    }, DEFAULT_CONFIG = {
        workerDir: "/recorderHelpers/",
        numChannels: 2,
        encoding: "wav",
        options: {
            timeLimit: 1200,
            encodeAfterRecord: !0,
            progressInterval: 1e3,
            bufferSize: void 0,
            wav: {
                mimeType: "audio/wav"
            },
            mp3: {
                mimeType: "audio/mpeg",
                bitRate: 192
            }
        }
    };
class Recorder {
    constructor(e, t) {
        extend(this, DEFAULT_CONFIG, t || {}), this.context = e.context, null == this.context.createScriptProcessor && (this.context.createScriptProcessor = this.context.createJavaScriptNode), this.input = this.context.createGain(), e.connect(this.input), this.buffer = [], this.initWorker()
    }
    isRecording() {
        return null != this.processor
    }
    setEncoding(e) {
        this.isRecording() || this.encoding === e || (this.encoding = e, this.initWorker())
    }
    setOptions(e) {
        this.isRecording() || (extend(this.options, e), this.worker.postMessage({
            command: "options",
            options: this.options
        }))
    }
    startRecording() {
        if (!this.isRecording()) {
            let e = this.numChannels,
                t = this.buffer,
                o = this.worker;
            this.processor = this.context.createScriptProcessor(this.options.bufferSize, this.numChannels, this.numChannels), this.input.connect(this.processor), this.processor.connect(this.context.destination), this.processor.onaudioprocess = function (n) {
                for (var r = 0; r < e; ++r) t[r] = n.inputBuffer.getChannelData(r);
                o.postMessage({
                    command: "record",
                    buffer: t
                })
            }, this.worker.postMessage({
                command: "start",
                bufferSize: this.processor.bufferSize
            }), this.startTime = Date.now()
        }
    }
    cancelRecording() {
        this.isRecording() && (this.input.disconnect(), this.processor.disconnect(), delete this.processor, this.worker.postMessage({
            command: "cancel"
        }))
    }
    finishRecording() {
        this.isRecording() && (this.input.disconnect(), this.processor.disconnect(), delete this.processor, this.worker.postMessage({
            command: "finish"
        }))
    }
    cancelEncoding() {
        this.options.encodeAfterRecord && (this.isRecording() || (this.onEncodingCanceled(this), this.initWorker()))
    }
    initWorker() {
        null != this.worker && this.worker.terminate(), this.onEncoderLoading(this, this.encoding), this.worker = new Worker(this.workerDir + RECORD_HELPER[this.encoding]);
        let e = this;
        this.worker.onmessage = function (t) {
            let o = t.data;
            switch (o.command) {
                case "loaded":
                    e.onEncoderLoaded(e, e.encoding);
                    break;
                case "timeout":
                    e.onTimeout(e);
                    break;
                case "progress":
                    e.onEncodingProgress(e, o.progress);
                    break;
                case "complete":
                    e.onComplete(e, o.blob)
            }
        }, this.worker.postMessage({
            command: "init",
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.numChannels
            },
            options: this.options
        })
    }
    onEncoderLoading(e, t) { }
    onEncoderLoaded(e, t) { }
    onTimeout(e) { }
    onEncodingProgress(e, t) { }
    onEncodingCanceled(e) { }
    onComplete(e, t) { }
}