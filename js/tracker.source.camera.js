// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const camera = {

    stream: null, // video stream from camera    
    isList: false,

    /*
        Get list of available camera devices
     */
    getDevices: function (mediaDevices) {
        const select = document.getElementById('camera_select');
        select.innerHTML = '';
        let option = document.createElement('option');
        option.value = '';
        let label = '--SELECT CAMERA--';
        let textNode = document.createTextNode(label);
        option.appendChild(textNode);
        select.appendChild(option);

        let count = 1;
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                option = document.createElement('option');
                option.value = mediaDevice.deviceId;
                label = mediaDevice.label || `Camera ${count++}`;
                textNode = document.createTextNode(label);
                option.appendChild(textNode);
                select.appendChild(option);
            }
        });
        camera.isList = true;
    },

    /*
        Stop all tracks
     */
    stop: function (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
    },

    /*
        Initialize camera
     */
    init: async function () {
        tracker.init();
        config.init.mode = 'camera';

        // init camera
        try {
            camera.onReady();
        } catch (e) {
            tracker.dispatch('videoerror', e);
            console.error(e);
        }
    },

    /*
        Select camera device
     */
    selectDevice: async function (deviceId) {
        if (!camera.isList) {
            navigator.mediaDevices.enumerateDevices().then(camera.getDevices);
        }

        config.camera.deviceId = deviceId;
        if (camera.stream != null) {
            camera.stop(camera.stream);
        }

        try {
            window.cancelAnimationFrame(tracker.reqID);
            tracker.reqID = null;
            camera.onReady();
        } catch (e) {
            tracker.dispatch('videoerror', e);
            console.error(e);
        }
    },

    /*
        Set-up camera
     */
    setup: async function () {
        tracker.setStatus('Please wait...initializing camera...');

        // init device
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Browser API navigator.mediaDevices.getUserMedia not available");
            throw new Error(
                "Browser API navigator.mediaDevices.getUserMedia not available"
            );
        }

        // get available camera devices
        if (config.camera.deviceId == null || !camera.isList) {
            navigator.mediaDevices.enumerateDevices().then(camera.getDevices);
        }

        // video configuration
        let constraints = {
            audio: false,
            video: {
                width: {
                    ideal: config.camera.resolution.x
                },
                height: {
                    ideal: config.camera.resolution.y
                },
            }
        };

        // append camera device Id
        if (config.camera.deviceId != null) {
            constraints['video']['deviceId'] = {exact: config.camera.deviceId};
        }

        // get stream
        camera.stream = await navigator.mediaDevices.getUserMedia(constraints);
        tracker.video.srcObject = camera.stream; // attach camera stream to video

        // get width and height of the camera video stream
        tracker.video.width = camera.stream.getVideoTracks()[0].getSettings().width;
        tracker.video.height = camera.stream.getVideoTracks()[0].getSettings().height;

        tracker.started = false;

        return new Promise((resolve) => {
            tracker.video.onloadedmetadata = () => resolve(tracker.video);
        });
    },

    onReady: async function () {
        if (tracker.wrapper != null) {
            tracker.wrapper.onReady();
        }

        tracker.video = await camera.setup();
        tracker.video.play();
        camera.frame();
        tracker.ready = true;

        // detect using interval
        if (config.core.update_method == 'INTERVAL') {
            setInterval(() => {
                if (tracker.ready) {
                    tracker.detect();
                }
            }, 1000 / config.core.update_fps);
        }
    },

    /*
        Render camera frame
     */
    frame: async function () {

        tracker.setStatus(''); // clear status        

        if (tracker.video.readyState === tracker.video.HAVE_ENOUGH_DATA) {

            // detect using RAF
            if (config.core.update_method == 'RAF') {
                tracker.detect();
            }

            if (config.camera.deviceId != null && camera.isList) {
                $('#camera_select').val(config.camera.deviceId);
            }

            // clear canvas
            tracker.clearCanvas();

            // draw video frame from camera on canvas
            if (config.core.enableVideo && config.render.view) {
                let w = tracker.video.videoWidth;
                let h = tracker.video.videoHeight;
                let xOffset = 0;
                let yOffset = 0;

                const view = upscaler.fit();
                const vidSize = upscaler.getVideoSize();
                const canvasSize = upscaler.getCanvasSize();

                // if servo movement simulation then append delta offset
                if (config.render.simulator) {
                    const d = upscaler.denormalize({x: tracker.dx, y: tracker.dy});
                    xOffset = d.x;
                    yOffset = d.y;
                }

                // setup dimensions
                tracker.canvas.width = tracker.video.videoWidth;
                tracker.canvas.height = tracker.video.videoHeight;
                tracker.sourceCanvas.width = tracker.video.videoWidth;
                tracker.sourceCanvas.height = tracker.video.videoHeight;

                // rescaling
                if (config.render.resize) {
                    w = view.width;
                    h = view.height;
                    xOffset += (canvasSize.width - view.width) / 2;
                }

                tracker.sourceCtx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw source ctx              
                tracker.ctx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw destination ctx

                tracker.started = true;
            }
        }

        // handle predictions
        tracker.handle();

        // next frame
        tracker.reqID = window.requestAnimationFrame(camera.frame);
    },
}