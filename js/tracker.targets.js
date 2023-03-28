// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const targets = {

    objIdx: 0, // current obj Idx
    tmpObjIdx: 0, // current tmp obj Idx
    identifier: -1, // current obj Identifier
    tmpIdentifier: -1, // current tmp obj Identifier
    changeIdx: null, // switch to Idx

    box: { // current boxes
        last: [], // indexed array with last objIdx boundings
        lock: { // lock bounding
            xMin: 0,
            yMin: 0,
            width: 0,
            height: 0,
        },
        current: { // tmp lock bounding
            xMin: 0,
            yMin: 0,
            width: 0,
            height: 0,
        },
    },

    center: { // current center points
        last: { // last target
            x: 0,
            y: 0,
        },
        current: { // current tmp target
            x: 0,
            y: 0,
        },
    },

    matchType: '', // match target mode

    lost: false,  // is target lost
    search: false, // is search mode
    matched: false, // is target matched
    isTarget: false, // is current target

    /*
        Choose target idx
     */
    choose: function () {
        render.buildTargetButtons();
        targets.handleSwitch();

        // get current target candidate
        let current = finder.find(); // not allowed targets are filtered in filters
        if (typeof current !== 'undefined' && current != null) {
            targets.matched = true;
        } else {
            targets.matched = false;
        }

        targets.assign(current);
        render.updateTargetButtons();

        targets.isTarget = targets.matched;

        if (targets.hasTarget()) {
            targets.objIdx = current; // update current objIdx with current
            targets.tmpObjIdx = targets.objIdx; // update current objIdx with current
        }

        // check for target lost
        target.check();

        // clear target lost counter
        if (!targets.isLocked() || targets.hasTarget()) {
            target.clr();
        }

        // check if object is found
        if (current == null || typeof tracker.objects[current] === 'undefined') {
            return null;
        }

        // update object identifier
        if (typeof tracker.objects[current]['id'] !== 'undefined') {
            targets.identifier = tracker.objects[current]['id'];
            targets.tmpIdentifier = targets.identifier;
        }

        return targets.objIdx;
    },

    /*
        Assign current target
     */
    assign: function (idx) {
        if (idx == null) {
            return;
        }

        if (typeof tracker.objects[idx] !== 'undefined' && tracker.objects[idx]['center'].x != null) {
            targets.center.last = tracker.objects[idx]['center'];
            targets.center.current = targets.center.last;
            targets.box.current = tracker.objects[idx]['box'];

            if (targets.isLocked()) {
                targets.box.lock = targets.box.current;
            }
            if (typeof tracker.objects[idx]['id'] !== 'undefined') {
                targets.identifier = tracker.objects[idx]['id'];
                targets.tmpIdentifier = targets.identifier;
            }
        }

        // remove unused objs
        for (let i in targets.box.last) {
            if (typeof tracker.objects[i] === 'undefined') {
                targets.box.last[i] = null;
            }
        }

        // update last lock bounding box
        for (let i in tracker.objects) {
            if (typeof tracker.objects[i]['box'] !== 'undefined') {
                targets.box.last[i] = tracker.objects[i]['box']; // update last bounding at index
            }
        }
    },

    /*
        Handle target change
     */
    handleSwitch: function () {
        if (targets.changeIdx != null) {
            targets.objIdx = targets.changeIdx;
            targets.tmpObjIdx = targets.objIdx;
            //objIdx = targets.changeIdx;
            if (typeof tracker.objects[targets.objIdx] !== 'undefined') {
                targets.center.last = tracker.objects[targets.objIdx]['center'];
                if (typeof tracker.objects[targets.objIdx]['id'] !== 'undefined') {
                    targets.identifier = tracker.objects[targets.objIdx]['id'];
                }
                if (targets.isLocked()) {
                    targets.box.lock = tracker.objects[targets.objIdx]['box'];
                }
            }
            targets.changeIdx = null;
        }
    },

    /*
        Select object by Idx
     */
    switchTarget: function (id) {
        targets.objIdx = parseInt(id);
        targets.changeIdx = targets.objIdx;
        targets.enableLock();
    },

    /*
        Return target point by name
     */
    getTargetPoint: function (name, objIdx = 0) {
        let target = {
            'x': targeting.now.x,
            'y': targeting.now.y,
        };
        const tmp = tracker.wrapper.getTargetPoint(name, objIdx); // returns vector [x,y]
        if (tmp != null) {
            target = tmp;
        }
        return tmp;
    },

    /*
        Lock on object
     */
    lock: function (clear = true) {
        if (clear) {
            targets.search = false;
            targets.lost = false;
        }

        targets.identifier = targets.tmpIdentifier;
        if (targets.box.last[targets.objIdx] != null) {
            targets.box.lock = targets.box.last[targets.objIdx];
        }
        targets.enableLock();
    },

    /*
        Unlock from object
     */
    unlock: function (clear = true) {
        config.target.locked = false;

        if (clear) {
            targets.lost = false;
            targets.search = false;
        }

        targets.tmpIdentifier = -1;
        targets.box.lock = {
            'xMin': 0,
            'yMin': 0,
            'width': 0,
            'height': 0,
        };
        ui.disableBtn('btn-target-lock');
        target.clr();
    },

    /*
        Handle click on object on canvas
     */
    onClick: function (x, y) {
        let coords = upscaler.pointerToVideoTransform(x, y);
        if (config.render.simulator) {
            coords.x -= tracker.dx;
            coords.y -= tracker.dy;
        }
        for (let n in tracker.objects) {
            if (typeof tracker.objects[n]['box'] !== 'undefined') {
                if (keypoints.checkBounding(upscaler.normalize(coords), tracker.objects[n]['box'])) {
                    targets.switchTarget(n);
                    return;
                }
            }
        }
    },

    /*
        Enable lock mode
     */
    enableLock: function () {
        config.target.locked = true;
        ui.enableBtn('btn-target-lock');
    },

    /*
        Switch to next object
     */
    next: function () {
        let tmp = finder.findNext();
        if (tmp == null) {
            tmp = finder.findFirst();
            if (tmp == null) {
                tmp = targets.objIdx;
                tmp++;
                if (typeof tracker.objects[tmp] === 'undefined') {
                    tmp = 0;
                }
            }
        }

        if (typeof tracker.objects[tmp] !== 'undefined') {
            targets.objIdx = parseInt(tmp);
            targets.changeIdx = targets.objIdx;
            targets.box.lock = tracker.objects[tmp]['box'];

            if (typeof tracker.objects[tmp]['id'] !== 'undefined') {
                targets.identifier = parseInt(tracker.objects[tmp]['id']);
            }
            targets.enableLock();
        }
    },

    /*
        Switch to prev object
     */
    prev: function () {
        let tmp = finder.findPrev();
        if (tmp == null) {
            tmp = finder.findLast();
            if (tmp == null) {
                tmp = targets.objIdx;
                tmp--;
                if (typeof tracker.objects[tmp] === 'undefined') {
                    tmp = tracker.objects.length - 1;
                }
            }
        }

        if (typeof tracker.objects[tmp] !== 'undefined') {
            targets.objIdx = parseInt(tmp);
            targets.changeIdx = targets.objIdx;
            targets.box.lock = tracker.objects[tmp]['box'];

            if (typeof tracker.objects[tmp]['id'] !== 'undefined') {
                targets.identifier = parseInt(tracker.objects[tmp]['id']);
            }
            targets.enableLock();
        }
    },

    /*
        Reset lock and tmp boundings
     */
    resetBoundings: function () {
        targets.box.lock = { // lock bounding
            xMin: 0,
            yMin: 0,
            width: 0,
            height: 0,
        };
        targets.box.current = { // lock bounding
            xMin: 0,
            yMin: 0,
            width: 0,
            height: 0,
        };
    },

    /*
        Increase lock bounding when searching
     */
    resizeBoundings: function () {
        targets.box.lock.xMin -= 0.01;
        targets.box.lock.yMin -= 0.01;
        targets.box.lock.width += 0.02;
        targets.box.lock.height += 0.02;
    },

    /*
        Return true if locked
     */
    isLocked: function () {
        return config.target.locked;
    },

    /*
        Return true if search mode
     */
    isSearch: function () {
        return targets.search;
    },

    /*
        Return true if target lost
     */
    isLost: function () {
        return targets.lost;
    },

    /*
        Return true if has target
     */
    hasTarget: function () {
        return targets.isTarget;
    },
}