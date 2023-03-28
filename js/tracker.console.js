// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const dbg_console = {

    paused: false, // is paused
    items: [], // console items

    /*
        Handle received command
     */
    handle: function (cmd) {
        // handle commands here
    },

    /*
        On command send event listener
     */
    onSend: function (cmd) {
        dbg_console.log('CMD: ', cmd, true);
        dbg_console.handle(cmd);
    },

    /*
        Log to console
     */
    log: function (k, v, force = false) {
        if (!dbg_console.paused || force) {
            const date = new Date;
            k = '[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds() + '] ' + k;
            dbg_console.items.push(debug.item(k, v, false));
        }
        console.log(k, v);
    },

    /*
        Append console items
     */
    listen: function () {
        for (let i in dbg_console.items) {
            $('#debug_console .items ul').append('<li>' + dbg_console.items[i] + '</li>');
            dbg_console.items.splice(i, 1);
        }
    },

    /*
        Clear console window
     */
    clear: function () {
        $('#debug_console .items ul').html('');
    },

    /*
        Pause console listener
     */
    pause: function () {
        dbg_console.paused = true;
    },

    /*
        Resume console listener
     */
    resume: function () {
        dbg_console.paused = false;
    },

    /*
        Check if console apused
     */
    isPaused: function () {
        return dbg_console.paused;
    },
}