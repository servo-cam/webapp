// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const tracker = {

    // config options
    wrapper: null, // model wrapper
    hooks: { // user defined hooks/events
        'beforeupdate': [], // before poses update
        'afterupdate': [], // after poses update
        'statuschange': [], // when status change
        'detectorerror': [], // if detector error 
        'videoerror': [] // if video error
    },

    remoteStatus: '', // remote status

    // internals
    reqID: null, // requested frame ID
    isPlaying: false, // bool, current playback state
    isWaiting: false, // bool, waiting for video state
    isInitialized: false,
    started: false,
    ready: false,
    objects: [], // predictions
    video: null, // DOMElement with vidoe
    canvas: null, // DOMElement with canvas 
    ctx: null, // canvas context instance
    sourceCanvas: null, // DOMElement with canvas 
    sourceCtx: null, // canvas context instance
    status: '', // current status message
    anchors3D: [ // 3D keypoints anchors
        [0, 0, 0],
        [0, 1, 0],
        [-1, 0, 0],
        [-1, -1, 0]
    ],
    scatterGL: null, // ScatterGL instance
    scatterGLEl: null, // DOMElement with ScatterGL container
    scatterGLInitialized: false, // bool, ScatterGL initialization state
    videoJS: null, // videoJS intance 
    dx: 0, // x movement delta
    dy: 0, // y movement delta
    mouseX: 0, // current mouse X coord
    mouseY: 0, // current mouse Y coord

    /*
        Run predictions
     */
    run: function (source) {
        // prepare system, cache joints, etc.
        if (!tracker.isInitialized) {
            tracker.prepare();
        }

        switch (source) {
            case 'VIDEO':
                video.init();
                break;
            case 'CAMERA':
                camera.init();
                break;
            case 'STREAM':
                stream.init();
                break;
            case 'REMOTE':
                remote.init();
                break;
        }
    },

    /*
        Prepare model and config
     */
    prepare: function () {
        if (tracker.wrapper == null) {
            return;
        }

        tracker.wrapper.onPrepare();
        tracker.isInitialized = true;
    },

    /*
        Initialize ScatterGL
     */
    init3D: function () {
        if (tracker.scatterGLEl == null) {
            return;
        }
        // init and store instance
        tracker.scatterGL = new ScatterGL(tracker.scatterGLEl, {
            'rotateOnStart': true,
            'selectEnabled': false,
            'styles': {
                polyline: {
                    defaultOpacity: 1,
                    deselectedOpacity: 1,
                },
                fog: {
                    enabled: false,
                },
            },
        });
    },

    /*
        Initialize core elements
     */
    init: function () {
        tracker.log('Initializing...');

        // init elements
        tracker.video = document.querySelector(config.dom.video);
        tracker.canvas = document.querySelector(config.dom.canvas),
            tracker.sourceCanvas = document.querySelector(config.dom.source_canvas),
            tracker.scatterGLEl = document.querySelector(config.dom.scatter3d);
        tracker.ctx = tracker.canvas.getContext("2d");
        tracker.sourceCtx = tracker.sourceCanvas.getContext("2d");

        if (tracker.wrapper == null) {
            return;
        }

        tracker.wrapper.onInit(); // also initialize wrapper
    },

    /*
        Handle predictions and draw them on canvas
     */
    handle: function () {

        // pre-build bounding, center, etc...
        if (tracker.wrapper != null) {
            tracker.wrapper.beforeUpdate();
        }

        // run user defined hooks
        tracker.dispatch('beforeupdate', null);

        // handle all, draw points and overlays
        render.append();

        // handle mouse move and click events
        ui.handlePointerEvents();

        // run user defined hooks
        tracker.dispatch('afterupdate', null);
    },

    /*
        Handle on frame objects detection
     */
    detect: function () {
        if (config.core.enableAI && tracker.video != null) {
            try {
                if (tracker.wrapper != null) {
                    tracker.wrapper.onFrame();
                }
            } catch (err) {
                tracker.dispatch('detectorerror', err);
                console.error(err);
            }
        }
    },

    /*
        Clear canvas area
     */
    clearCanvas: function () {
        tracker.ctx.save();
        tracker.ctx.setTransform(1, 0, 0, 1, 0, 0);
        tracker.ctx.clearRect(0, 0, tracker.canvas.width, tracker.canvas.height);
        tracker.ctx.restore();
    },

    /*
        Log message
     */
    log: function (...args) {
        if (config.core.log) {
            dbg_console.log('[TRACKER] ', ...args);
        }
    },

    /*
        Set status message
     */
    setStatus: function (msg) {
        tracker.status = msg;
        tracker.dispatch('statuschange', tracker.status);
    },

    /*
        Append external hook/event
     */
    on: function (name, hook) {
        if (typeof tracker.hooks[name] === 'undefined') {
            return;
        }
        tracker.hooks[name].push(hook);
    },

    /*
        Dispatch hook/event
     */
    dispatch: function (name, event) {
        if (typeof tracker.hooks[name] === 'undefined') {
            return;
        }
        for (const hook of tracker.hooks[name]) {
            hook(event, tracker);
        }
    },

    /*
        Pre-initialize model by name
     */
    setModel: function (model) {
        config.init.modelName = model;
        tracker.wrapper.onSetModel(model);
    },

    /*
        Assign model wrapper
     */
    setWrapper: function (wrapper) {
        tracker.wrapper = wrapper;
    },

    /*
        Set target mode
     */
    setTargetMode: function (mode) {
        config.target.mode = mode;
    },

    /*
        Count detected objects with score
     */
    countDetected: function () {
        let i = 0;
        if (tracker.objects) {
            for (obj of tracker.objects) {
                if (obj.score >= config.model.minScore) {
                    i++;
                }
            }
        }
        return i;
    },
};