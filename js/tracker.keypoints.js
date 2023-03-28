// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const keypoints = {

    score: 0.0, // current summary score    

    /*
        Calculate bounding box for object
     */
    createBoundingBox: function (objIdx) {
        const vidSize = upscaler.getVideoSize();

        // init empty
        const box = {
            'xMin': null,
            'yMin': null,
            'width': null,
            'height': null
        };

        // check if object exists
        if (typeof tracker.objects[objIdx] === 'undefined') {
            return box;
        }

        let tmp;
        for (point of tracker.objects[objIdx]['keypoints']) {
            if (point.score < config.model.minScore) {
                continue;
            }

            // get normalized x coord
            tmp = point.x / vidSize.width;
            if (box.xMin == null || box.xMin > tmp) { // x
                box.xMin = tmp;
            }
            if (box.width == null || box.width < tmp) { // width
                box.width = tmp;
            }

            // get normalized y coord
            tmp = point.y / vidSize.height;
            if (box.yMin == null || box.yMin > tmp) { // y
                box.yMin = tmp;
            }
            if (box.height == null || box.height < tmp) { // height
                box.height = tmp;
            }
        }

        // calculate width and height
        box['width'] = box['width'] - box['xMin'];
        box['height'] = box['height'] - box['yMin'];

        return box;
    },

    /*
        Calculate center point for predicted object
     */
    createCenterPoint: function (objIdx) {
        // check if object exists, if not return null vector
        if (typeof tracker.objects[objIdx]['box'] === 'undefined') {
            return {
                'x': 0,
                'y': 0,
            };
        }
        // calculate center
        return {
            x: tracker.objects[objIdx]['box']['xMin'] + (tracker.objects[objIdx]['box']['width'] / 2),
            y: tracker.objects[objIdx]['box']['yMin'] + (tracker.objects[objIdx]['box']['height'] / 2)
        };
    },

    /*
        Check if object center is in bounding box
     */
    inBounding: function (center, box, idx = null) {
        if (idx == null) {
            return keypoints.checkBounding(center, box);
        }

        // get from index if needed
        if (idx != '*') {
            if (typeof box[idx] !== 'undefined') {
                return keypoints.checkBounding(center, box[idx]);
            }
        } else {
            let scores = [];
            for (let n in box) {
                if (keypoints.checkBounding(center, box[n])) {
                    scores[n] = keypoints.getBoundingScore(center, box[n]);
                    return true;
                }
            }
        }

        return false;
    },

    /*
        Get scores for boundings, closest = less score
     */
    getBoundingScores: function (center, box) {
        let scores = [];
        for (let n in box) {
            if (keypoints.checkBounding(center, box[n])) {
                scores[n] = keypoints.getBoundingScore(center, box[n]);
            }
        }
        return scores;
    },

    /*
        Get scores for boundings, closest = less score
     */
    getBoundingScoresDict: function (center, box) {
        let scores = [];
        for (let n in box) {
            if (keypoints.checkBounding(center, box[n]['box'])) {
                scores[n] = keypoints.getBoundingScore(center, box[n]['box']);
            }
        }
        return scores;
    },

    /*
        Get scores for boundings, closest = less score
     */
    getCenterScores: function (c1, cn) {
        let scores = [];
        for (let n in cn) {
            if (typeof c1.x !== 'undefined' && typeof cn[n].x !== 'undefined') {
                scores[n] = keypoints.getCenterScore(c1, cn[n]);
            }
        }
        return scores;
    },

    /*
        Check if obj center is in bounding
     */
    checkBounding: function (center, box, test = false) {
        if (box == null) {
            return false;
        }

        let x1, x2, y1, y2;
        const vidSize = upscaler.getVideoSize();

        // box = normalized coords
        x1 = box['xMin'];
        y1 = box['yMin'];
        x2 = box['width'];
        y2 = box['height'];

        if (center.x != null && center.y != null
            && x1 != null && y1 != null
            && x2 != null && y2 != null) {
            if (center.x >= x1 && center.x <= (x1 + x2) && center.y >= y1 && center.y <= (y1 + y2)) {
                return true;
            }
        }
        return false;
    },

    /*
        Get bounding score
     */
    getBoundingScore: function (center, b) {
        const middle = {
            x: b.xMin + b.width / 2,
            y: b.yMin + b.height / 2
        };

        return Math.sqrt(
            Math.pow(middle.x - center.x, 2) + Math.pow(middle.y - center.y, 2)
        );
    },

    /*
        Get center score
     */
    getCenterScore: function (c1, c2) {
        return Math.sqrt(
            Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2)
        );
    },

    /*
        Get distance between points
     */
    getDistance: function (x1, y1, x2, y2) {
        const xDiff = x2 - x1;
        const yDiff = y2 - y1;
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    },

    /*
        Get distance between points
     */
    getCoordDistance: function (v1, v2) {
        const xDiff = v2.x - v1.x;
        const yDiff = v2.y - v1.y;
        return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    },

    /*
        Calculate mean of array of coords
     */
    calculateMeanCoordinate: function (coordinates) {
        let xSum = 0;
        let ySum = 0;

        //coordinates.push(current);
        for (const coord of coordinates) {
            xSum += coord.x;
            ySum += coord.y;
        }
        return {
            x: xSum / coordinates.length,
            y: ySum / coordinates.length
        };
    },
}