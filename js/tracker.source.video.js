// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const video = {

    started: false, // is started

    /*
        Initialize video
     */
    init: async function () {
        tracker.init(); // initialize
        config.init.mode = 'video';

        // setup video
        tracker.video.autoPlay = true;
        tracker.video.loop = true;
        tracker.ready = true;

        // setup video events
        tracker.video.addEventListener('loadedmetadata', function () {
            tracker.log('Event: loadedmetadata');
            tracker.ready = true;
            render.showPlaybackControls();
            //this.currentTime = 210; // optional - set video start time
        }, false);

        tracker.video.addEventListener('playing', function () {
            tracker.log('Event: playing');
            tracker.isWaiting = false;
            if (!tracker.isPlaying) {
                video.onReady();
                tracker.isPlaying = true;
            }
        }, false);

        tracker.video.addEventListener('play', function () {
            tracker.log('Event: play');
        }, false);

        tracker.video.addEventListener('error', function (e) {
            console.error(e);
            tracker.dispatch('videoerror', e);
            tracker.setStatus('Error');
        }, true);

        // setup play/pause click event
        tracker.canvas.addEventListener("click", function () {
            if (!video.started) {
                video.playPauseClick();
            }
            video.started = true;
        });
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
        tracker.video.width = tracker.video.videoWidth;
        tracker.video.height = tracker.video.videoHeight;
        tracker.canvas.width = tracker.video.videoWidth;
        tracker.canvas.height = tracker.video.videoHeight;
        tracker.ready = true;
        tracker.started = false;

        // init frame update
        tracker.reqID = window.requestAnimationFrame(video.frame);

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
        Load video from source address
     */
    load: async function (src) {
        tracker.log('Loading source: ' + src);
        tracker.setStatus('Please wait...loading...');
        tracker.isPlaying = false; // allow new initialization

        // cancel current frame update if present
        if (tracker.reqID != null) {
            window.cancelAnimationFrame(tracker.reqID);
        }

        if (tracker.wrapper != null) {
            tracker.wrapper.onLoad();
        }

        tracker.started = false;
        tracker.video.pause(); // pause, change source and play new
        tracker.video.src = src;
        tracker.ready = true;
        tracker.video.play();
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
                tracker.detect();
            }

            // clear canvas
            tracker.clearCanvas();

            // draw video frame on canvas
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

                tracker.sourceCanvas.width = tracker.video.videoWidth;
                tracker.sourceCanvas.height = tracker.video.videoHeight;

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

                tracker.sourceCtx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw source ctx              
                tracker.ctx.drawImage(tracker.video, xOffset, yOffset, w, h); // draw destination ctx

                tracker.started = true;
            }

            // handle detected objects
            tracker.handle();
        }

        // next frame
        tracker.reqID = window.requestAnimationFrame(video.frame);
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