// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const finder = {

    /*
        Find previously detected target
     */
    find: function () {
        targets.matchType = '';

        let idx = null;
        let identifier = null;
        let bounding = null;
        let center = null;

        if (targets.isLocked()) { // if locked
            idx = targets.objIdx;
            identifier = targets.identifier;
            bounding = targets.box.lock;
            center = targets.center.last;
        } else { // if not locked            
            idx = targets.objIdx;
            identifier = targets.tmpIdentifier;
            bounding = targets.box.current;
            center = targets.center.current;
        }

        // prepare seek chain
        let chain = {};

        chain['all_1'] = function (bounding, center, idx, identifier) {
            return matcher.matchExactly(bounding, idx, identifier, false);
        };
        chain['all_2'] = function (bounding, center, idx, identifier) {
            return matcher.matchExactly(bounding, null, identifier, true);
        };
        chain['curr_id'] = function (bounding, center, idx, identifier) {
            return matcher.matchExactly(bounding, null, identifier, false);
        };
        chain['close_id'] = function (bounding, center, idx, identifier) {
            return matcher.matchClosest(center, identifier);
        };
        chain['close_search'] = function (bounding, center, idx, identifier) {
            // if searching mode or not locked and not single target or action enabled (try to find as more as possible)
            if ((targets.isSearch() || (!targets.isLocked()) && !config.target.single) || action.isEnabled()) {
                return matcher.matchClosest(center);
            }
        };

        // check conditions in order to find best match
        let current = null;
        for (let mode in chain) {
            current = chain[mode](bounding, center, idx, identifier);
            if (current != null) {
                targets.matchType = mode;
                break;
            }
        }

        return current;
    },

    /*
        Find next in X coord
     */
    findNext: function () {
        let curr = targets.center.last;
        let nextIdx = null;
        for (idx in tracker.objects) {
            if (typeof tracker.objects[idx]['center'] !== 'undefined') {
                if (tracker.objects[idx]['center'].x >= curr.x && idx != targets.objIdx) {
                    nextIdx = idx;
                    break;
                }
            }
        }
        return nextIdx;
    },

    /*
        Find prev in X coord
     */
    findPrev: function () {
        let curr = targets.center.last;
        let nextIdx = null;
        for (idx in tracker.objects) {
            if (typeof tracker.objects[idx]['center'] !== 'undefined') {
                if (tracker.objects[idx]['center'].x <= curr.x && idx != targets.objIdx) {
                    nextIdx = idx;
                    break;
                }
            }
        }
        return nextIdx;
    },

    /*
        Find first in X coord
     */
    findFirst: function () {
        let min = null;
        let tmpIdx = null;
        for (idx in tracker.objects) {
            if (typeof tracker.objects[idx]['center'] !== 'undefined') {
                if (min == null || tracker.objects[idx]['center'].x < min) {
                    min = tracker.objects[idx]['center'].x;
                    tmpIdx = idx;
                }
            }
        }
        return tmpIdx;
    },

    /*
        Find last in X coord
     */
    findLast: function () {
        let max = null;
        let tmpIdx = null;
        for (idx in tracker.objects) {
            if (typeof tracker.objects[idx]['center'] !== 'undefined') {
                if (max == null || tracker.objects[idx]['center'].x > max) {
                    max = tracker.objects[idx]['center'].x;
                    tmpIdx = idx;
                }
            }
        }
        return tmpIdx;
    },
};