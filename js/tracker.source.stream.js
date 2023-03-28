// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const stream = {

    /*
        Initialize video stream
     */
    init: function () {
        tracker.init();
        config.init.mode = 'stream';
        tracker.videoJS = videojs('video'); // initialize video.js
        tracker.video = document.querySelector("video#video, #video video");

        // initial settings
        tracker.video.autoPlay = false;
        tracker.video.loop = true;
        tracker.ready = true;

        // setup video events
        tracker.video.addEventListener('loadedmetadata', function () {
            tracker.log('Event: loadedmetadata');
            tracker.ready = true;
            render.showPlaybackControls();
        }, false);

        tracker.video.addEventListener('playing', function () {
            tracker.log('Event: playing');
            tracker.isWaiting = false;
            stream.onReady();
        }, false);

        tracker.video.addEventListener('play', function () {
            tracker.log('Event: play');
        }, false);

        tracker.video.addEventListener('error', function (e) {
            console.error(e);
            tracker.dispatch('videoerror', e);
            tracker.setStatus('Error');
        }, true);

        // setup play/pause event
        tracker.canvas.addEventListener("click", function () {
            video.playPauseClick();
        });
    },

    /*
        Load video stream from source using videoJS
     */
    load: function (src) {
        tracker.log('Loading source: ' + src);
        tracker.setStatus('Please wait...loading...');

        // cancel current frame update if present
        if (tracker.reqID != null) {
            window.cancelAnimationFrame(tracker.reqID);
        }

        if (tracker.wrapper != null) {
            tracker.wrapper.onLoad();
        }

        // pause, switch source and play new
        tracker.video.pause();
        tracker.videoJS.src({
            src: src,
            type: 'application/x-mpegURL',
        });
        tracker.ready = true;
        tracker.videoJS.play();
    },

    /*
        Launch video stream when ready
     */
    onReady: async function (e) {
        tracker.log('On Stream ready');

        if (tracker.wrapper != null) {
            tracker.wrapper.onReady();
        }

        // set dimensions
        tracker.video.width = tracker.video.videoWidth;
        tracker.video.height = tracker.video.videoHeight;
        tracker.canvas.width = tracker.video.videoWidth;
        tracker.canvas.height = tracker.video.videoHeight;

        // cancel current frame update if present
        if (tracker.reqID != null) {
            window.cancelAnimationFrame(tracker.reqID);
        }

        // init frame update
        tracker.reqID = window.requestAnimationFrame(video.frame);
    },
}