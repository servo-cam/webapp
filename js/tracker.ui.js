// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const ui = {

    clickCoords: null,

    /*
        Handle mouse events
     */
    handlePointerEvents: function () {
        if (ui.clickCoords != null) {
            targets.onClick(ui.clickCoords.x, ui.clickCoords.y);
            ui.clickCoords = null;
        }
    },

    /*
        Check if panel enabled
     */
    panelEnabled: function (id) {
        if (typeof config.panel[id] !== 'undefined' && config.panel[id]) {
            return true;
        }
        return false;
    },

    /*
        Enable button / trigger
     */
    enableBtn: function (trigger, id = null, custom = null) {
        let btn;
        if (typeof trigger === 'string' || trigger instanceof String) {
            if (id != null) {
                btn = $('button[data-trigger="' + trigger + '"][data-id="' + id + '"]');
            } else {
                btn = $('button[data-trigger="' + trigger + '"]');
            }
        } else {
            btn = trigger;
        }
        let c = 'primary';
        if (custom != null) {
            c = custom;
        }
        btn.attr('data-enabled', 1);
        btn.removeClass('btn-success');
        btn.removeClass('btn-danger');
        btn.removeClass('btn-primary');
        btn.removeClass('btn-secondary');
        btn.addClass('btn-' + c);
    },

    /*
        Disable button / trigger
     */
    disableBtn: function (trigger, id = null, custom = null) {
        let btn;
        if (typeof trigger === 'string' || trigger instanceof String) {
            if (id != null) {
                btn = $('button[data-trigger="' + trigger + '"][data-id="' + id + '"]');
            } else {
                btn = $('button[data-trigger="' + trigger + '"]');
            }
        } else {
            btn = trigger;
        }
        let c = 'secondary';
        if (custom != null) {
            c = custom;
        }
        btn.attr('data-enabled', 0);
        btn.removeClass('btn-success');
        btn.removeClass('btn-danger');
        btn.removeClass('btn-primary');
        btn.removeClass('btn-secondary');

        if (custom !== false) {
            btn.addClass('btn-' + c);
        }
    },

    /*
        Show panel
     */
    showPanel: function (id) {
        config.panel[id] = true;
        $('.control-panel[data-id="' + id + '"]').show();
    },

    /*
        Hide panel
     */
    hidePanel: function (id) {
        config.panel[id] = false;
        $('.control-panel[data-id="' + id + '"]').hide();
    },

    /*
        Show or hide status alert
     */
    statusAlert: function (id, status = true, text = null) {
        if (status) {
            if (text != null) {
                $('.alert-monit[data-id="' + id + '"]').html(text);
            }
            $('.alert-monit[data-id="' + id + '"]').show();
        } else {
            if (text != null) {
                $('.alert-monit[data-id="' + id + '"]').html(text);
            }
            $('.alert-monit[data-id="' + id + '"]').hide();
        }
    },
};