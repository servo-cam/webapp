// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const remote = {

    started: false, // is started
    path: '', // path to video stream
    isConnection: false,

    // append security token
    appendToken: function () {
        if (config.security.webToken != '' && config.security.webToken != null) {
            return '?token=' + config.security.webToken;
        }
    },

    /*
        Initialize video
     */
    init: async function () {
        // initialize
        tracker.init();
        config.init.mode = 'remote';

        if (app.sourceRemote == '') {
            return;
        }

        // setup video
        tracker.video.autoPlay = true;
        tracker.video.loop = true;
        tracker.ready = true;
        tracker.started = false;

        tracker.video = document.getElementById('remote');

        await remote.onReady();
    },

    /*
        Launch video when ready
     */
    onReady: async function (e) {
        tracker.log('On Video ready');

        // cancel current frame update if present
        if (tracker.reqID != null) {
            window.cancelAnimationFrame(tracker.reqID);
        }

        if (tracker.wrapper != null) {
            await tracker.wrapper.onReady();
        }

        // set dimensions
        tracker.video.width = 640;
        tracker.video.height = 480;
        tracker.video.videoWidth = 640;
        tracker.video.videoHeight = 480;
        tracker.canvas.width = 640;
        tracker.canvas.height = 480;
        tracker.ready = true;
        tracker.started = false;

        // detect using interval
        if (config.core.update_method == 'INTERVAL') {
            setInterval(() => {
                if (tracker.ready) {
                    tracker.detect();
                }
            }, 1000 / config.core.update_fps);
        }

        remote.frame();
    },

    /*
        Load video from source address
     */
    load: async function (src) {
        src += remote.appendToken();
        console.log(src)

        tracker.log('Loading source: ' + src);

        try {
            var http = new XMLHttpRequest();
            http.open('HEAD', src, false);
            http.send();
            if (http.status == 200) {
                // ok
                remote.isConnection = true;
            }
        } catch (err) {
            console.error(err);
            alert('Invalid address or connection problem!');
            return;
        }

        $('#remote').attr('src', src);
        $('#video source').attr('src', src);

        if (tracker.wrapper != null) {
            tracker.wrapper.onLoad();
        }

        tracker.isPlaying = false; // allow new initialization

        // cancel current frame update if present
        if (tracker.reqID != null) {
            window.cancelAnimationFrame(tracker.reqID);
        }

        tracker.video.src = src;
        try {
            await remote.init();
            remote.frame();
            tracker.ready = true;
            tracker.started = false;
        } catch (err) {
            alert('Invalid address or connection problem!');
            console.error(err);
        }
    },

    /*
        Render video frame
     */
    frame: async function () {

        tracker.setStatus('');

        // check if video is ready
        if (tracker.ready) {

            // detect using RAF
            if (config.core.update_method == 'RAF') {
                if (tracker.started) {
                    tracker.detect();
                }
            }

            // clear canvas
            tracker.clearCanvas();

            // draw video frame on canvas
            if (config.core.enableVideo && config.render.view) {
                let w = tracker.video.videoWidth;
                let h = tracker.video.videoHeight;
                let xOffset = 0;
                let yOffset = 0;

                let view = upscaler.fit();
                let vidSize = upscaler.getVideoSize();
                let canvasSize = upscaler.getCanvasSize();

                // if servo movement simulation then append delta offset
                if (config.render.simulator) {
                    const d = upscaler.denormalize({x: tracker.dx, y: tracker.dy});
                    xOffset = d.x;
                    yOffset = d.y;
                }

                // rescaling
                if (config.render.resize) {
                    w = view.width;
                    h = view.height;
                    xOffset += (canvasSize.width - view.width) / 2;
                } else {
                    // setup dimensions
                    tracker.canvas.width = tracker.video.videoWidth;
                    tracker.canvas.height = tracker.video.videoHeight;
                }

                try {
                    if (tracker.sourceCtx && tracker.video != null) {
                        tracker.sourceCtx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw source ctx              
                        tracker.ctx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw destination ctx
                        tracker.started = true;
                    }
                } catch (error) {
                    console.error(error);
                }
            }

            if (tracker.started) {
                // handle detected poses
                tracker.handle();
            }
        }

        // next frame
        tracker.reqID = window.requestAnimationFrame(remote.frame);
    },

    /*
        Handle play/pause click on video
     */
    playPauseClick: function () {
        if (tracker.ready) {
            if (tracker.video.paused) {
                tracker.log('click: Play');
                tracker.video.play();
                tracker.isWaiting = true;
                tracker.setStatus('Please wait...');
            } else {
                // abort if waiting for playing
                if (!tracker.isWaiting) {
                    tracker.log('click: Pause');
                    tracker.video.pause();
                    tracker.setStatus('Paused.');
                }
            }
        }
    },
}