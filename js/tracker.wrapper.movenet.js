// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const movenet = {

    modelFamily: 'movenet', // family
    modelName: 'MoveNetMultiPoseLightning', // name
    detector: null, // detector
    detectorModel: poseDetection.SupportedModels.MoveNet, // detector model
    detectorConfig: { // detector configuration
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
        enableSmoothing: true,
        multiPoseMaxDimension: 256,
        enableTracking: true,
        trackerType: poseDetection.TrackerType.BoundingBox,
    },
    joints: [], // cached as numeric indexes joints
    targetIdx: [], // target points idx

    /*
        Prepare
     */
    onPrepare: function () {
        movenet.setModelFamily();
        movenet.cacheJoints();
        movenet.cacheTargetAnchors();
    },

    /*
        Init
     */
    onInit: function () {
        // instantiate ScatterGL for 3D points view (BlazePose model only)
        if (movenet.detectorModel == poseDetection.SupportedModels.BlazePose) {
            tracker.init3D();
        }
    },

    beforeUpdate: function () {
        for (let idx of tracker.objects.keys()) {
            // apply class
            tracker.objects[idx]['class'] = 'person';

            // generate bounding box if not exists
            if (typeof tracker.objects[idx]['box'] == 'undefined') {
                tracker.objects[idx]['box'] = keypoints.createBoundingBox(idx);
            }

            // generate center if not exists
            if (typeof tracker.objects[idx]['center'] == 'undefined') {
                tracker.objects[idx]['center'] = keypoints.createCenterPoint(idx);
            }
        }
    },


    /*
        Render
     */
    onRender: function (objIdx) {

        // loop on bone joints idx's
        for (let idx of movenet.joints.keys()) {

            // summary score
            if (typeof tracker.objects[objIdx]['score'] !== 'undefined') {
                keypoints.score = tracker.objects[objIdx]['score'];
            }

            if (keypoints.score < config.model.minScore) {
                return;
            }

            // if there is no required threshold (score) then next
            if (!movenet.hasScore(objIdx, idx)) {
                continue;
            }

            point = movenet.getCoords(objIdx, idx); // get X,Y coords of current joint
            score = movenet.getScore(objIdx, idx); // calculate score of current joint

            // draw path on canvas
            render.drawPath(point[0], // from x
                point[1], // from x
                point[2], // to x
                point[3], // to y
                movenet.joints[idx][5][0], // R
                movenet.joints[idx][5][1], // G
                movenet.joints[idx][5][2], // B
                score); // score
        }

        // display bounds
        if (config.render.bounds) {
            // bounding box
            if (typeof tracker.objects[objIdx]['box'] !== 'undefined') {
                render.drawBoundings(objIdx, keypoints.score);
            }

            // center point
            if (typeof tracker.objects[objIdx]['center'] !== 'undefined') {
                render.drawCenter(objIdx, keypoints.score, false);
            }
        }

        // draw 3D points if available using ScatterGL
        if (config.core.enable3D
            && typeof tracker.objects[objIdx].keypoints3D !== 'undefined'
            && tracker.objects[objIdx].keypoints3D != null
            && tracker.objects[objIdx].keypoints3D.length > 0) {
            tracker.drawKeypoints3D(tracker.objects[objIdx].keypoints3D);
        }
    },

    /*
        On ready
     */
    onReady: async function () {
        // create detector
        movenet.detector = await poseDetection.createDetector(
            movenet.detectorModel,
            movenet.detectorConfig,
        );
    },

    /*
        On load
     */
    onLoad: async function () {
        // dispose current detector
        if (movenet.detector != null) {
            movenet.detector.dispose();
        }
        movenet.detector = null;
    },

    /*
        On frame
     */
    onFrame: async function () {
        // try to detect poses
        const estimationConfig = {
            flipHorizontal: false
        };
        const timestamp = performance.now();
        if (movenet.detector != null) {
            tracker.objects = await movenet.detector.estimatePoses(tracker.video, estimationConfig, timestamp);
        }

    },

    /*
        Find and return pose keypoint coordinate (X or Y)
     */
    findPosePoint: function (objIdx, point, axis) {
        return upscaler.normalize(tracker.objects[objIdx]['keypoints'][point])[axis];
    },

    /*
        Find and return pose keypoint coordinate (X or Y)
     */
    findPoseScore: function (objIdx, point) {
        return tracker.objects[objIdx]['keypoints'][point].score;
    },

    /*
        Return coordinate (X or Y) for points in path

        idx is the joint idx
        objIdx is object idx
        part is the joint part: 0 = from_x, 1 = from_y, etc.
        axis is axis idx, 0 = Y, 1 = X
     */
    getCoord: function (objIdx, idx, part, axis) {
        // if only one point then return coordinate for this one
        if (movenet.joints[idx][part] == 1) {
            return movenet.findPosePoint(objIdx, movenet.joints[idx][part][0], axis);
        } else {
            // if multiple points then calculate coordinate between them
            let sum = 0.0;
            for (joint of movenet.joints[idx][part]) {
                sum += movenet.findPosePoint(objIdx, joint, axis);
            }
            return (sum / movenet.joints[idx][part].length);
        }
    },

    /*
        Return coordinates for path idx

        idx is the joint idx
        objIdx is objectidx
     */
    getCoords: function (objIdx, idx) {
        return [
            movenet.getCoord(objIdx, idx, 0, 'x'), // from x
            movenet.getCoord(objIdx, idx, 1, 'y'), // from y
            movenet.getCoord(objIdx, idx, 2, 'x'), // to x
            movenet.getCoord(objIdx, idx, 3, 'y'), // to y
        ];
    },

    /*
        Get score for path

        idx is the joint idx
        objIdx is object idx
     */
    getScore: function (objIdx, idx) {
        // if only one point then check score for this one
        if (movenet.joints[idx][4] == 1) { // score is the fourth element in the array
            return movenet.findPoseScore(objIdx, movenet.joints[idx][4][0],);
            // score is the third element in the array, 2 = score in pose
        } else {
            // if multiple points then check score for all
            let sum = 0.0;
            for (joint of movenet.joints[idx][4]) {
                sum += movenet.findPoseScore(objIdx, joint);  // score is the third element in the array
            }
            return (sum / movenet.joints[idx][4].length);
        }
    },

    /*
        Checks if path has required minimum score do draw it on canvas
     */
    hasScore: function (objIdx, idx) {
        let result = true;
        // if only one point then check score for this one
        if (movenet.joints[idx][4].length == 1) {
            if (movenet.findPoseScore(objIdx, movenet.joints[idx][4][0]) < config.model.minScore) {
                result = false;
            }
        } else {
            // if multiple points then check score for all
            for (point of movenet.joints[idx][4]) {
                if (movenet.findPoseScore(objIdx, point) < config.model.minScore) {
                    result = false;
                    break;
                }
            }
        }
        return result;
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

        let target = {
            'x': 0,
            'y': 0,
        };

        const point = {
            'nose': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[0]]),
            'left_ear': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[1]]),
            'right_ear': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[2]]),
            'left_shoulder': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[3]]),
            'right_shoulder': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[4]]),
            'left_hip': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[5]]),
            'right_hip': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[6]]),
            'left_knee': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[7]]),
            'right_knee': upscaler.normalize(tracker.objects[objIdx].keypoints[movenet.targetIdx[8]]),
            'mid_head': {},
            'mid_body': {},
            'mid_body_hip': {},
            'body_heart': {},
            'left_leg': {},
            'right_leg': {},
        };

        // initial target point
        target.x = point['nose'].x;
        target.y = point['nose'].y;

        // head
        point['mid_head']['x'] = (point['left_ear'].x + point['right_ear'].x) / 2;
        point['mid_head']['y'] = (point['left_ear'].y + point['right_ear'].y) / 2;

        // neck
        point['mid_body']['x'] = (point['left_shoulder'].x + point['right_shoulder'].x) / 2;
        point['mid_body']['y'] = (point['left_shoulder'].y + point['right_shoulder'].y) / 2;

        // mid hip
        point['mid_body_hip']['x'] = (point['left_hip'].x + point['right_hip'].x) / 2;
        point['mid_body_hip']['y'] = (point['left_hip'].y + point['right_hip'].y) / 2;

        // heart
        point['body_heart']['x'] = point['mid_body'].x + (point['mid_body_hip'].x - point['mid_body'].x) / 2;
        point['body_heart']['y'] = point['mid_body'].y + (point['mid_body_hip'].y - point['mid_body'].y) / 3.5;

        // left leg
        point['left_leg']['x'] = point['left_hip'].x + (point['mid_head'].x - point['left_hip'].x) / 3;
        point['left_leg']['y'] = point['left_hip'].y + (point['mid_head'].y - point['left_hip'].y) / 2;

        // right leg
        point['right_leg']['x'] = point['right_hip'].x + (point['right_knee'].x - point['right_hip'].x) / 3;
        point['right_leg']['y'] = point['right_hip'].y + (point['right_knee'].y - point['right_hip'].y) / 2;

        switch (name) {
            case 'HEAD':
                target.x = point['mid_head'].x;
                target.y = point['mid_head'].y;
                break;

            case 'NECK':
                target.x = point['mid_body'].x;
                target.y = point['mid_body'].y;
                break;

            case 'BODY':
                target.x = point['body_heart'].x;
                target.y = point['body_heart'].y;
                break;

            case 'LEGS':
                if (point['left_knee'].score > point['right_knee'].score) {
                    target.x = point['left_leg'].x;
                    target.y = point['left_leg'].y;
                } else {
                    target.x = point['right_leg'].x;
                    target.y = point['right_leg'].y;
                }
                break;

            default:
                if (point['left_ear'].score > point['left_shoulder'].score
                    && point['left_shoulder'].score < 0.3
                    && (point['left_ear'].score - point['left_shoulder'].score >= 0.5)) {
                    target.x = point['mid_head'].x;
                    target.y = point['mid_head'].y;
                } else {
                    target.x = point['body_heart'].x;
                    target.y = point['body_heart'].y;
                }
                break;
        }

        return target;
    },

    /*
        Check joints data
     */
    cacheJoints: function () {
        const paths = config.model.paths[movenet.modelFamily];

        for (let k in paths) {
            if (paths.hasOwnProperty(k)) {
                data = paths[k];
                joint = {
                    0: [], // from x
                    1: [], // from y
                    2: [], // to x
                    3: [], // to y
                    4: [], // score
                    5: [], // rgb
                };
                for (point of data['from_x']) {
                    joint[0].push(config.model.keypoints[movenet.modelFamily][point]);
                }
                for (point of data['from_y']) {
                    joint[1].push(config.model.keypoints[movenet.modelFamily][point]);
                }
                for (point of data['to_x']) {
                    joint[2].push(config.model.keypoints[movenet.modelFamily][point]);
                }
                for (point of data['to_y']) {
                    joint[3].push(config.model.keypoints[movenet.modelFamily][point]);
                }
                for (point of data['scores']) {
                    joint[4].push(config.model.keypoints[movenet.modelFamily][point]);
                }
                for (point of data['rgb']) {
                    joint[5].push(point);
                }
                movenet.joints.push(joint);
            }
        }
    },

    /*
        Cache target anchors
     */
    cacheTargetAnchors: function () {
        const points = config.model.keypoints[movenet.modelFamily];

        movenet.targetIdx[0] = points['nose'];
        movenet.targetIdx[1] = points['left_ear'];
        movenet.targetIdx[2] = points['right_ear'];
        movenet.targetIdx[3] = points['left_shoulder'];
        movenet.targetIdx[4] = points['right_shoulder'];
        movenet.targetIdx[5] = points['left_hip'];
        movenet.targetIdx[6] = points['right_hip'];
        movenet.targetIdx[7] = points['left_knee'];
        movenet.targetIdx[8] = points['right_knee'];
    },

    /*
        Set model
     */
    onSetModel: function (model) {
        switch (model) {
            case 'coco':
                movenet.detectorModel = null;
                movenet.detectorConfig = {};
                config.model.minScore = 0.65;
                movenet.modelName = model;
                break;
            case 'BlazePoseLite':
                movenet.detectorModel = poseDetection.SupportedModels.BlazePose;
                movenet.detectorConfig = {
                    runtime: 'tfjs',
                    enableSmoothing: true,
                    modelType: 'lite',
                };
                config.model.minScore = 0.65;
                movenet.modelName = model;
                break;
            case 'BlazePoseHeavy':
                movenet.detectorModel = poseDetection.SupportedModels.BlazePose;
                movenet.detectorConfig = {
                    runtime: 'tfjs',
                    enableSmoothing: true,
                    modelType: 'heavy',
                };
                config.model.minScore = 0.65;
                movenet.modelName = model;
                break;
            case 'BlazePoseFull':
                movenet.detectorModel = poseDetection.SupportedModels.BlazePose;
                movenet.detectorConfig = {
                    runtime: 'tfjs',
                    enableSmoothing: true,
                    modelType: 'full',
                };
                config.model.minScore = 0.65;
                movenet.modelName = model;
                break;
            case 'MoveNetSinglePoseLightning':
                movenet.detectorModel = poseDetection.SupportedModels.MoveNet;
                movenet.detectorConfig = {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                    enableSmoothing: true,
                    multiPoseMaxDimension: 256,
                    enableTracking: true,
                    movenetType: poseDetection.TrackerType.BoundingBox,
                }
                config.model.minScore = 0.4;
                movenet.modelName = model;
                break;
            case 'MoveNetMultiPoseLightning':
                movenet.detectorModel = poseDetection.SupportedModels.MoveNet;
                movenet.detectorConfig = {
                    modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
                    enableSmoothing: true,
                    multiPoseMaxDimension: 256,
                    enableTracking: true,
                    movenetType: poseDetection.TrackerType.BoundingBox,
                }
                config.model.minScore = 0.2;
                movenet.modelName = model;
                break;
            case 'MoveNetSinglePoseThunder':
                movenet.detectorModel = poseDetection.SupportedModels.MoveNet;
                movenet.detectorConfig = {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
                    enableSmoothing: true,
                    multiPoseMaxDimension: 256,
                    enableTracking: true,
                    movenetType: poseDetection.TrackerType.BoundingBox,
                }
                config.model.minScore = 0.4;
                movenet.modelName = model;
                break;
            case 'PoseNetMobileNetV1':
                movenet.detectorModel = poseDetection.SupportedModels.PoseNet;
                movenet.detectorConfig = {
                    architecture: 'MobileNetV1',
                    outputStride: 16,
                    inputResolution: {
                        width: 640,
                        height: 480,
                    },
                    multiplier: 0.75,
                }
                config.model.minScore = 0.5;
                movenet.modelName = model;
                break;
            case 'PoseNetResNet50':
                movenet.detectorModel = poseDetection.SupportedModels.PoseNet;
                movenet.detectorConfig = {
                    architecture: 'ResNet50',
                    outputStride: 16,
                    multiplier: 1.0,
                    inputResolution: {
                        width: 257,
                        height: 200,
                    },
                    quantBytes: 2,
                }
                config.model.minScore = 0.5;
                movenet.modelName = model;
                break;
        }
        ;

        movenet.setModelFamily();
    },

    /*
        Set model family
     */
    setModelFamily: function (name = null) {
        if (name != null) {
            movenet.modelFamily = name;
            return;
        }

        switch (movenet.modelName) {
            case 'coco':
                movenet.modelFamily = 'coco';
                break;
            case 'BlazePoseLite':
                movenet.modelFamily = 'blazepose';
                break;
            case 'BlazePoseHeavy':
                movenet.modelFamily = 'blazepose';
                break;
            case 'BlazePoseFull':
                movenet.modelFamily = 'blazepose';
                break;
            case 'MoveNetSinglePoseLightning':
                movenet.modelFamily = 'movenet';
                break;
            case 'MoveNetMultiPoseLightning':
                movenet.modelFamily = 'movenet';
                break;
            case 'MoveNetSinglePoseThunder':
                movenet.modelFamily = 'movenet';
                break;
            case 'PoseNetMobileNetV1':
                movenet.modelFamily = 'posenet';
                break;
            case 'PoseNetResNet50':
                movenet.modelFamily = 'posenet';
                break;
        }
    },
}