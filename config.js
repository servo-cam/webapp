// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const config = {
    // status labels
    LANG: {
        TARGET: {
            ON_TARGET: 'ON TARGET', // string
            SEARCHING: 'SEARCHING...', // string
            ACTION: 'ACTION', // string
        },
    },

    security: {
        webToken: '', // <------------ web stream access token
    },

    // defaults
    init: {
        mode: 'CAMERA', // string, mode: CAMERA|REMOTE|VIDEO|STREAM
        modelName: 'MoveNetSinglePoseLightning', // string, model name
        video: '', // string, default video URL
        stream: '', // string, default stream URL
        remote: 'http://192.168.0.10:8888', // string, default remote IP
    },

    // commands
    command: {
        serial: {
            delimiter: ',', // string, delimier for commands
            endchar: '\n', // string, serial command ending character
            format: 'RAW', // string, data type: RAW|JSON
        },            
        remote: {
            path: '/cmd', // string, remote command web path
            format: 'JSON' // string, data type: RAW|JSON
        }
    },

    // rendering
    render: {
        view: true, // bool, enable/disable rendering
        autofit: true, // bool, enable autofit on canvas scaling
        resize: true, // bool, screen resize
        locked: false, // bool, center point locked
        pointWidth: 6, // int, width of line between points
        pointRadius: 8, // int, point circle radius
        bounds: true, // bool, show bounds
        simulator: false, // bool, simulator mode
    },

    // camera
    camera: {
        deviceId: null, // string, current camera device Id
        resolution: { // camera resolution (px)
            x: 1280, // int, horizontal
            y: 720 // int, vertical
        },
        fov: { // camera FOV (angle)
            x: 54, // int, horizontal
            y: 41 // int, vertical
        },
    },    

    // servo
    servo: {
        deviceId: null, // string, current serial device Id
        enabled: false, // bool, servo enable or disable
        angleStep: 1, // step between angles to send to serial
        initAngle: { // init angle of servo (central position)
            x: 90, // int, horizontal
            y: 90, // int, vertical
        },
        minAngle: { // maximum angle of servo
            x: 0, // int, horizontal
            y: 0, // int, vertical
        },
        maxAngle: { // maximum angle of servo
            x: 180, // int, horizontal
            y: 180, // int, vertical
        },
        angleMultiplier: { // angle multipler for slowing down movement
            x: 1, // int, horizontal
            y: 1, // int, vertical
        },
        minLimit: { // angle real min limit
            x: 0, // int, horizontal
            y: 0, // int, vertical
        },
        maxLimit: { // angle real max limit
            x: 180, // int, horizontal
            y: 180, // int, vertical
        },
        horizontal: true, // bool, enable or disable horizontal servo
        vertical: true, // bool, enable or disable vertical servo
        map_fov: true, // bool, use real world FOV angle mapping, true
        use_limit: false, // bool, use limit values against max angle
    },

    // HTML elements
    dom: {
        canvas: '#canvas', // string, HTML element for canvas
        source_canvas: '#canvas_source', // string, HTML element for canvas
        video: '#video', // string, HTML element for video
        scatter3d: '#view_3d', // string, HTML element for 3D keypoints
    },  

    // core config
    core: {
        enableAI: true, // bool, enable or disable tracking
        enableVideo: true, // bool, enable or disable draw video on cnvas
        enable3D: false, // bool, enable or disable 3D keypoints
        enableDebug: false, // bool, enable or disable debug
        enableConsole: false, // bool, enable or disable console
        update_method: 'RAF', // string, frame update method, RequestAnimationFrame or interval: RAF|INTERVAL
        update_fps: 30, // int, fps, only in interval update method
        log: true, // bool, enable logging to console,
    },

    // UI panels
    panel: {
        area: false, // bool, area select panel opened or closed
    },

    // targeting
    target: {
        point: 'AUTO', // string, target point: AUTO|HEAD|NECK|BODY|LEGS
        mode: 'IDLE',  // string, target mode: OFF|IDLE|FOLLOW|PATROL|MANUAL|MOUSE
        single: false, // bool, is single target mode enabled
        locked: false, // bool, is lock on target enabled
        delayMultiplier: 0.40, // float, delayMultiplier full 20
        speedMultiplier: 0.1, // float, speedMultiplier full 6.5
        smoothMultiplier: 1.6, // float, smoothMultiplier full 0.8
        threshold: 0.15, // float, on target threshold
        minTime: 3, // int, on target minimum time
        lostTime: 50, // int, time required to mark as lost
        minMatchScore: 0.15, // float, minimum score for matcher
        detectMinScore: 0.3, // float, minimum score in detector
        brake: true, // bool, target brake if close to destination
        smoothFollow: false, // bool, smooth follow movement
        smoothCamera: true, // bool, smooth camera movement
        mean: { // coords mean enable/disable (for smooth movement)
            target: true, // bool, target point
            now: true, // bool, now point
            camera: false, // bool, cam point
        },
        meanStep: { // threshold for new mean (for smooth movement)
            target: 0.005, // float, target point
            now: 0.01, // float, now point
            camera: 0.01, // float, cam point
        },
        meanDepth: { // how many previous coords use to smooth movement
            target: 2, // int, target point
            now: 2, // int, now point
            camera: 2, // int, cam point
        },
    },
    
    // patrol mode
    patrol: {
        enabled: false, // bool, is patrol enabled
        direction: 'RIGHT', // string, initial direction: LEFT|RIGHT
        timeout: 500, // int, patrol start timeout after loose target
        step: 0.01, // float, patrol step every move, 0.02
        interval: 50, // int, patrol move interval
    },

    // attack/action
    action: {
        enabled: false, // bool, auto-action enable
        timeout: { // timeouts
            start: 10, // int, time required to start auto action
            next_target: 10, // int, time required before switch to next target
            action_length: 20, // int, auto action length
        },
        auto_name: 'A1', // string, auto action name: A1|A2|A3|B4|B5|B6
        auto_mode: 'CONTINUOUS', // string, auto action mode: SINGLE|CONTINUOUS|SERIES|TOGGLE
    },    

    // serial port    
    serial: {
        baudRate: 9600, // int, baud rate
    },

    // manual control
    manual: {
        mode: 'POINT', // string, manual control mode POINT|NOW|TARGET
        speed: 0.01, // float, speed of movement
    },

    // area config
    area: {
      enabled: { // enabled areas
        target: false, // bool, allowed target detection area
        patrol: false, // bool, allowed patrol area
        action: false, // bool, allowed action area
      },

      world: { // enabled world coords
        target: false, // bool, allowed target detection area
        patrol: false, // bool, allowed patrol area
        action: false, // bool, allowed action area
      },

      box: { // areas bounds [normalized, 0-1]
        target: {  // allowed target detection area
          xMin: 0.2, // float, x
          yMin: 0.2, // float, y
          width: 0.6, // float, width
          height: 0.6 // float, height
        },
        patrol: {  // allowed patrol area
          xMin: 0.2, // float, x
          yMin: 0.2, // float, y
          width: 0.6, // float, width
          height: 0.6 // float, height
        },
        action: { // allowed action area
          xMin: 0.2, // float, x
          yMin: 0.2, // float, y
          width: 0.6, // float, width
          height: 0.6 // float, height
        }
      }
    },

    // model config
    model: { 
        minScore: 0.35, // float, minimum threshold for estimated point    
        keypoints: { // {int}, keypoints
           'movenet': {
                 'nose': 0,
                 'left_eye': 1,
                 'right_eye': 2,
                 'left_ear': 3,
                 'right_ear': 4,
                 'left_shoulder': 5,
                 'right_shoulder': 6,
                 'left_elbow': 7,
                 'right_elbow': 8,
                 'left_wrist': 9,
                 'right_wrist': 10,
                 'left_hip': 11,
                 'right_hip': 12,
                 'left_knee': 13,
                 'right_knee': 14,
                 'left_ankle': 15,
                 'right_ankle': 16,
             },
             'posenet': {
                 'nose': 0,
                 'left_eye': 1,
                 'right_eye': 2,
                 'left_ear': 3,
                 'right_ear': 4,
                 'left_shoulder': 5,
                 'right_shoulder': 6,
                 'left_elbow': 7,
                 'right_elbow': 8,
                 'left_wrist': 9,
                 'right_wrist': 10,
                 'left_hip': 11,
                 'right_hip': 12,
                 'left_knee': 13,
                 'right_knee': 14,
                 'left_ankle': 15,
                 'right_ankle': 16,
             },
             'blazepose': {
                'nose': 0,
                'left_eye_inner': 1,
                'left_eye': 2,
                'left_eye_outer': 3,
                'right_eye_inner': 4,
                'right_eye': 5,
                'right_eye_outer': 6,
                'left_ear': 7,
                'right_ear': 8,
                'mouth_left': 9,
                'mouth_right': 10,
                'left_shoulder': 11,
                'right_shoulder': 12,
                'left_elbow': 13,
                'right_elbow': 14,
                'left_wrist': 15,
                'right_wrist': 16,
                'left_pinky': 17,
                'right_pinky': 18,
                'left_index': 19,
                'right_index': 20,
                'left_thumb': 21,
                'right_thumb': 22,
                'left_hip': 23,
                'right_hip': 24,
                'left_knee': 25,
                'right_knee': 26,
                'left_ankle': 27,
                'right_ankle': 28,
                'left_heel': 29,
                'right_heel': 30,
                'left_foot_index': 31,
                'right_foot_index': 32,
             },
        },
        paths: {
            // paths between points configuration
            'movenet': {
                // left hip > left knee
                'l_hip_l_knee': {
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_knee'],
                    'to_y': ['left_knee'],
                    'scores': ['left_knee'],
                    'rgb': [42, 163, 69]
                },
                // right hip > right knee
                'r_hip_r_knee': {
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_knee'],
                    'to_y': ['right_knee'],
                    'scores': ['right_knee'],
                    'rgb': [42, 163, 69]
                },
                // hips (mid-point)
                'hip_l_m': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                'hip_r_m': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                // hip to shoulders
                'hip_l_shoulder_l': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_shoulder'],
                    'to_y': ['left_shoulder'],
                    'scores': ['left_hip', 'left_shoulder'],
                    'rgb': [242, 85, 240]
                },
                'hip_r_shoulder_r': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_shoulder'],
                    'to_y': ['right_shoulder'],
                    'scores': ['right_hip', 'right_shoulder'],
                    'rgb': [242, 85, 240]
                },
                // left knee > left ankle
                'l_knee_l_ankle': {
                    'from_x': ['left_knee'],
                    'from_y': ['left_knee'],
                    'to_x': ['left_ankle'],
                    'to_y': ['left_ankle'],
                    'scores': ['left_ankle'],
                    'rgb': [140, 232, 90]
                },
                // right knee > right ankle
                'r_knee_r_ankle': {
                    'from_x': ['right_knee'],
                    'from_y': ['right_knee'],
                    'to_x': ['right_ankle'],
                    'to_y': ['right_ankle'],
                    'scores': ['right_ankle'],
                    'rgb': [140, 232, 90]
                },
                // hips > shoulders
                'hips_shoulders_m': {
                    'from_x': ['left_hip', 'right_hip'],
                    'from_y': ['left_hip', 'right_hip'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [242, 85, 240]
                },
                // shoulders (mid-point)
                'shoulder_l_m': { // left
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                'shoulder_r_m': { // right
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                // shoulders (mid-point) > nose (neck)
                'neck': {
                    'from_x': ['left_shoulder', 'right_shoulder'],
                    'from_y': ['left_shoulder', 'right_shoulder'],
                    'to_x': ['left_ear', 'right_ear'],
                    'to_y': ['left_ear', 'right_ear'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 108, 145]
                },
                // left shoulder > left elbow
                'l_shoulder_l_elbow': {
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_elbow'],
                    'to_y': ['left_elbow'],
                    'scores': ['left_elbow'],
                    'rgb': [245, 129, 66]
                },
                // right shoulder > right elbow
                'r_shoulder_r_elbow': {
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['right_elbow'],
                    'to_y': ['right_elbow'],
                    'scores': ['right_elbow'],
                    'rgb': [245, 129, 66]
                },
                // left elbow > left wrist
                'l_elbow_l_wrist': {
                    'from_x': ['left_elbow'],
                    'from_y': ['left_elbow'],
                    'to_x': ['left_wrist'],
                    'to_y': ['left_wrist'],
                    'scores': ['left_wrist'],
                    'rgb': [227, 156, 118]
                },
                // right elbow > right wrist
                'r_elbow_r_wrist': {
                    'from_x': ['right_elbow'],
                    'from_y': ['right_elbow'],
                    'to_x': ['right_wrist'],
                    'to_y': ['right_wrist'],
                    'scores': ['right_wrist'],
                    'rgb': [227, 156, 118]
                },
                // nose > left eye
                'nose_l_eye': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['left_eye'],
                    'to_y': ['left_eye'],
                    'scores': ['left_eye'],
                    'rgb': [255, 0, 0]
                },
                // nose > right eye
                'nose_r_eye': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['right_eye'],
                    'to_y': ['right_eye'],
                    'scores': ['right_eye'],
                    'rgb': [255, 0, 0]
                },
                // left eye > left ear
                'l_eye_l_ear': {
                    'from_x': ['left_eye'],
                    'from_y': ['left_eye'],
                    'to_x': ['left_ear'],
                    'to_y': ['left_ear'],
                    'scores': ['left_ear'],
                    'rgb': [197, 217, 15]
                },
                // right eye > right ear
                'r_eye_r_ear': {
                    'from_x': ['right_eye'],
                    'from_y': ['right_eye'],
                    'to_x': ['right_ear'],
                    'to_y': ['right_ear'],
                    'scores': ['right_eye'],
                    'rgb': [197, 217, 15]
                }
            },
            'posenet': {
                // left hip > left knee
                'l_hip_l_knee': {
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_knee'],
                    'to_y': ['left_knee'],
                    'scores': ['left_knee'],
                    'rgb': [42, 163, 69]
                },
                // right hip > right knee
                'r_hip_r_knee': {
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_knee'],
                    'to_y': ['right_knee'],
                    'scores': ['right_knee'],
                    'rgb': [42, 163, 69]
                },
                // hips (mid-point)
                'hip_l_m': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                'hip_r_m': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                // hip to shoulders
                'hip_l_shoulder_l': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_shoulder'],
                    'to_y': ['left_shoulder'],
                    'scores': ['left_hip', 'left_shoulder'],
                    'rgb': [242, 85, 240]
                },
                'hip_r_shoulder_r': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_shoulder'],
                    'to_y': ['right_shoulder'],
                    'scores': ['right_hip', 'right_shoulder'],
                    'rgb': [242, 85, 240]
                },
                // left knee > left ankle
                'l_knee_l_ankle': {
                    'from_x': ['left_knee'],
                    'from_y': ['left_knee'],
                    'to_x': ['left_ankle'],
                    'to_y': ['left_ankle'],
                    'scores': ['left_ankle'],
                    'rgb': [140, 232, 90]
                },
                // right knee > right ankle
                'r_knee_r_ankle': {
                    'from_x': ['right_knee'],
                    'from_y': ['right_knee'],
                    'to_x': ['right_ankle'],
                    'to_y': ['right_ankle'],
                    'scores': ['right_ankle'],
                    'rgb': [140, 232, 90]
                },
                // hips > shoulders
                'hips_shoulders_m': {
                    'from_x': ['left_hip', 'right_hip'],
                    'from_y': ['left_hip', 'right_hip'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [242, 85, 240]
                },
                // shoulders (mid-point)
                'shoulder_l_m': { // left
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                'shoulder_r_m': { // right
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                // shoulders (mid-point) > nose (neck)
                'neck': {
                    'from_x': ['left_shoulder', 'right_shoulder'],
                    'from_y': ['left_shoulder', 'right_shoulder'],
                    'to_x': ['left_ear', 'right_ear'],
                    'to_y': ['left_ear', 'right_ear'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 108, 145]
                },
                // left shoulder > left elbow
                'l_shoulder_l_elbow': {
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_elbow'],
                    'to_y': ['left_elbow'],
                    'scores': ['left_elbow'],
                    'rgb': [245, 129, 66]
                },
                // right shoulder > right elbow
                'r_shoulder_r_elbow': {
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['right_elbow'],
                    'to_y': ['right_elbow'],
                    'scores': ['right_elbow'],
                    'rgb': [245, 129, 66]
                },
                // left elbow > left wrist
                'l_elbow_l_wrist': {
                    'from_x': ['left_elbow'],
                    'from_y': ['left_elbow'],
                    'to_x': ['left_wrist'],
                    'to_y': ['left_wrist'],
                    'scores': ['left_wrist'],
                    'rgb': [227, 156, 118]
                },
                // right elbow > right wrist
                'r_elbow_r_wrist': {
                    'from_x': ['right_elbow'],
                    'from_y': ['right_elbow'],
                    'to_x': ['right_wrist'],
                    'to_y': ['right_wrist'],
                    'scores': ['right_wrist'],
                    'rgb': [227, 156, 118]
                },
                // nose > left eye
                'nose_l_eye': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['left_eye'],
                    'to_y': ['left_eye'],
                    'scores': ['left_eye'],
                    'rgb': [255, 0, 0]
                },
                // nose > right eye
                'nose_r_eye': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['right_eye'],
                    'to_y': ['right_eye'],
                    'scores': ['right_eye'],
                    'rgb': [255, 0, 0]
                },
                // left eye > left ear
                'l_eye_l_ear': {
                    'from_x': ['left_eye'],
                    'from_y': ['left_eye'],
                    'to_x': ['left_ear'],
                    'to_y': ['left_ear'],
                    'scores': ['left_ear'],
                    'rgb': [197, 217, 15]
                },
                // right eye > right ear
                'r_eye_r_ear': {
                    'from_x': ['right_eye'],
                    'from_y': ['right_eye'],
                    'to_x': ['right_ear'],
                    'to_y': ['right_ear'],
                    'scores': ['right_eye'],
                    'rgb': [197, 217, 15]
                }
            },
            'blazepose': {
                // left hip > left knee
                'l_hip_l_knee': {
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_knee'],
                    'to_y': ['left_knee'],
                    'scores': ['left_knee'],
                    'rgb': [42, 163, 69]
                },
                // right hip > right knee
                'r_hip_r_knee': {
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_knee'],
                    'to_y': ['right_knee'],
                    'scores': ['right_knee'],
                    'rgb': [42, 163, 69]
                },
                // hips (mid-point)
                'hip_l_m': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                'hip_r_m': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['left_hip', 'right_hip'],
                    'to_y': ['left_hip', 'right_hip'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [140, 232, 90]
                },
                // hip to shoulders
                'hip_l_shoulder_l': { // left
                    'from_x': ['left_hip'],
                    'from_y': ['left_hip'],
                    'to_x': ['left_shoulder'],
                    'to_y': ['left_shoulder'],
                    'scores': ['left_hip', 'left_shoulder'],
                    'rgb': [242, 85, 240]
                },
                'hip_r_shoulder_r': { // right
                    'from_x': ['right_hip'],
                    'from_y': ['right_hip'],
                    'to_x': ['right_shoulder'],
                    'to_y': ['right_shoulder'],
                    'scores': ['right_hip', 'right_shoulder'],
                    'rgb': [242, 85, 240]
                },
                // left knee > left ankle
                'l_knee_l_ankle': {
                    'from_x': ['left_knee'],
                    'from_y': ['left_knee'],
                    'to_x': ['left_ankle'],
                    'to_y': ['left_ankle'],
                    'scores': ['left_ankle'],
                    'rgb': [140, 232, 90]
                },
                // right knee > right ankle
                'r_knee_r_ankle': {
                    'from_x': ['right_knee'],
                    'from_y': ['right_knee'],
                    'to_x': ['right_ankle'],
                    'to_y': ['right_ankle'],
                    'scores': ['right_ankle'],
                    'rgb': [140, 232, 90]
                },
                // left ankle > left heel
                'l_ankle_l_heel': {
                    'from_x': ['left_ankle'],
                    'from_y': ['left_ankle'],
                    'to_x': ['left_heel'],
                    'to_y': ['left_heel'],
                    'scores': ['left_ankle', 'left_heel'],
                    'rgb': [42, 163, 69]
                },
                // left heel > left foot_index
                'l_heel_l_foot_index': {
                    'from_x': ['left_heel'],
                    'from_y': ['left_heel'],
                    'to_x': ['left_foot_index'],
                    'to_y': ['left_foot_index'],
                    'scores': ['left_heel', 'left_foot_index'],
                    'rgb': [42, 163, 69]
                },
                // left foot_index > left ankle
                'l_foot_index_l_ankle': {
                    'from_x': ['left_foot_index'],
                    'from_y': ['left_foot_index'],
                    'to_x': ['left_ankle'],
                    'to_y': ['left_ankle'],
                    'scores': ['left_foot_index', 'left_ankle'],
                    'rgb': [42, 163, 69]
                },
                // right ankle > right heel
                'r_ankle_r_heel': {
                    'from_x': ['right_ankle'],
                    'from_y': ['right_ankle'],
                    'to_x': ['right_heel'],
                    'to_y': ['right_heel'],
                    'scores': ['right_ankle', 'right_heel'],
                    'rgb': [42, 163, 69]
                },
                // right heel > right foot_index
                'r_heel_r_foot_index': {
                    'from_x': ['right_heel'],
                    'from_y': ['right_heel'],
                    'to_x': ['right_foot_index'],
                    'to_y': ['right_foot_index'],
                    'scores': ['right_heel', 'right_foot_index'],
                    'rgb': [42, 163, 69]
                },
                // right foot_index > right ankle
                'r_foot_index_r_ankle': {
                    'from_x': ['right_foot_index'],
                    'from_y': ['right_foot_index'],
                    'to_x': ['right_ankle'],
                    'to_y': ['right_ankle'],
                    'scores': ['right_foot_index', 'right_ankle'],
                    'rgb': [42, 163, 69]
                },
                // hips > shoulders
                'hips_shoulders_m': {
                    'from_x': ['left_hip', 'right_hip'],
                    'from_y': ['left_hip', 'right_hip'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_hip', 'right_hip'],
                    'rgb': [242, 85, 240]
                },
                // shoulders (mid-point)
                'shoulder_l_m': { // left
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                'shoulder_r_m': { // right
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['left_shoulder', 'right_shoulder'],
                    'to_y': ['left_shoulder', 'right_shoulder'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 70, 235]
                },
                // shoulders (mid-point) > nose (neck)
                'neck': {
                    'from_x': ['left_shoulder', 'right_shoulder'],
                    'from_y': ['left_shoulder', 'right_shoulder'],
                    'to_x': ['left_ear', 'right_ear'],
                    'to_y': ['left_ear', 'right_ear'],
                    'scores': ['left_shoulder', 'right_shoulder'],
                    'rgb': [92, 108, 145]
                },
                // left shoulder > left elbow
                'l_shoulder_l_elbow': {
                    'from_x': ['left_shoulder'],
                    'from_y': ['left_shoulder'],
                    'to_x': ['left_elbow'],
                    'to_y': ['left_elbow'],
                    'scores': ['left_elbow'],
                    'rgb': [245, 129, 66]
                },
                // right shoulder > right elbow
                'r_shoulder_r_elbow': {
                    'from_x': ['right_shoulder'],
                    'from_y': ['right_shoulder'],
                    'to_x': ['right_elbow'],
                    'to_y': ['right_elbow'],
                    'scores': ['right_elbow'],
                    'rgb': [245, 129, 66]
                },
                // left elbow > left wrist
                'l_elbow_l_wrist': {
                    'from_x': ['left_elbow'],
                    'from_y': ['left_elbow'],
                    'to_x': ['left_wrist'],
                    'to_y': ['left_wrist'],
                    'scores': ['left_wrist'],
                    'rgb': [227, 156, 118]
                },
                // right elbow > right wrist
                'r_elbow_r_wrist': {
                    'from_x': ['right_elbow'],
                    'from_y': ['right_elbow'],
                    'to_x': ['right_wrist'],
                    'to_y': ['right_wrist'],
                    'scores': ['right_wrist'],
                    'rgb': [227, 156, 118]
                },

                // left wrist > left_thumb
                'l_wrist_l_thumb': {
                    'from_x': ['left_wrist'],
                    'from_y': ['left_wrist'],
                    'to_x': ['left_thumb'],
                    'to_y': ['left_thumb'],
                    'scores': ['left_wrist', 'left_thumb'],
                    'rgb': [245, 129, 66]
                },
                // left wrist > left_pinky
                'l_wrist_l_pinky': {
                    'from_x': ['left_wrist'],
                    'from_y': ['left_wrist'],
                    'to_x': ['left_pinky'],
                    'to_y': ['left_pinky'],
                    'scores': ['left_wrist', 'left_pinky'],
                    'rgb': [245, 129, 66]
                },
                // left pinky > left index
                'l_pinky_l_index': {
                    'from_x': ['left_pinky'],
                    'from_y': ['left_pinky'],
                    'to_x': ['left_index'],
                    'to_y': ['left_index'],
                    'scores': ['left_pinky', 'left_index'],
                    'rgb': [245, 129, 66]
                },
                // left index > left wrist
                'l_index_l_wrist': {
                    'from_x': ['left_index'],
                    'from_y': ['left_index'],
                    'to_x': ['left_wrist'],
                    'to_y': ['left_wrist'],
                    'scores': ['left_index', 'left_wrist'],
                    'rgb': [245, 129, 66]
                },
                // right wrist > right_thumb
                'r_wrist_r_thumb': {
                    'from_x': ['right_wrist'],
                    'from_y': ['right_wrist'],
                    'to_x': ['right_thumb'],
                    'to_y': ['right_thumb'],
                    'scores': ['right_wrist', 'right_thumb'],
                    'rgb': [245, 129, 66]
                },
                // right wrist > right_pinky
                'r_wrist_r_pinky': {
                    'from_x': ['right_wrist'],
                    'from_y': ['right_wrist'],
                    'to_x': ['right_pinky'],
                    'to_y': ['right_pinky'],
                    'scores': ['right_wrist', 'right_pinky'],
                    'rgb': [245, 129, 66]
                },
                // right pinky > right index
                'r_pinky_r_index': {
                    'from_x': ['right_pinky'],
                    'from_y': ['right_pinky'],
                    'to_x': ['right_index'],
                    'to_y': ['right_index'],
                    'scores': ['right_pinky', 'right_index'],
                    'rgb': [245, 129, 66]
                },
                // right index > right wrist
                'r_index_r_wrist': {
                    'from_x': ['right_index'],
                    'from_y': ['right_index'],
                    'to_x': ['right_wrist'],
                    'to_y': ['right_wrist'],
                    'scores': ['right_index', 'right_wrist'],
                    'rgb': [245, 129, 66]
                },
                // nose > left eye_inner
                'nose_l_eye_inner': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['left_eye_inner'],
                    'to_y': ['left_eye_inner'],
                    'scores': ['left_eye_inner'],
                    'rgb': [255, 0, 0]
                },

                // nose > right eye_inner
                'nose_r_eye_inner': {
                    'from_x': ['nose'],
                    'from_y': ['nose'],
                    'to_x': ['right_eye_inner'],
                    'to_y': ['right_eye_inner'],
                    'scores': ['right_eye_inner'],
                    'rgb': [255, 0, 0]
                },
                // mouth_left > mouth_right
                'l_mouth_r_mouth': {
                    'from_x': ['mouth_left'],
                    'from_y': ['mouth_left'],
                    'to_x': ['mouth_right'],
                    'to_y': ['mouth_right'],
                    'scores': ['mouth_left', 'mouth_right'],
                    'rgb': [150, 0, 0]
                },
                // mouth_right > mouth_left
                'r_mouth_l_mouth': {
                    'from_x': ['mouth_right'],
                    'from_y': ['mouth_right'],
                    'to_x': ['mouth_left'],
                    'to_y': ['mouth_left'],
                    'scores': ['mouth_right', 'mouth_left'],
                    'rgb': [150, 0, 0]
                },

                // left eye > left eye_outer
                'l_eye_l_eye_outer': {
                    'from_x': ['left_eye'],
                    'from_y': ['left_eye'],
                    'to_x': ['left_eye_outer'],
                    'to_y': ['left_eye_outer'],
                    'scores': ['left_eye_outer'],
                    'rgb': [197, 117, 15]
                },
                // left eye_outer > left ear
                'l_eye_outer_l_ear': {
                    'from_x': ['left_eye_outer'],
                    'from_y': ['left_eye_outer'],
                    'to_x': ['left_ear'],
                    'to_y': ['left_ear'],
                    'scores': ['left_ear'],
                    'rgb': [197, 117, 15]
                },
                // left eye_inner > left eye
                'l_eye_inner_l_eye': {
                    'from_x': ['left_eye_inner'],
                    'from_y': ['left_eye_inner'],
                    'to_x': ['left_eye'],
                    'to_y': ['left_eye'],
                    'scores': ['left_eye'],
                    'rgb': [197, 217, 15]
                },
                // right eye > right eye_outer
                'r_eye_r_eye_outer': {
                    'from_x': ['right_eye'],
                    'from_y': ['right_eye'],
                    'to_x': ['right_eye_outer'],
                    'to_y': ['right_eye_outer'],
                    'scores': ['right_eye_outer'],
                    'rgb': [197, 117, 15]
                },
                // right eye_outer > right ear
                'r_eye_outer_r_ear': {
                    'from_x': ['right_eye_outer'],
                    'from_y': ['right_eye_outer'],
                    'to_x': ['right_ear'],
                    'to_y': ['right_ear'],
                    'scores': ['right_ear'],
                    'rgb': [197, 117, 15]
                },
                // right eye_inner > right eye
                'r_eye_inner_r_eye': {
                    'from_x': ['right_eye_inner'],
                    'from_y': ['right_eye_inner'],
                    'to_x': ['right_eye'],
                    'to_y': ['right_eye'],
                    'scores': ['right_eye'],
                    'rgb': [197, 217, 15]
                },
            }
        },
    },
}