// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const area = {

    /*
        Check if coords are in area
     */
    inArea: function (coords, type) {
        const t = type.toLowerCase();

        // check if all defined
        if (typeof config.area.box[t].xMin === 'undefined'
            || config.area.box[t].xMin == null
            || typeof config.area.box[t].yMin === 'undefined'
            || config.area.box[t].yMin == null
            || typeof config.area.box[t].width === 'undefined'
            || config.area.box[t].width == null
            || typeof config.area.box[t].height === 'undefined'
            || config.area.box[t].height == null
            || config.area.box[t].width == 0
            || config.area.box[t].height == 0) {
            return false;
        }

        let xMin = config.area.box[t].xMin;
        let yMin = config.area.box[t].yMin;

        // if world coords then append delta transform
        if (!config.area.world[t]) {
            xMin -= tracker.dx;
            yMin -= tracker.dy;
        }

        // prepare max
        let xMax = xMin + config.area.box[t].width;
        let yMax = yMin + config.area.box[t].height;

        // check
        if (coords.x >= xMin && coords.x <= xMax && coords.y >= yMin && coords.y <= yMax) {
            return true;
        }
        return false;
    },

    getMiddleHeight: function (box, type) {
        const t = type.toLowerCase();

        // check if all defined
        if (typeof box.xMin === 'undefined'
            || box.xMin == null
            || typeof box.yMin === 'undefined'
            || box.yMin == null
            || typeof box.width === 'undefined'
            || box.width == null
            || typeof box.height === 'undefined'
            || box.height == null
            || box.width == 0
            || box.height == 0) {
            return false;
        }

        let yMin = box.yMin;
        let yMax = yMin + box.height;

        let y1 = box.yMin + tracker.dy;
        let y2 = y1 + box.height;

        // add delta if NOT world position
        if (!config.area.world[t]) {
            return ((y1 + y2) / 2);
        } else {
            return (yMax + yMin) / 2;
        }
    },
}
    