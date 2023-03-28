// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const filters = {

    /*
        Filter not allowed object
     */
    notAllowed: function (idx) {
        if (config.area.enabled.target && !area.inArea(tracker.objects[idx]['center'], 'TARGET')) {
            return true;
        }
        return false;
    },
};