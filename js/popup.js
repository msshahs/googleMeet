document.addEventListener("DOMContentLoaded", () => {

    const startVideoButton = document.querySelector("button#start_video")
    const stopVideoButton = document.querySelector("button#stop_video")

    // adding event listeners

    startVideoButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabCapture.getMediaStreamId({ consumerTabId: tabs[0].id }, (streamId) => {
                console.log(streamId);
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'start_recording',
                    tabId: tabs[0].id,
                    streamId: streamId
                }, (response) => {
                    if (!chrome.runtime.lastError) {
                        console.log(response)
                    } else {
                        console.log(chrome.runtime.lastError)
                    }
                })
            });
        })
    })


    stopVideoButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stop_recording" }, (response) => {
                if (!chrome.runtime.lastError) {
                    console.log(response)
                } else {
                    console.log(chrome.runtime.lastError)
                }
            })
        })
    })
})