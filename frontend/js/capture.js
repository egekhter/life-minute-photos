photosApp.capture = {
    mediaRecorder: null,
    recordedChunks: [],
    recordWindow: function (sourceId) {
        const remote = require('@electron/remote');
        const { dialog } = remote;

        this.mediaRecorder = null;
        this.recordedChunks = [];

        let video_type = 'video/mov';

        const onDataAvailable = function (e) {
            photosApp.capture.recordedChunks.push(e.data);
        }

        const stopRecording = async function () {
            const blob = new Blob(photosApp.capture.recordedChunks, {
                type: video_type
            });

            const buffer = Buffer.from(await blob.arrayBuffer());

            photosApp.capture.recordedChunks = [];

            let saveDialog = dialog.showSaveDialog({
                buttonLabel: "Save Video",
                defaultPath: `life-minute-photos-video-${Date.now()}.mp4`,
            });

            try {
                let { canceled, filePath } = await saveDialog;

                if(canceled) return

                if (filePath) {
                    writeFile(filePath, buffer);
                }
            } catch(e) {
                console.error(e);
            }
        }

        const handleStream = function (stream) {
            photosApp.capture.mediaRecorder = new MediaRecorder(stream, {
                // mimeType: 'video/webm; codecs=vp9'
                videoBitsPerSecond: 2.5 * 1000 * 1000,
                mimeType: video_type,
            });
            photosApp.capture.mediaRecorder.ondataavailable = onDataAvailable;
            photosApp.capture.mediaRecorder.onstop = stopRecording;
            photosApp.capture.mediaRecorder.start();
        }

        return new Promise(async (resolve, reject) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId
                        }
                    }
                });

                handleStream(stream)
            } catch (e) {
                console.error(e);
            }
        });
    },
    stopRecording: function () {
        photosApp.capture.mediaRecorder.stop();
    }
}