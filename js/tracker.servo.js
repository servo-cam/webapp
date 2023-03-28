// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const servo = {

    enabled: false, // is servo enabled

    /*
        Enable servo
     */
    enable: function () {
        servo.enabled = true;
    },

    /*
        Disable servo
     */
    disable: async function () {
        servo.enabled = false;
        ui.disableBtn('btn-servo');
    },

    /*
        Check if servo enabled
     */
    isEnabled: function () {
        return servo.enabled;
    },

    /*
        Get min allowed coords
     */
    getMinCoords: function (real = false) {
        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: 0,
                y: 0
            };
        }

        if (config.servo.use_limit == true || real == true) {
            // camera, real camera params
            return {
                x: 0 - ((config.servo.maxLimit.x / config.camera.fov.x - 1) / 2),
                y: 0 - ((config.servo.maxLimit.x / config.camera.fov.x - 1) / 2)
            };
        } else {
            // camera, real camera params
            return {
                x: 0 - ((config.servo.maxAngle.x / config.camera.fov.x - 1) / 2),
                y: 0 - ((config.servo.maxAngle.x / config.camera.fov.x - 1) / 2)
            };
        }
    },

    /*
        Get max allowed coords
     */
    getMaxCoords: function (real = false) {
        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: 1,
                y: 1
            };
        }

        if (config.servo.use_limit == true || real == true) {
            // camera, real camera params
            return {
                x: 1 + ((config.servo.maxLimit.x / config.camera.fov.x - 1) / 2),
                y: 1 + ((config.servo.maxLimit.x / config.camera.fov.x - 1) / 2)
            };

        } else {
            // camera, real camera params
            return {
                x: 1 + ((config.servo.maxAngle.x / config.camera.fov.x - 1) / 2),
                y: 1 + ((config.servo.maxAngle.x / config.camera.fov.x - 1) / 2)
            };
        }
    },

    /*
        Get min allowed delta
     */
    getMinDelta: function (real = false) {
        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: -0.5,
                y: -0.5
            };
        }

        if (config.servo.use_limit == true || real == true) {
            // camera, real camera params
            return {
                x: (-config.servo.maxLimit.x / config.camera.fov.x) / 2,
                y: (-config.servo.maxLimit.y / config.camera.fov.y) / 2
            };

        } else {
            // camera, real camera params
            return {
                x: (-config.servo.maxAngle.x / config.camera.fov.x) / 2,
                y: (-config.servo.maxAngle.y / config.camera.fov.y) / 2
            };
        }
    },

    /*
        Get max allowed delta
     */
    getMaxDelta: function (real = false) {
        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: 0.5,
                y: 0.5
            };
        }

        if (config.servo.use_limit == true || real == true) {
            // camera, real camera params
            return {
                x: (config.servo.maxLimit.x / config.camera.fov.x) / 2 - (config.servo.minLimit.x / config.camera.fov.x),
                y: (config.servo.maxLimit.y / config.camera.fov.y) / 2 - (config.servo.minLimit.y / config.camera.fov.y)
            };

        } else {
            // camera, real camera params
            return {
                x: (config.servo.maxAngle.x / config.camera.fov.x) / 2,
                y: (config.servo.maxAngle.y / config.camera.fov.y) / 2
            };
        }
    },

    /*
        Convert delta to servo angle
     */
    deltaToAngle: function (delta = null) {
        if (delta == null) {
            delta = {
                x: tracker.dx,
                y: tracker.dy,
            };
        }

        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: Math.round(parseFloat(delta.x * config.servo.maxAngle.x), 0),
                y: Math.round(parseFloat(delta.y * config.servo.maxAngle.y), 0)
            };
        }

        // camera, real camera params
        return {
            x: Math.round(parseFloat(delta.x * config.camera.fov.x) / config.servo.angleMultiplier.x, 0),
            y: Math.round(parseFloat(delta.y * config.camera.fov.y) / config.servo.angleMultiplier.y, 0)
        };
    },

    /*
        Convert point coords to servo angle
     */
    pointToAngle: function (coords) {
        // video file, for video FOV is always 100%, from 0 to 1
        if (app.source == 'video' || config.servo.map_fov == false) {
            return {
                x: Math.round(parseFloat((0.5 - coords.x) * (config.servo.maxAngle.x)), 0),
                y: Math.round(parseFloat((0.5 - coords.y) * (config.servo.maxAngle.y)), 0),
            };
        }

        return {
            x: Math.round(parseFloat((0.5 - coords.x) * (config.camera.fov.x) / config.servo.angleMultiplier.x), 0),
            y: Math.round(parseFloat((0.5 - coords.y) * (config.camera.fov.y) / config.servo.angleMultiplier.y), 0),
        };
    },
}