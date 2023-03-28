// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const command = {
    initialized: false, // is command initialized
    prev: {x: 90, y: 90}, // cmd
    next: {x: 90, y: 90}, // now/temp cmd
    sendCmd: {x: false, y: false}, // send cmd
    angle: {x: 0, y: 0}, // move angle
    current: null, // current cmd

    /*
        Init servo angles
    */
    init: function () {
        command.prev.x = config.servo.initAngle.x;
        command.prev.y = config.servo.initAngle.y;
        command.next.x = config.servo.initAngle.x;
        command.next.y = config.servo.initAngle.y;
    },

    /*
        Prepare command
     */
    prepare: function () {
        // convert current delta to angle
        command.angle = servo.deltaToAngle(); // screen view = 100% real camera FOV

        // prepare commands if servo movement enabled
        if (config.servo.horizontal) {
            command.next.x = parseInt(command.angle.x + (config.servo.maxAngle.x / 2)); // now cmd
        }
        if (config.servo.vertical) {
            command.next.y = parseInt(command.angle.y + (config.servo.maxAngle.y / 2)); // now cmd
        }

        // fix max angles
        if (command.next.x < config.servo.minAngle.x) {
            command.next.x = config.servo.minAngle.x;
        }
        if (command.next.x > config.servo.maxAngle.x) {
            command.next.x = config.servo.maxAngle.x; // servo get angles from 0-180, 90 is center
        }
        if (command.next.y < config.servo.minAngle.y) {
            command.next.y = config.servo.minAngle.y;
        }
        if (command.next.y > config.servo.maxAngle.y) {
            command.next.y = config.servo.maxAngle.y;
        }

        // fix limit
        if (command.next.x < config.servo.minLimit.x) {
            command.next.x = config.servo.minLimit.x;
        }
        if (command.next.x > config.servo.maxLimit.x) {
            command.next.x = config.servo.maxLimit.x; // servo get angles from 0-180, 90 is center
        }
        if (command.next.y < config.servo.minLimit.y) {
            command.next.y = config.servo.minLimit.y;
        }
        if (command.next.y > config.servo.maxLimit.y) {
            command.next.y = config.servo.maxLimit.y;
        }
    },

    /*
        Build command
     */
    build: function () {
        // reset
        command.sendCmd.x = false;
        command.sendCmd.y = false;

        // horizontal movement
        if (command.prev.x != command.next.x
            && (config.servo.angleStep == 0 || command.next.x % config.servo.angleStep == 0)) {
            command.sendCmd.x = true;
        }

        // vertical movement
        if (command.prev.y != command.next.y
            && (config.servo.angleStep == 0 || command.next.y % config.servo.angleStep == 0)) {
            command.sendCmd.y = true;
        }

        // update prev with current
        command.prev.x = command.next.x;
        command.prev.y = command.next.y;
    },

    /*
        Update command / every frame
     */
    update: function (actionName = null) {
        // init
        if (!command.initialized) {
            command.init();
            command.initialized = true;
        }

        // prepare command
        command.prepare();
        command.build();

        // x, y
        cmdAry = [];
        cmdAry.push(command.prev.x);
        cmdAry.push(command.prev.y);

        // counter
        cmdAry.push(tracker.countDetected());

        // actions
        for (let name of action.actions) {
            if (name == actionName) {
                cmdAry.push(1);
            } else {
                if (action.toggled[name]) {
                    cmdAry.push(1);
                } else {
                    cmdAry.push(0);
                }
            }
        }

        // send command to servo
        command.send(cmdAry.join(config.command.serial.delimiter));
    },

    /*
        Send command to servo
     */
    send: function (cmd) {
        if (cmd == command.current) {
            return; // do not send same command again
        }

        //console.log(cmd);
        command.current = cmd;

        // local command (serial)
        if (serial.enabled) {
            switch (config.command.serial.format) {
                // raw
                case 'RAW':
                    cmd += config.command.serial.endchar;
                    serial.send(cmd);
                    console.log("SERIAL SEND RAW: " + cmd);
                    break;
                // json
                case 'JSON':
                    json = JSON.stringify({cmd: cmd});
                    serial.send(json);
                    console.log("SERIAL SEND JSON: " + json);
                    break;
            }
        }

        // remote command (http)
        if (config.init.mode == 'remote') {
            let addr;
            switch (config.command.remote.format) {
                // raw
                case 'RAW':
                    addr = app.sourceRemote + config.command.remote.path + '?cmd=' + cmd + remote.appendToken();
                    $.get(addr, function (data) {
                        tracker.remoteStatus = data;
                        //console.log('AJAX RESPONSE RAW:' + data);
                    });
                    break;
                // json
                case 'JSON':
                    addr = app.sourceRemote + config.command.remote.path + remote.appendToken();
                    $.post(addr, {cmd: cmd}, function (data) {
                        try {
                            tmp = JSON.parse(data)['cmd'];
                            tracker.remoteStatus = tmp;
                        } catch (err) {
                            //
                        }
                        //console.log('AJAX RESPONSE JSON:' + data);
                    });
            }
        }
    },
}