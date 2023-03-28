// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const matcher = {

    /*
        Match exactly params
     */
    matchExactly: function (targetBounding, idx = null, identifier = null, checkBounds = true) {
        let tmpIdx;
        let n = 0;
        for (let obj of tracker.objects) {
            if (obj['score'] < config.target.minMatchScore) {
                n++;
                continue;
            }
            if (typeof obj['center'] == 'undefined') { // center point required
                n++;
                continue;
            }

            // if disallowed/filtered/blacklisted
            if (filters.notAllowed(n)) {
                n++;
                continue;
            }

            if (idx == null || (idx != null && idx == n)) { // for current selected obj
                // if idx match and target ID match
                if (typeof obj['id'] !== 'undefined' && (identifier == null || (identifier != null && obj['id'] == identifier))) {
                    if ((!checkBounds || keypoints.inBounding(obj['center'], targetBounding)) && matcher.isClosest(n)) { // tmp
                        tmpIdx = n;
                        break;
                    }
                }
            }
            n++;
        }
        return tmpIdx;
    },

    /*
         Match closest objects
     */
    matchClosest: function (center, identifier = null) {

        if (typeof center == 'undefined' || center == null) {
            return null;
        }

        let tmpIdx = null;
        let centers = [];
        let n = 0;
        for (let obj of tracker.objects) {
            if (obj['score'] < config.target.minMatchScore) {
                n++;
                continue;
            }
            if (typeof obj['center'] == 'undefined' || typeof obj['center'].x == 'undefined') { // center point is required
                n++;
                continue;
            }
            if (identifier != null) {
                if (typeof obj['id'] !== 'undefined' && obj['id'] != identifier) {
                    n++;
                    continue;
                }
            }

            // if disallowed/filtered/blacklisted
            if (filters.notAllowed(n)) {
                n++;
                continue;
            }

            centers.splice(n, 0, obj['center']);
            n++;
        }
        if (centers.length == 0) {
            return null;
        }
        scores = keypoints.getCenterScores(center, centers); // calculate scores by closest distance
        let idx = matcher.findBestScore(scores); // get best score idx
        if (idx != null && typeof idx != 'undefined') {
            if (typeof tracker.objects[idx] != 'undefined') {
                tmpIdx = idx;
            }
        }

        return tmpIdx;
    },

    /*
        Check if object is closets
     */
    isClosest: function (idx) {
        let centers = [];
        let current = null;
        let n = 0;
        for (let obj of tracker.objects) {
            if (typeof obj['center'] == 'undefined') { // center point is required
                n++;
                continue;
            }

            // get current
            if (n == idx) {
                current = obj['center'];
            }
            if (obj['score'] < config.target.minMatchScore) { // ignore less scored
                n++;
                continue;
            }

            // if disallowed/filtered/blacklisted
            if (filters.notAllowed(n)) {
                n++;
                continue;
            }

            centers.splice(n, 0, obj['center']);
            n++;
        }
        if (centers.length == 0) {
            return false;
        }

        let scores = keypoints.getCenterScores(current, centers); // calculate scores by closest distance
        let bestIdx = matcher.findBestScore(scores); // get best score idx

        if (bestIdx != null && bestIdx == idx) {
            return true;
        }
        return false;
    },

    /*
        Find best score idx
     */
    findBestScore: function (scores) {
        let min = null;
        let idx = null;
        for (let i in scores) {
            if (scores[i] == null) {
                continue;
            }
            if (scores[i] < min || min == null) {
                min = scores[i];
                idx = i;
            }
        }
        return idx;
    },
}