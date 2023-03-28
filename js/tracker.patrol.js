// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const patrol = {
    interval: null, // movement interval
    resumeTimer: null, // resume after paused timer
    paused: false, // if paused
    active: false, // if activated
    prevY: 0,

    /*
        Handle patrol
     */
    handle: function () {
        patrol.start();
    },

    /*
        Cancel patrol resuming
     */
    cancel: function () {
        if (patrol.resumeTimer != null) {
            patrol.pause(); // pause first
            clearTimeout(patrol.resumeTimer);
            patrol.resumeTimer = null;
        }
    },

    /*
        Resume patrol paused on target detection
     */
    resume: function () {
        if (patrol.resumeTimer == null) {
            patrol.resumeTimer = setTimeout(function () {
                // select direction using current position
                if (tracker.dx < 0) {
                    config.patrol.direction = 'RIGHT';
                } else {
                    config.patrol.direction = 'LEFT';
                }
                patrol.start();
                patrol.update();

            }, config.patrol.timeout);
        }
    },

    /*
        Running in interval if PATROL mode
     */
    update: function () {
        // if target found then send control to targeting 
        // (stop patroling and start tracking)
        if (targets.hasTarget()) {
            patrol.pause();
            patrol.stop();
            tracker.setTargetMode('FOLLOW');
            targeting.isControl = true;
            targeting.prevTarget = []; // previous coords of target
            targeting.prevNow = []; // previous coords of now
            targeting.prevCam = []; // prev
            return;

            // else take control here if no target found (continue patroling)
        } else {
            patrol.unpause();
            patrol.start();
            targeting.isControl = false;
            tracker.setTargetMode('PATROL');
        }

        // if paused outside then deactivate here
        if (patrol.isPaused()) {
            patrol.deactivate();
            return; // abort now!
        }

        // activate
        patrol.activate();

        // check if target is initialized in targeting, 
        // if not then create empty one and center it in X and Y axis
        if (targeting.target == null) {
            targeting.setTargetPoint({
                x: 0.5,
                y: 0.5
            });
        }

        // get max left and right x delta
        const minDelta = servo.getMinDelta(true);
        const maxDelta = servo.getMaxDelta(true);
        const minCoords = servo.getMinCoords(true);
        const maxCoords = servo.getMaxCoords(true);

        let maxDeltaLeft = servo.getMaxDelta(true).x;
        let maxDeltaRight = servo.getMinDelta(true).x;

        // check for area limit bounds
        if (config.area.enabled.patrol) {

            // get restrict area
            let a = config.area.box.patrol;
            let mid = area.getMiddleHeight(a, 'PATROL');

            // fix min/max Y
            if (mid < minCoords.y || mid > maxCoords.y) {
                mid = 0.5
            }

            // center target in middle of area Y axis
            targeting.target.y = mid;

            // update delta only if changed
            if (patrol.prevY != tracker.dy) {
                if (!config.area.world.patrol) {
                    tracker.dy = 0.5 - targeting.target.y;
                } else {
                    targeting.target.y = mid;
                    tracker.dy = 0.5 - targeting.target.y;
                }
                patrol.prevY = tracker.dy;
            }

            // needed copy here
            let box = {
                x1: a.xMin,
                y1: a.yMin,
                x2: a.xMin + a.width,
                y2: a.yMin + a.height
            };

            // convert to delta
            let boxDelta = {
                x1: 0.5 - box.x1,
                x2: 0.5 - (box.x1 + a.width),
                y1: 0.5 - box.y1,
                y2: 0.5 - (box.y1 + a.height)
            };

            // add delta if NOT world position
            if (!config.area.world.patrol) {
                box.x1 = (boxDelta.x1 * 2) - tracker.dx; // required multiply * 2
                box.x2 = (boxDelta.x2 * 2) - tracker.dx; // required multiply * 2
                maxDeltaLeft = box.x1;
                maxDeltaRight = box.x2;
            } else {
                maxDeltaLeft = 0.5 - box.x1;
                maxDeltaRight = 0.5 - box.x2;
            }
        } else {
            targeting.target.y = 0.5; // center target in Y axis
        }

        // fix min/max
        if (maxDeltaLeft < minDelta.x) {
            maxDeltaLeft = minDelta.x;
        } else if (maxDeltaLeft > maxDelta.x) {
            maxDeltaLeft = maxDelta.x
        }
        if (maxDeltaRight < minDelta.x) {
            maxDeltaRight = minDelta.x;
        } else if (maxDeltaRight > maxDelta.x) {
            maxDeltaRight = maxDelta.x
        }

        // right should be negative or smaller than left
        if (maxDeltaRight > maxDeltaLeft) {
            tmpLeft = maxDeltaRight;
            tmpRight = maxDeltaLeft;
            maxDeltaLeft = tmpLeft;
            maxDeltaLeft = tmpRight;
        }

        switch (config.patrol.direction) {
            // if direction = RIGHT - real angle starts from 90, 90 (center), screen angle starts from 0
            case 'RIGHT': // real angle from 180 to 0, dx from 0.9 to -0.9
                // movement from left to right on screen (from right to left in real)
                if (tracker.dx >= maxDeltaRight) { // >= -0.9dx
                    targeting.target.x += config.patrol.step; // target x++
                    tracker.dx -= config.patrol.step; // delta x++
                }
                // change direction if bound reached
                if (tracker.dx <= maxDeltaRight) {
                    targeting.prevTarget = [];
                    //targeting.target.x = 0.5; // jump to max x (-90)
                    tracker.dx = maxDeltaRight;
                    patrol.changeDirection(); // switch to left
                }
                break;

            // if direction = LEFT - real angle starts from 90, 90 (center), screen angle starts from 0
            case 'LEFT': // real angle from 0 to 180, dx from -0.9 to 0.9
                // movement from right to left on screen (from left to right in real)
                if (tracker.dx <= maxDeltaLeft) { // <= 0.9dx
                    targeting.target.x -= config.patrol.step; // target x--
                    tracker.dx += config.patrol.step; // delta x--
                }
                // change direction if bound reached
                if (tracker.dx >= maxDeltaLeft) {
                    targeting.prevTarget = [];
                    //targeting.target.x = 0.5; // jump to min x (90)
                    tracker.dx = maxDeltaLeft;
                    patrol.changeDirection(); // switch to right
                }
                break;
        }
    },

    /*
        Switch direction LEFT <> RIGHT
     */
    changeDirection: function () {
        // switch to
        switch (config.patrol.direction) {
            case 'LEFT':
                config.patrol.direction = 'RIGHT';
                break;
            case 'RIGHT':
                config.patrol.direction = 'LEFT';
                break;
        }
    },

    /*
        Start patrol interval
     */
    start: function () {

        // check if interval not started
        if (patrol.interval == null) {

            // set to center at start
            targeting.cam = {
                x: 0.5,
                y: 0.5
            };

            // start loop
            patrol.interval = setInterval(function () {
                patrol.update();
            }, config.patrol.interval); // 10
        }
    },

    /*
        Activate patrol
     */
    activate: function () {
        patrol.active = true;
    },

    /*
        Deactivate patrol
     */
    deactivate: function () {
        patrol.active = false;
    },

    /*
        Pause patrol
     */
    pause: function () {
        patrol.paused = true;
    },

    /*
        Unpause patrol
     */
    unpause: function () {
        patrol.paused = false;
    },

    /*
        Stop patrol
     */
    stop: function () {
        if (patrol.interval != null) {
            clearInterval(patrol.interval);
            patrol.interval = null;
        }
    },

    /*
        Return paused status
     */
    isPaused: function () {
        return patrol.paused;
    },

    /*
        Return activated status
     */
    isActive: function () {
        return patrol.active;
    },
}