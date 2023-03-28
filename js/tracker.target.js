// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const target = {

    counter: { // counters
        on: 0, // counter TARGET ON
        leave: 0, // counter target leaved
    },
    interval: { // intervals
        leave: null, // leaved interval
    },

    checkIntervalTime: 50, // ms
    maxOnTargetCounter: 999,

    /*
        Check if target detected
     */
    handle: function () {
        let result = false;
        let idx = targets.objIdx;

        if (tracker.countDetected() > 0
            // if object still exists
            && typeof tracker.objects[idx] !== 'undefined'
            // if score
            && tracker.objects[idx].score >= config.target.detectMinScore
            // if in bounds or distance to point is close:
            && (keypoints.inBounding(targeting.cam, tracker.objects[idx].box)
                || (targeting.distCN.x <= config.target.threshold && targeting.distCN.y <= config.target.threshold))) {
            result = true;
            target.counter.on++; // TODO: move to interval (?)

            // prevent from going to infinity
            if (target.counter.on > target.maxOnTargetCounter) {
                target.counter.on = target.maxOnTargetCounter;
            }
        } else {
            target.counter.on = 0;
        }

        // if is target but has not time required
        if ((result && target.counter.on < config.target.minTime) || !targets.hasTarget()) {
            result = false;
        }

        // if on target
        if (result) {

            // check restrict to action area
            if (!config.area.enabled.action || area.inArea(targeting.cam, 'ACTION')) {
                // do action
                if (action.isEnabled() && !action.isActive() && target.counter.on >= config.action.timeout.start) {
                    action.start(); // start action execute
                }

                // on attack handle
                if (action.isActive()) {
                    action.update();
                }
            } else {
                // if area leaved then stop action now!
                if (action.isActive()) {
                    action.stop();
                }
            }

            // show status monit
            ui.statusAlert('target-lost', false); // hide TARGET LOST alert
            ui.statusAlert('target-locked', true, config.LANG.TARGET.ON_TARGET + ' (' + target.counter.on + ')'); // show ON TARGET alert

            if (!targets.isLocked() && targets.isLost()) { // lock object again if no target lock and lost
                targets.lock(false); // false = don't auto-clear search and lost state
                targets.lost = false; // clear only is lost here
            }

        } else {
            // stop current action if no target
            if (action.isActive()) {
                action.stop();
            }

            if (targets.isLocked() && (targets.isLost() || !targets.matched)) { // lock object again if locked and is lost and not matched
                targets.lock(false);  // false = don't auto-clear search and lost state
            }

            ui.statusAlert('target-locked', false);  // hide ON TARGET alert
        }
    },

    /*
        Handle checking for target lost
     */
    check: function () {
        // if locked and not matched then start counting target leave
        if (targets.isLocked() && !targets.hasTarget() && !targets.search) {
            if (target.interval.leave == null) {
                target.counter.leave = 0; // reset counter before init
                target.interval.leave = setInterval(function () {
                    target.onLost(); // call handler in interval
                }, target.checkIntervalTime);
            }
        }
    },

    /*
        On lost target interval loop handler
     */
    onLost: function () {
        // if not locked then do nothing
        if (targets.box.lock == null) {
            return;
        }

        target.counter.leave++;
        targets.search = true; // enable search mode

        // if not locked on single target then increase search area
        if (!config.target.single) {
            targets.resizeBoundings();
        }

        // show searching mode monit
        ui.statusAlert('target-lost', false);
        ui.statusAlert('target-searching', true, config.LANG.TARGET.SEARCHING + ' ' + (config.target.lostTime - target.counter.leave));

        // if searching timer reached (target is lost after searching)
        if (target.counter.leave > config.target.lostTime) {

            // if not single target
            if (!config.target.single) {

                // if current tmp object still exists (it is first available object)
                if (typeof tracker.objects[targets.tmpObjIdx] !== 'undefined') {
                    targets.box.lock = tracker.objects[targets.tmpObjIdx]['box'];
                    targets.objIdx = targets.tmpObjIdx;
                    //target.counter.leave = 0; // clear leave counter
                    targets.resetBoundings(); // reset lock and tmp bounding to zero coords
                    target.clr(); // clear leave counter, hide searching and mark target as LOST
                    targets.unlock(); // unlock from object

                    // if no object then unlock
                } else {
                    target.clr(); // clear leave counter, hide searching and mark target as LOST
                    targets.unlock(); // unlock from object
                }
            } else {
                target.clr(); // clear leave counter, hide searching and mark target as LOST
                targets.unlock(); // unlock from object
            }

            // if not locked then set is lost 
            if (!targets.isLocked()) {
                targets.lost = true;
            }
        }
    },

    /*
        Clear target lost
     */
    clr: function () {
        if (target.interval.leave != null) {
            clearInterval(target.interval.leave);
            target.interval.leave = null;
            target.counter.leave = 0;
            targets.lost = true;
            targets.search = false;
            ui.statusAlert('target-searching', false, '');
        }
    },
}