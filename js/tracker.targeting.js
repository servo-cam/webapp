// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const targeting = {

    initialized: false, // true if all initialized
    started: false, // true if started    
    isControl: true,

    distNT: {x: 0, y: 0}, // distance from now to target
    percNT: {x: 0, y: 0}, // percent from now to target
    distCN: {x: 0, y: 0}, // distance from center to now
    percCN: {x: 0, y: 0}, // percent from center to now

    move: {up: false, down: false, left: false, right: false}, // movement active/inactive    
    speed: {x: 0, y: 0}, // servo move speed
    th: {x: 0, y: 0}, // to target distance threshold
    power: {x: 0, y: 0}, // move power    

    target: null, // current target point
    now: {x: 0.5, y: 0.5}, // target now point
    cam: {x: 0.5, y: 0.5}, // center of image

    // previous coords (for filtering)
    prevTarget: [], // previous coords of target
    prevNow: [], // previous coords of now
    prevCam: [], // previous coords of cam
    beforeTarget: null, // x, y of before movement target

    /*
        Initialize defaults
     */
    init: function () {
        // init servo at default position
        targeting.prevCommand = {
            x: config.servo.initAngle.x,
            y: config.servo.initAngle.y,
        };
        targeting.nextCommand = {
            x: config.servo.initAngle.x,
            y: config.servo.initAngle.y,
        };
    },

    /*
        On frame update
     */
    update: function () {

        // initialize variables
        if (!targeting.initialized) {
            targeting.init();
            targeting.initialized = true;
        }

        // clear if no targets detected
        if (tracker.objects.length == 0) {
            // target.leave();
            // else if only one target
        } else if (tracker.objects.length == 1) {
            // clear if no score
            if (keypoints.score < config.model.minScore) {
                // target.leave();
            }
        }

        // prepare initial cam and now points
        targeting.prepare();

        // choose target object idx
        const objIdx = targets.choose();

        if ((config.target.mode == 'MANUAL' || config.target.mode == 'MOUSE')
            && config.manual.mode == 'TARGET') {
            // target is controlled manually here
        } else {
            // choose or change target point if target is matched
            if (targeting.hasControl()) {
                if (targets.hasTarget()) {
                    targeting.target = targets.getTargetPoint(config.target.point, objIdx);
                } else {
                    targeting.target = null;
                }
            }
        }

        if (targeting.target == null) {
            targeting.target = targeting.beforeTarget;
        }

        // prepare now to target distance and percent value
        if (targeting.target != null) {

            // check allowed target area        
            if (!config.area.enabled.target || area.inArea(targeting.target, 'TARGET')) {
                targeting.beforeTarget = targeting.target;
                targeting.preparePosition();
            } else {
                targeting.target = null;
            }

        } else {
            // if no target or target leaved then stop servo - do not move to empty space
            if (targeting.hasControl() && config.target.mode == 'FOLLOW'
                && config.target.brake && targeting.beforeTarget != null) {

                // check allowed target area
                if (!config.area.enabled.target || area.inArea(targeting.cam, 'TARGET')) {
                    targeting.now = targeting.cam; // stop servo movement immediately!
                }
            }
        }

        // prepare now movement power
        targeting.preparePower();

        // move current target (now) towards destination target
        if (targeting.target != null) {
            targeting.updatePosition();
        }

        // prepare distance from now to center and delta movement speed and threshold
        targeting.prepareMovement();

        // init/reset servo movement
        targeting.initMovement();

        // store previous coords
        targeting.handlePrev();

        // smooth current coords
        targeting.smoothCoords();

        // target mode controller
        switch (config.target.mode) {
            case 'IDLE':
                // do nothing
                break;

            case 'PATROL':
                targeting.setControl(false); // disable control here
                patrol.handle(); // handle movement in patrol mode

                if (!config.render.locked) {
                    targeting.setMovement();
                }
                break;

            case 'FOLLOW':
                targeting.setControl(true); // enable control here
                targeting.setMovement();
                if (patrol.isPaused()) { // if patrol was activated and it's only paused
                    if (!targets.hasTarget()) {
                        patrol.resume(); // if no target then resume patrol
                    } else {
                        patrol.cancel(); // if target detected then cancel patrol
                    }
                }
                break;

            case 'MANUAL':
                manual.keyControl(); // keyboard control
                break;

            case 'MOUSE':
                manual.mouseControl(); // mouse control
                break;
        }

        // if no control here then stop action now!
        if (!targeting.hasControl()) {
            if (action.isActive()) {
                action.stop(); // stop action execute
            }
        } else {
            // if controllerd here then handle target detection
            target.handle();
        }

        // move delta
        targeting.transformMovement();

        // render overlay
        if (config.render.view) {
            render.drawTargetData();
        }
    },

    /*
        Prepare initial cam and now points
     */
    prepare: function () {
        // locked central point
        if (config.render.locked) {
            targeting.cam.x = 0.5;
            targeting.cam.y = 0.5;
        } else {
            // freelook
            targeting.cam.x = 0.5 - tracker.dx;
            targeting.cam.y = 0.5 - tracker.dy;
        }

        // init now at center
        if (!targeting.started) {
            targeting.now.x = 0.5;
            targeting.now.y = 0.5;
            targeting.started = true;
        }
    },

    /*
        Prepare now to target distance and percent value
     */
    preparePosition: function () {
        // distance now <> target
        targeting.distNT.x = Math.abs(targeting.now.x - targeting.target.x);
        targeting.distNT.y = Math.abs(targeting.now.y - targeting.target.y);

        // percentage distance now <> target
        targeting.percNT.x = targeting.distNT.x * 100;
        targeting.percNT.y = targeting.distNT.y * 100;

        // fix
        if (isNaN(targeting.percNT.x)) {
            targeting.percNT.x = 0.0;
        }
        if (isNaN(targeting.percNT.y)) {
            targeting.percNT.y = 0.0;
        }
    },

    /*
        Prepare now movement power
     */
    preparePower: function () {
        targeting.power.x = (targeting.percNT.x * config.target.delayMultiplier) / 100;
        targeting.power.y = (targeting.percNT.y * config.target.delayMultiplier) / 100;

        // fix
        if (isNaN(targeting.power.x)) {
            targeting.power.x = 0.0;
        }
        if (isNaN(targeting.power.y)) {
            targeting.power.y = 0.0;
        }
    },

    /*
        Move current target (now) towards destination target
     */
    updatePosition: function () {
        if ((config.target.mode == 'MANUAL' || config.target.mode == 'MOUSE')
            && config.manual.mode == 'NOW') {
            // controlled manually (outside)
        } else {
            // smooth movement
            if (config.target.smoothFollow) {
                // x axis
                if (targeting.target.x > targeting.now.x) {
                    targeting.now.x += targeting.power.x;
                } else if (targeting.target.x < targeting.now.x) {
                    targeting.now.x -= targeting.power.x;
                }
                // y axis
                if (targeting.target.y > targeting.now.y) {
                    targeting.now.y += targeting.power.y;
                } else if (targeting.target.y < targeting.now.y) {
                    targeting.now.y -= targeting.power.y;
                }
                // direct movement
            } else {
                targeting.now.x = targeting.target.x;
                targeting.now.y = targeting.target.y;
            }
        }

        // get min and max coords
        const max = servo.getMaxCoords(true);
        const min = servo.getMinCoords(true);

        // fix only if target is controlled here, without this check patrol will be blocked when bounds reached
        if (targeting.hasControl()) {
            if (targeting.now.x > max.x) {
                targeting.now.x = max.x;
            }
            if (targeting.now.x < min.x) {
                targeting.now.x = min.x;
            }
            if (targeting.now.y > max.y) {
                targeting.now.y = max.y;
            }
            if (targeting.now.y < min.y) {
                targeting.now.y = min.y;
            }
        }
    },

    /*
        Prepare distance from now to center and delta movement speed and threshold
     */
    prepareMovement: function () {
        // distance cam center <> now
        targeting.distCN.x = Math.abs(targeting.cam.x - targeting.now.x);
        targeting.distCN.y = Math.abs(targeting.cam.y - targeting.now.y);

        // percentage distance cam center <> now
        targeting.percCN.x = targeting.distCN.x * 100;
        targeting.percCN.y = targeting.distCN.y * 100;

        // delta movement speed
        targeting.speed.x = (targeting.percCN.x * config.target.speedMultiplier) / 100; // servo move speed
        targeting.speed.y = (targeting.percCN.y * config.target.speedMultiplier) / 100; // servo move speed

        // delta movement threshold
        targeting.th.x = targeting.speed.x * config.target.smoothMultiplier; // servo braking threshold
        targeting.th.y = targeting.speed.y * config.target.smoothMultiplier; // servo braking threshold
    },

    /*
        Init servo movement
     */
    initMovement: function () {
        // reset all
        targeting.move.up = false;
        targeting.move.down = false;
        targeting.move.left = false;
        targeting.move.right = false;
    },

    /*
        Enable or disable movement
     */
    setMovement: function () {
        // x axis   
        if (targeting.now.x < (targeting.cam.x - targeting.th.x)) {
            targeting.move.left = true;
        } else if (targeting.now.x > (targeting.cam.x + targeting.th.x)) {
            targeting.move.right = true;
        }
        // y axis
        if (targeting.now.y < (targeting.cam.y - targeting.th.y)) {
            targeting.move.up = true;
        } else if (targeting.now.y > (targeting.cam.y + targeting.th.y)) {
            targeting.move.down = true;
        }
    },

    /*
        Move delta
     */
    transformMovement: function () {
        // stop if no target
        if (targeting.hasControl() && !targets.hasTarget()) {
            return;
        }

        // get min and max delta
        const min = servo.getMinDelta(true);
        const max = servo.getMaxDelta(true);

        // smooth movement, increasing speed step by step
        if (config.target.smoothCamera) {
            if (targeting.move.left) {
                if (tracker.dx <= max.x) {
                    tracker.dx += targeting.speed.x;
                }
            }
            if (targeting.move.right) {
                if (tracker.dx >= min.x) {
                    tracker.dx -= targeting.speed.x;
                }
            }
            if (targeting.move.up) {
                if (tracker.dy <= max.y) {
                    tracker.dy += targeting.speed.y;
                }
            }
            if (targeting.move.down) {
                if (tracker.dy >= min.y) {
                    tracker.dy -= targeting.speed.y;
                }
            }

            // direct movement, set fixed speed
        } else {
            if (targeting.move.left) {
                if (tracker.dx <= max.x) {
                    tracker.dx = 0.5 - targeting.now.x;
                }
            }
            if (targeting.move.right) {
                if (tracker.dx >= min.x) {
                    tracker.dx = 0.5 - targeting.now.x;
                }
            }
            if (targeting.move.up) {
                if (tracker.dy <= max.y) {
                    tracker.dy = 0.5 - targeting.now.y;
                }
            }
            if (targeting.move.down) {
                if (tracker.dy >= min.y) {
                    tracker.dy = 0.5 - targeting.now.y;
                }
            }
        }
    },

    /*
       Check if has target
     */
    hasTargetPoint: function () {
        if (targeting.target != null) {
            return true;
        }
        return false;
    },

    /*
        Check if has control here
     */
    hasControl: function () {
        return targeting.isControl;
    },

    /*
        Enable or disable control here
     */
    setControl: function (value = true) {
        targeting.isControl = value;
    },

    /*
        Set current target coords
     */
    setTargetPoint: function (target) {
        targeting.target = target;
    },

    /*
        Smooth with previous coords
     */
    smoothCoords: function () {
        // disable if no control here
        if (!targeting.isControl) {
            return;
        }

        if (config.target.mean.target && targeting.target != null) {
            targeting.target = keypoints.calculateMeanCoordinate(targeting.prevTarget);
        }
        if (config.target.mean.now && targeting.now != null) {
            targeting.now = keypoints.calculateMeanCoordinate(targeting.prevNow);
        }
        if (config.target.mean.camera && targeting.cam != null) {
            targeting.cam = keypoints.calculateMeanCoordinate(targeting.prevCam);
        }
    },

    /*
        Update previous coords
     */
    handlePrev: function () {
        if (targeting.target != null) {
            targeting.prevTarget = targeting.storePrev(targeting.target,
                targeting.prevTarget,
                config.target.meanStep.target,
                config.target.meanDepth.target);
        }
        if (targeting.now != null) {
            targeting.prevNow = targeting.storePrev(targeting.now,
                targeting.prevNow,
                config.target.meanStep.now,
                config.target.meanDepth.now);
        }
        if (targeting.cam != null) {
            targeting.prevCam = targeting.storePrev(targeting.cam,
                targeting.prevCam,
                config.target.meanStep.camera,
                config.target.meanDepth.camera);
        }
    },

    /*
        Store precious coord
     */
    storePrev: function (element, array, tolerance, depth) {
        if (array != null && array.length > 0) {
            if (keypoints.getCoordDistance(array[0], element) < tolerance) {
                return array;
            }
        }

        array.unshift(element);
        if (array.length > depth) {
            array.pop();
        }
        return array;
    },

    /*
        Center screen / reset all points
     */
    center: function () {
        targeting.target = null;
        targeting.now = {x: 0.5, y: 0.5};
        targeting.cam = {x: 0.5, y: 0.5};
        targeting.prevTarget = [];
        targeting.prevNow = [];
        targeting.prevCam = [];
        targeting.beforeTarget = null;

        tracker.dx = 0;
        tracker.dy = 0;
    },
}