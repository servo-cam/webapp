// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const manual = {
    keys: {}, // pressed keys
    btn: {}, // pressed buttons
    keyUP: 38, // code
    keyLEFT: 37, // code
    keyRIGHT: 39, // code
    keyDOWN: 40, // code
    move: false, // is movementy
    isMouseControl: false,
    mouseStartCoords: {},
    mouseStopCoords: {},
    mouseDelta: {}, // on mouse click current delta store
    x: 0.0, // x
    y: 1.0, // y
    moreDelta: {
        x: 0,
        y: 0
    },

    /*
        Initialize
     */
    init: function () {
        document.body.onkeyup =
            document.body.onkeydown = function (e) {
                const kc = e.keyCode || e.which;
                if (e.preventDefault) {
                    if (config.target.mode == 'MANUAL') {
                        e.preventDefault();
                    }
                } else {
                    e.returnValue = false;
                }
                manual.keys[kc] = e.type == 'keydown';
            };

        $('document').ready(function () {
            $('.control-trigger').mousedown(function (e) {
                e.preventDefault();
                const direction = $(this).attr('data-id');
                manual.x = 0.0;
                manual.y = 0.0;
                switch (direction) {
                    case 'LEFT':
                        manual.x = -1.0;
                        break;
                    case 'RIGHT':
                        manual.x = 1.0;
                        break;
                    case 'UP':
                        manual.y = 1.0;
                        break;
                    case 'DOWN':
                        manual.y = -1.0;
                        break;
                    case 'SPEED_UP':
                        config.manual.speed += 0.01;
                        break;
                    case 'SPEED_DOWN':
                        if (config.manual.speed > 0.01) {
                            config.manual.speed -= 0.01;
                        }
                        break;
                }
                manual.moveDirection(direction);
                manual.move = true;

                $('.control-speed-value').text(config.manual.speed.toFixed(2) + 'x');
            });

            $('.control-trigger').mouseleave(function (e) {
                e.preventDefault();
                const direction = $(this).attr('data-id');
                manual.x = 0.0;
                manual.y = 0.0;
                manual.move = false;
            });
            $('body').mouseup(function (e) {
                e.preventDefault();
                const direction = $(this).attr('data-id');
                manual.x = 0.0;
                manual.y = 0.0;
                manual.move = false;
            });

            manual.toggleManualControls();
        });

        manual.moveCamera();
        setInterval(function () {
            manual.detectMovement();
        }, 1000 / 24);
    },

    /*
        Toggle manual control
     */
    toggleManualControls: function () {
        if (config.target.mode == 'MANUAL') {
            $('.control-speed-value').text(config.manual.speed + 'x');
            $('#panel_manual').show();
        } else {
            $('#panel_manual').hide();
        }

        if (config.target.mode == 'MANUAL' || config.target.mode == 'MOUSE') {
            $('#panel_mode_manual').show();
        } else {
            $('#panel_mode_manual').hide();
        }
    },

    /*
        Move camera with delta
     */
    moveCamera: function (dx, dy) {
        min = servo.getMinDelta(true);
        max = servo.getMaxDelta(true);

        if (tracker.dx <= max.x && tracker.dx >= min.x) {
            tracker.dx += (dx || 0) * config.manual.speed;
        }

        // fix min/max
        if (tracker.dx > max.x) {
            tracker.dx = max.x;
        } else if (tracker.dx < min.x) {
            tracker.dx = min.x;
        }


        tracker.dy += (dy || 0) * config.manual.speed;

        // fix min/max
        if (tracker.dy > max.y) {
            tracker.dy = max.y;
        } else if (tracker.dy < min.y) {
            tracker.dy = min.y;
        }
    },

    /*
        Check if is movement
     */
    detectMovement: function () {
        if (manual.keys[manual.keyLEFT] || manual.btn[manual.keyLEFT]) {
            manual.moveCamera(1, 0);
        }
        if (manual.keys[manual.keyRIGHT] || manual.btn[manual.keyRIGHT]) {
            manual.moveCamera(-1, 0);
        }
        if (manual.keys[manual.keyUP] || manual.btn[manual.keyUP]) {
            manual.moveCamera(0, 1);
        }
        if (manual.keys[manual.keyDOWN] || manual.btn[manual.keyDOWN]) {
            manual.moveCamera(0, -1);
        }
    },

    /*
        Do movement
     */
    moveDirection: function (direction) {
        switch (direction) {
            case 'UP':
                manual.moveCamera(0, 1);
                break;
            case 'DOWN':
                manual.moveCamera(0, -1);
                break;
            case 'LEFT':
                manual.moveCamera(1, 0);
                break;
            case 'RIGHT':
                manual.moveCamera(-1, 0);
                break;
            case 'CENTER':
                targeting.center();
                break;
        }
    },

    /*
        Listen for key control
     */
    keyControl: function () {
        const tmp = 4;
        targeting.power.x = tmp;
        targeting.power.y = tmp;

        if (manual.move) {
            if (manual.x > 0) {
                manual.btn[manual.keyLEFT] = false;
                manual.btn[manual.keyRIGHT] = true;
            } else if (manual.x < 0) {
                manual.btn[manual.keyLEFT] = true;
                manual.btn[manual.keyRIGHT] = false;
            } else {
                manual.btn[manual.keyLEFT] = false;
                manual.btn[manual.keyRIGHT] = false;
            }
            if (manual.y > 0) {
                manual.btn[manual.keyUP] = true;
                manual.btn[manual.keyDOWN] = false;
            } else if (manual.y < 0) {
                manual.btn[manual.keyUP] = false;
                manual.btn[manual.keyDOWN] = true;
            } else {
                manual.btn[manual.keyUP] = false;
                manual.btn[manual.keyDOWN] = false;
            }
        } else {
            manual.resetKeys();
        }
    },

    onMouseClick: function () {
        manual.mouseDelta = {
            x: tracker.dx,
            y: tracker.dy
        };
        manual.isMouseControl = true;
        const coords = upscaler.pointerToVideoTransform(tracker.mouseX, tracker.mouseY);
        manual.mouseStartCoords = upscaler.normalize(coords);
    },

    onMouseRelease: function () {
        manual.isMouseControl = false;
        manual.mouseDelta = {};
        manual.mouseStartCoords = {};
    },

    /*
        Update coord with pointer coords
     */
    mouseControl: function () {
        if (!manual.isMouseControl) {
            return;
        }

        const delta = upscaler.pointerToVideoDeltaNormalized(tracker.mouseX, tracker.mouseY);
        const coords = upscaler.pointerToVideoTransform(tracker.mouseX, tracker.mouseY);
        const normalized = upscaler.normalize(coords);

        minDelta = servo.getMinDelta(true);
        maxDelta = servo.getMaxDelta(true);
        minCoords = servo.getMinCoords(true);
        maxCoords = servo.getMaxCoords(true);

        switch (config.manual.mode) {
            case 'POINT':
                let deltaMovement = {
                    x: normalized.x - manual.mouseStartCoords.x,
                    y: normalized.y - manual.mouseStartCoords.y
                };

                if (config.render.simulator || config.render.locked) {
                    if (tracker.dx <= maxDelta.x && tracker.dx >= minDelta.x) {
                        tracker.dx = manual.mouseDelta.x + deltaMovement.x;
                    }

                    if (tracker.dy <= maxDelta.y && tracker.dy >= minDelta.y) {
                        tracker.dy = manual.mouseDelta.y + deltaMovement.y;
                    }
                } else {
                    if (tracker.dx <= maxDelta.x && tracker.dx >= minDelta.x) {
                        tracker.dx = delta.x;
                    }

                    if (tracker.dy <= maxDelta.y && tracker.dy >= minDelta.y) {
                        tracker.dy = delta.y;
                    }
                }

                // fix min/max
                if (tracker.dx > maxDelta.x) {
                    tracker.dx = maxDelta.x
                } else if (tracker.dx < minDelta.x) {
                    tracker.dx = minDelta.x
                }

                if (tracker.dy > maxDelta.y) {
                    tracker.dy = maxDelta.y
                } else if (tracker.dy < minDelta.y) {
                    tracker.dy = minDelta.y
                }
                break;
            case 'NOW':
                if (config.render.simulator || config.render.locked) {
                    if (targeting.now.x <= maxCoords.x && targeting.now.x >= minCoords.x) {
                        targeting.now.x = normalized.x - tracker.dx;
                    }
                    if (targeting.now.y <= maxCoords.y && targeting.now.y >= minCoords.y) {
                        targeting.now.y = normalized.y - tracker.dy;
                    }
                } else {
                    if (targeting.now.x <= maxCoords.x && targeting.now.x >= minCoords.x) {
                        targeting.now.x = normalized.x;
                    }
                    if (targeting.now.y <= maxCoords.y && targeting.now.y >= minCoords.y) {
                        targeting.now.y = normalized.y;
                    }
                }

                // fix min/max
                if (targeting.now.x > maxCoords.x) {
                    targeting.now.x = maxCoords.x
                } else if (targeting.now.x < minCoords.x) {
                    targeting.now.x = minCoords.x
                }

                if (targeting.now.y > maxCoords.y) {
                    targeting.now.y = maxCoords.y
                } else if (targeting.now.y < minCoords.y) {
                    targeting.now.y = minCoords.y
                }
                targeting.setMovement();
                break;
            case 'TARGET':
                if (targeting.target == null) {
                    targeting.target = {
                        x: 0.5,
                        y: 0.5
                    };
                }
                if (config.render.simulator || config.render.locked) {
                    if (targeting.target.x <= maxCoords.x && targeting.target.x >= minCoords.x) {
                        targeting.target.x = normalized.x - tracker.dx;
                    }

                    if (targeting.target.y <= maxCoords.y && targeting.target.y >= minCoords.y) {
                        targeting.target.y = normalized.y - tracker.dy;
                    }
                } else {
                    if (targeting.target.x <= maxCoords.x && targeting.target.x >= minCoords.x) {
                        targeting.target.x = normalized.x;
                    }

                    if (targeting.target.y <= maxCoords.y && targeting.target.y >= minCoords.y) {
                        targeting.target.y = normalized.y;
                    }
                }

                // fix min/max
                if (targeting.target.x > maxCoords.x) {
                    targeting.target.x = maxCoords.x
                } else if (targeting.target.x < minCoords.x) {
                    targeting.target.x = minCoords.x
                }

                if (targeting.target.y > maxCoords.y) {
                    targeting.target.y = maxCoords.y
                } else if (targeting.target.y < minCoords.y) {
                    targeting.target.y = minCoords.y
                }
                targeting.setMovement();
                break;
        }
    },

    /*
        Reset key control
     */
    resetKeys: function () {
        manual.btn[manual.keyLEFT] = false;
        manual.btn[manual.keyRIGHT] = false;
        manual.btn[manual.keyUP] = false;
        manual.btn[manual.keyDOWN] = false;
    },
}
    