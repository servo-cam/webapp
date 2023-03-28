// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const shortcuts = {

    /*
        Handle keyboard shortcuts
     */
    assign: function () {

        document.addEventListener("keyup", (e) => {
            if ($('#video_src').is(':focus')) {
                return;
            }

            if (config.target.mode == 'MANUAL' || config.target.mode == 'MOUSE') {
                if (e.key == " " ||
                    e.code == "Space" ||
                    e.keyCode == 32
                ) {
                    app.toggleAction();
                }
            }

            switch (e.key) {

                // main
                case 'd':
                    app.toggleDebug();
                    break;
                case 'e':
                    app.toggleConsole();
                    break;

                // target switch
                case 'q':
                    app.toggleSwitchtarget('PREV');
                    break;
                case 'w':
                    app.toggleSwitchtarget('NEXT');
                    break;

                // target point
                case '1':
                    app.toggleTargetPoint('AUTO');
                    break;
                case '2':
                    app.toggleTargetPoint('HEAD');
                    break;
                case '3':
                    app.toggleTargetPoint('NECK');
                    break;
                case '4':
                    app.toggleTargetPoint('BODY');
                    break;
                case '5':
                    app.toggleTargetPoint('LEGS');
                    break;

                // servo
                case 'x':
                    app.toggleServoHorizontal();
                    break;
                case 'y':
                    app.toggleServoVertical();
                    break;

                // other
                case 'b':
                    app.toggleBounds();
                    break;
                case 'c':
                    app.toggleCenter();
                    break;
                case 'v':
                    app.toggleCenterLock();
                    break;
                case 'i':
                    app.toggleSimulator();
                    break;
                case 'u':
                    app.toggleSerial();
                    break;
                case 's':
                    app.toggleServo();
                    break;


                // action
                case 'a':
                    app.toggleActionMode();
                    break;
                case 'l':
                    app.toggleTargetLock();
                    break;
                case 'z':
                    app.toggleSingleTarget();
                    break;
                case 'o':
                    if (config.target.mode == 'MANUAL' || config.target.mode == 'MOUSE') {
                        app.toggleActionSwitch();
                    }
                    break;

                // control mode
                case 'p':
                    app.toggleControlMode('IDLE');
                    break;
                case 'f':
                    app.toggleControlMode('FOLLOW');
                    break;
                case 'r':
                    app.toggleControlMode('PATROL');
                    break;
                case 'n':
                    app.toggleControlMode('MANUAL');
                    break;
                case 'm':
                    app.toggleControlMode('MOUSE');
                    break;
            }
        });

    },
}