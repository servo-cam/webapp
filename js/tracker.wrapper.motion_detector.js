// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const OpenCVMotionDetector = {

    modelFamily: 'opencv', // family
    modelName: 'OpenCVMotionDetector', // name
    accumWeight: 0.5,
    bg: null,

    /*
        Prepare
     */
    onPrepare: function () {
        //
    },

    /*
        Init
     */
    onInit: function () {
        //
    },

    beforeUpdate: function () {
        //
    },

    /*
        Render
     */
    onRender: function (objIdx) {

        const score = tracker.objects[objIdx]['score'];

        if (config.render.bounds) {
            // bounding box
            if (typeof tracker.objects[objIdx]['box'] !== 'undefined') {
                render.drawBoundings(objIdx, score);
            }

            // center point
            if (typeof tracker.objects[objIdx]['center'] !== 'undefined') {
                render.drawCenter(objIdx, score);
            }
        }

        return;
    },

    /*
        On ready
     */
    onReady: async function () {
        // create detector
    },

    /*
        On load
     */
    onLoad: function () {
        // dispose current detector

    },

    /*
        On frame
     */
    onFrame: async function () {
        tracker.objects = [];

        if (!tracker.started) {
            return;
        }

        let image = cv.imread('canvas_source');
        if (image.cols === 0) {
            return;
        }

        OpenCVMotionDetector.update(image);
        const res = OpenCVMotionDetector.detect(image);
        if (res != null) {
            tracker.objects = [
                {
                    x: res.x1 + (res.x2 / 2),
                    y: res.y1 + (res.y2 / 2),
                    score: 1,
                    id: '__movement',
                    label: '__movement',
                    center: {
                        x: res.x1 + (res.x2 / 2),
                        y: res.y1 + (res.y2 / 2),
                    },
                    box: {
                        xMin: res.x1,
                        yMin: res.y1,
                        width: res.x2,
                        height: res.y2,
                    },
                }
            ];
        }
    },

    /*
        Set model
     */
    onSetModel: function (model) {
        //
    },

    /*
        Returns target point coords for current object
     */
    getTargetPoint: function (name, objIdx = 0) {
        if (tracker.objects.length == 0 || typeof tracker.objects[objIdx] == 'undefined') {
            return null; // abort and use previous calculated target
        }

        if (tracker.objects[objIdx]['score'] < 0.35) {
            return null; // abort and use previous calculated target
        }

        return {
            'x': tracker.objects[objIdx].center.x,
            'y': tracker.objects[objIdx].center.y,
        };
    },

    lerp: function (bg, image, result, alpha) {
        if (image.cols === 0) {
            bg.copyTo(result);
        } else if (bg.cols === 0) {
            image.copyTo(result);
        } else {
            cv.addWeighted(bg, alpha, image, 1.0 - alpha, 0.0, result);
            OpenCVMotionDetector.bg = result;
        }
    },

    accumulateWeighted: function (image, bg, alpha) {
        OpenCVMotionDetector.lerp(bg, image, bg, alpha);
    },

    update: function (image) {
        let imageGray = new cv.Mat();
        cv.cvtColor(image, imageGray, cv.COLOR_BGR2GRAY);
        if (!OpenCVMotionDetector.bg) {
            OpenCVMotionDetector.bg = new cv.Mat();
            imageGray.copyTo(OpenCVMotionDetector.bg);
            imageGray.delete();
            return;
        }
        OpenCVMotionDetector.accumulateWeighted(imageGray, OpenCVMotionDetector.bg, OpenCVMotionDetector.accumWeight);
        imageGray.delete();
    },

    detect: function (image) {
        let delta = new cv.Mat();
        let imageGray = new cv.Mat();
        let thresh = new cv.Mat();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.cvtColor(image, imageGray, cv.COLOR_BGR2GRAY);
        cv.absdiff(OpenCVMotionDetector.bg, imageGray, delta);
        cv.threshold(delta, thresh, 25, 255, cv.THRESH_BINARY)[1];
        cv.erode(thresh, thresh, new cv.Mat(), new cv.Point(-1, -1), 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        cv.dilate(thresh, thresh, new cv.Mat(), new cv.Point(-1, -1), 2, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let cnts = [];
        for (let i = 0; i < contours.size(); ++i) {
            cnts.push(contours.get(i));
        }
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        if (cnts.length === 0) {
            delta.delete();
            image.delete();
            imageGray.delete();
            thresh.delete();
            contours.delete();
            hierarchy.delete();
            return null;
        }
        for (let i = 0; i < cnts.length; i++) {
            let rect = cv.boundingRect(cnts[i]);
            let x = rect.x;
            let y = rect.y;
            let w = rect.width;
            let h = rect.height;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
            cnts[i].delete();
        }

        delta.delete();
        image.delete();
        imageGray.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();

        /*
        return {
            x1: minX,
            y1: minY,
            x2: maxX,
            y2: maxY,
        };
        */

        const size = upscaler.getCanvasSize();
        const normalizedCoords = {
            x1: minX / size.width,
            y1: minY / size.height,
            x2: (maxX - minX) / size.width,
            y2: (maxY - minY) / size.height,
        };

        return normalizedCoords;
    },
}