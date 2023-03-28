// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const mobilenet = {

    modelFamily: 'mobilenet', // family
    modelName: 'MobileNet', // name
    model: null, // detector model

    /*
        Prepare
     */
    onPrepare: function () {
        mobilenet.setModelFamily();
    },

    /*
        Set model
     */
    onSetModel: function (model) {
        switch (model) {
            case 'MobileNet':
                mobilenet.detectorModel = null;
                mobilenet.detectorConfig = {};
                mobilenet.minScore = 0.65;
                mobilenet.modelName = model;
                break;
        }
        ;
        mobilenet.setModelFamily();
    },

    /*
        Set model family
     */
    setModelFamily: function (name = null) {
        if (name != null) {
            mobilenet.modelFamily = name;
            return;
        }
        switch (mobilenet.modelName) {
            case 'MobileNet':
                mobilenet.modelFamily = 'mobilenet';
                break;
        }
    },

    /*
        Init
     */
    onInit: function () {
        //
    },

    beforeUpdate: function () {
        for (let idx of tracker.objects.keys()) {

            // generate bounding box if not exists
            if (typeof tracker.objects[objIdx]['box'] === 'undefined' && typeof tracker.objects[objIdx]['bbox'] !== 'undefined') {
                tracker.objects[objIdx]['box'] = coco.normalizeBounding(tracker.objects[objIdx]['bbox']);
            }

            // generate center if not exists
            if (typeof tracker.objects[objIdx]['center'] == 'undefined') {
                tracker.objects[objIdx]['center'] = keypoints.createCenterPoint(objIdx);
            }
        }
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
    },

    /*
        Normalize box
     */
    normalizeBounding: function (box) {
        const vidSize = upscaler.getVideoSize();
        return {
            'xMin': box[0] / vidSize.width,
            'yMin': box[1] / vidSize.height,
            'width': box[2] / vidSize.width,
            'height': box[3] / vidSize.height,
        };
    },

    /*
        On ready
     */
    onReady: async function () {
        if (mobilenet.model == null) {
            cocoSsd.load().then(function (loadedModel) {
                mobilenet.model = loadedModel;
            });
        }
    },

    /*
        On load
     */
    onLoad: function () {
        //mobilenet.detector = null;
    },

    /*
       On frame
     */
    onFrame: async function () {
        try {
            mobilenet.model.detect(tracker.video).then(function (predictions) {
                tracker.objects = predictions;
            });
        } catch (err) {
            console.error(err);
        }
    },

    /*
        Return target point for object Idx
     */
    getTargetPoint: function (name, objIdx = 0) {
        if (tracker.objects.length == 0 || typeof tracker.objects[objIdx] == 'undefined') {
            return null; // abort and use previous calculated target
        }

        return tracker.objects[objIdx]['center'];
    },
}