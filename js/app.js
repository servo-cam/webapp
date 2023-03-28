// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const app = {
    version: '0.9.2',
    source: 'CAMERA', // CAMERA|VIDEO|STREAM|REMOTE
    sourceVideo: '',
    sourceStream: '',
    sourceRemote: '',
    model: 'MoveNetSinglePoseLightning',
    /*
        ^^^ available pre-defined models:
            
            - MoveNetSinglePoseLightning                
            - MoveNetSinglePoseThunder
            - MoveNetMultiPoseLightning
            - PoseNetMobileNetV1
            - PoseNetResNet50
            - BlazePoseLite
            - BlazePoseHeavy
            - BlazePoseFull
    */

    init: function () {

        try {
            // load config
            storage.loadConfig();
        } catch (err) {
            console.error(err);
        }

        // init app params
        app.prepare(app.model);

        // append model wrapper
        app.prepareModel();

        // set-up hooks
        tracker.on('statuschange', function (msg) {
            app.updateStatus(msg);
        });
        tracker.on('beforeupdate', function () {
            sorter.append();
            app.updateCounter();
        });
        tracker.on('afterupdate', function () {
            app.updateDebug();
            if (config.target.mode != 'OFF') {
                targeting.update();
            }
            command.update();

            $('#device_status').text(tracker.remoteStatus);
        });

        // run predictions
        tracker.run(app.source);

        // init manual controller
        manual.init();

        // mouse move event append
        document.getElementById('canvas').onmousemove = function (e) {
            tracker.mouseX = e.clientX;
            tracker.mouseY = e.clientY;
            debug.handlePointerCoords();
        }
        document.getElementById('canvas').onmousedown = function (e) {
            manual.onMouseClick(e);
        }
        window.onmouseup = function (e) {
            manual.onMouseRelease(e);
        }
    },

    /*
        Append model wrapper
     */
    prepareModel: function () {
        switch (app.model) {
            case 'OpenCVMotionDetector':
                tracker.setWrapper(OpenCVMotionDetector); // set model wrapper
                tracker.setModel('OpenCVMotionDetector'); // choose model
                break;
            case 'MobileNet':
                tracker.setWrapper(mobilenet); // set model wrapper
                tracker.setModel('mobilenet'); // choose model
                break;
            case 'MoveNetSinglePoseLightning':
            case 'MoveNetSinglePoseThunder':
            case 'MoveNetMultiPoseLightning':
                tracker.setWrapper(movenet); // set model wrapper
                tracker.setModel(app.model); // choose model
                break;
            default:
            // no model
        }
    },

    /*
        Init app params
     */
    prepare: function (model = '') {
        // get selected model name from URL query string
        const params = new URLSearchParams(window.location.search);

        if (params.has('model')) {
            if (params.get('model') != '') {
                app.model = params.get('model');
            }
        }

        // get selected source from URL query string
        if (params.has('source')) {
            app.source = params.get('source');
        }

        // get defined video/stream URL from URL query string
        if (params.has('url')) {
            app.sourceVideo = params.get('url');
            if (app.source == 'VIDEO') {
                config.init.video = app.sourceVideo;
            } else if (app.source == 'STREAM') {
                app.sourceStream = params.get('url');
                config.init.stream = app.sourceVideo;
            } else if (app.source == 'REMOTE') {
                app.sourceRemote = params.get('url');
                config.init.remote = app.sourceRemote;
            }
        }

        $(document).ready(function () {
            try {
                app.initConfig();
            } catch (err) {
                console.error(err);
            }

            app.setupUI();
            shortcuts.assign();
        });
    },

    /*
        Setup UI and events
     */
    setupUI: function () {

        // APPLY EVENTS

        $('body').on('click', '#canvas', function (e) {
            e.preventDefault();
            ui.clickCoords = {
                x: tracker.mouseX,
                y: tracker.mouseY
            };
        });

        // append event listeners to source select buttons
        $('body').on('click', '.source-select', function (e) {
            e.preventDefault();
            let href = '?model=' + app.model + '&source=' + $(this).attr('data-source');
            if (app.source == $(this).attr('data-source')) {
                href = href + '&url=' + app.sourceVideo;
            }
            window.location.href = href;
        });

        // select model
        $('body').on('change', '#model_select', function (e) {
            e.preventDefault();
            const href = '?model=' + $(this).val() + '&source=' + app.source + '&url=' + app.sourceVideo;
            window.location.href = href;
        });

        // append event listener to load video URL button
        $('body').on('change', 'button[data-trigger="btn-ai-toggle"]', function (e) {
            e.preventDefault();
            app.sourceVideo = $('#video_src').val();
            const href = '?model=' + window.model + '&source=' + app.source + '&url=' + app.sourceVideo;
            window.location.href = href;
        });

        // camera device select
        $('body').on('change', '#camera_select', function (e) {
            e.preventDefault();
            const val = $(this).val();
            if (val == '' || val == null) {
                return;
            }
            camera.selectDevice(val);
        });

        // ------------------------
        // btn: AI TRACKING ON/OFF
        $('body').on('click', 'button[data-trigger="btn-ai-toggle"]', function (e) {
            e.preventDefault();
            app.toggleAI();
        });

        // btn: DEBUG ON/OFF
        $('body').on('click', 'button[data-trigger="btn-debug-toggle"]', function (e) {
            e.preventDefault();
            app.toggleDebug();
        });

        // btn: 3D VIEW ON/OFF
        $('body').on('click', 'button[data-trigger="btn-3d-toggle"]', function (e) {
            e.preventDefault();
            app.toggle3D();
        });

        // btn: VIDEO ON/OFF
        $('body').on('click', 'button[data-trigger="btn-video-toggle"]', function (e) {
            e.preventDefault();
            app.toggleVideo();
        });

        // btn: SHOW/HIDE CONTROLS
        $('body').on('click', 'button[data-trigger="btn-controls-toggle"]', function (e) {
            e.preventDefault();
            app.toggleControls();
        });

        // btn: USB CONNECT
        $('body').on('click', 'button[data-trigger="btn-usb-connect"]', function (e) {
            e.preventDefault();
            app.toggleSerial();
        });

        // btn: PLAYBACK
        $('body').on('click', 'button[data-trigger="btn-play-control"]', function (e) {
            e.preventDefault();
            video.playPauseClick();
        });

        // btn: VIDEO CONTROLS
        $('body').on('click', 'button[data-trigger="btn-play-controls"]', function (e) {
            e.preventDefault();
            app.togglePlayControls();
        });

        // btn: SHOW BOUNDS
        $('body').on('click', 'button[data-trigger="btn-show-bounds"]', function (e) {
            e.preventDefault();
            app.toggleBounds();
        });

        // btn: CONSOLE TOGGLE
        $('body').on('click', 'button[data-trigger="btn-console-toggle"]', function (e) {
            e.preventDefault();
            app.toggleConsole();
        });

        // btn: CONSOLE IDLE
        $('body').on('click', 'button[data-trigger="btn-console-pause"]', function (e) {
            e.preventDefault();
            app.toggleConsolePause();
        });

        // btn: CONSOLE CLEAR
        $('body').on('click', 'button[data-trigger="btn-console-clear"]', function (e) {
            e.preventDefault();
            app.toggleConsoleClear();
        });

        // btn: CONSOLE SEND
        $('body').on('click', 'button[data-trigger="btn-console-send"]', function (e) {
            e.preventDefault();
            app.toggleConsoleSend();
        });

        // btn: AREA TYPE
        $('body').on('click', 'button[data-trigger="btn-area-select"]', function (e) {
            e.preventDefault();
            app.toggleAreaSelect(null);
        });

        // btn: CONTROL MODE SELECT
        $('body').on('click', 'button[data-trigger="btn-control-mode-select"]', function (e) {
            e.preventDefault();
            app.toggleControlMode($(this).attr('data-id'));
        });

        // btn: MANUAL CONTROL MODE SELECT
        $('body').on('click', 'button[data-trigger="btn-control-manual-mode"]', function (e) {
            e.preventDefault();
            app.toggleControlManualMode($(this).attr('data-id'));
        });

        // btn: TARGET POINT SELECT
        $('body').on('click', 'button[data-trigger="btn-target-point-select"]', function (e) {
            e.preventDefault();
            app.toggleTargetPoint($(this).attr('data-id'));
        });

        // btn: TOGGLE LOCK SINGLE ONLY
        $('body').on('click', 'button[data-trigger="btn-target-single-only"]', function (e) {
            e.preventDefault();
            app.toggleSingleTarget();
        });

        // btn: TOGGLE ATTACK MODE
        $('body').on('click', 'button[data-trigger="btn-attack-toggle"]', function (e) {
            e.preventDefault();
            app.toggleActionMode();
        });

        // btn: TOGGLE SIMULATOR
        $('body').on('click', 'button[data-trigger="btn-servo-simulator"]', function (e) {
            e.preventDefault();
            app.toggleSimulator();
        });

        // btn: TOGGLE VIEW - original/resized
        $('body').on('click', 'button[data-trigger="btn-view-resize"]', function (e) {
            e.preventDefault();
            app.toggleView($(this).attr('data-id'));
        });

        // btn: SERVO ON/OFF
        $('body').on('click', 'button[data-trigger="btn-servo"]', function (e) {
            e.preventDefault();
            app.toggleServo();
        });

        // btn: SERVO HORIZONTAL
        $('body').on('click', 'button[data-trigger="btn-servo-horizontal"]', function (e) {
            e.preventDefault();
            app.toggleServoHorizontal();
        });

        // btn: SERVO VERTICAL
        $('body').on('click', 'button[data-trigger="btn-servo-vertical"]', function (e) {
            e.preventDefault();
            app.toggleServoVertical();
        });

        // btn: SWITCH TARGET
        $('body').on('click', 'button[data-trigger="btn-switch-target"]', function (e) {
            e.preventDefault();
            app.toggleSwitchtarget($(this).attr('data-id'));
        });

        // btn: TARGET LOCK
        $('body').on('click', 'button[data-trigger="btn-target-lock"]', function (e) {
            e.preventDefault();
            app.toggleTargetLock();
        });

        // btn: CENTER LOCK
        $('body').on('click', 'button[data-trigger="btn-center-lock"]', function (e) {
            e.preventDefault();
            app.toggleCenterLock();
        });

        // btn: CENTER
        $('body').on('click', 'button[data-trigger="btn-center"]', function (e) {
            e.preventDefault();
            app.toggleCenter();
        });

        // btn: ACTION
        $('body').on('click', 'button[data-trigger="btn-action"]', function (e) {
            e.preventDefault();
            const name = $(this).attr('data-id');
            if (action.isManualToggle) {
                if (action.isToggled(name)) {
                    action.end(name);
                    ui.disableBtn('btn-action', name);
                    app.toggleAction(null, false);
                } else {
                    action.begin(name);
                    ui.enableBtn('btn-action', name, 'danger');
                    app.toggleAction(name, false);
                }
            } else {
                app.toggleAction(name, true);
            }
        });

        // btn: ACTION
        $('body').on('click', 'button[data-trigger="btn-action-switch"]', function (e) {
            e.preventDefault();
            app.toggleActionSwitch();
        });

        // select: ACTION AUTO NAME, MODE
        $('body').on('change', 'select[data-trigger="auto_action_name"]', function (e) {
            e.preventDefault();
            const name = $(this).val();
            app.toggleActionAutoName(name, false);
        });

        $('body').on('change', 'select[data-trigger="auto_action_mode"]', function (e) {
            e.preventDefault();
            const mode = $(this).val();
            app.toggleActionAutoMode(mode, false);
        });

        // -------------
        // area config inputs
        $('body').on('change', 'input[data-role="area_config_value"]', function (e) {
            e.preventDefault();
            const parent = $(this).attr('data-parent');
            const id = $(this).attr('data-id');
            const val = $(this).val().trim();
            app.updateAreaConfig(parent, id, val);
        });
        $('body').on('keyup', 'input[data-role="area_config_value"]', function (e) {
            e.preventDefault();
            const parent = $(this).attr('data-parent');
            const id = $(this).attr('data-id');
            const val = $(this).val().trim();
            app.updateAreaConfig(parent, id, val);
        });
        $('body').on('change', 'select[data-role="area_config_value"]', function (e) {
            e.preventDefault();
            const parent = $(this).attr('data-parent');
            const val = $(this).val();
            app.updateAreaConfig(parent, 'mode', val);
        });

        // btn: CONFIG LOAD
        $('body').on('click', 'button[data-trigger="btn-config-load"]', function (e) {
            e.preventDefault();
            storage.loadConfig();
        });

        // btn: CONFIG SAVE
        $('body').on('click', 'button[data-trigger="btn-config-save"]', function (e) {
            e.preventDefault();
            storage.saveConfig();
        });

        // btn: CONFIG RESET
        $('body').on('click', 'button[data-trigger="btn-config-reset"]', function (e) {
            e.preventDefault();
            storage.resetConfig();
        });
    },

    /*
        Handle AI enable toggle button
     */
    toggleAI: function (force = false) {
        if (config.core.enableAI && !force) {
            config.core.enableAI = false;
            console.log('AI ON');
        } else {
            config.core.enableAI = true;
            console.log('AI OFF');
        }
    },

    /*
        Handle video toggle button
     */
    toggleVideo: function (force = false) {
        if (config.core.enableVideo && !force) {
            config.core.enableVideo = false;
            console.log('Video OFF');
        } else {
            console.log('Video ON');
            config.core.enableVideo = true;
        }
    },

    /*
        Handle 3D toggle button
     */
    toggle3D: function () {
        if (tracker.detectorModel != poseDetection.SupportedModels.BlazePose) {
            alert('3D is available for BlazePose model only!');
            return;
        }

        if (tracker.scatterGL == null) {
            console.error('ScatterGL is not initialized');
            return;
        }

        if (config.core.enable3D) {
            config.core.enable3D = false;
            config.dom.scatter3d.style.display = "none";
            console.log('3D OFF');
        } else {
            console.log('3D ON');
            config.core.enable3D = true;
            config.dom.scatter3d.style.display = "block";
            tracker.scatterGL.resize();
        }
    },

    /*
        Handle Debug toggle button
     */
    toggleDebug: function (force = false) {
        if (config.core.enableDebug && !force) {
            config.core.enableDebug = false;
            $('#debug_main').html('');
            $('#debug_servo').html('');
            $('#debug_custom').html('');
            $('#debug_main').hide();
            $('#debug_servo').hide();
            $('#debug_custom').hide();
            debug.disablePointerCoords();
            console.log('Debug OFF');
        } else {
            config.core.enableDebug = true;
            $('#debug_main').show();
            $('#debug_servo').show();
            $('#debug_custom').show();
            debug.enablePointerCoords();
            console.log('Debug ON');
        }
    },

    /*
        Handle Console toggle button
     */
    toggleConsole: function (force = false) {
        if (config.core.enableConsole && !force) {
            config.core.enableConsole = false;
            $('#debug_console').hide();
            console.log('Console OFF');
        } else {
            config.core.enableConsole = true;
            $('#debug_console').show();
            $('#console_input').focus();
            console.log('Console ON');
        }
    },

    /*
        Handle SHOW/HIDE controls toggle button
     */
    toggleControls: function (force = false) {
        const panel = $('.control-panel');
        if (panel.css('display') == 'none' && !force) {
            panel.show();
        } else {
            panel.hide();
        }
    },

    /*
        Handle playback controls toggle button
     */
    togglePlayControls: function (force = false) {
        if ($("#video").hasClass('video-control') && !force) {
            $("#video").removeClass('video-control');
            ui.disableBtn('btn-play-controls');
        } else {
            $("#video").addClass('video-control');
            ui.enableBtn('btn-play-controls');
        }
    },

    /*
        Handle bounds toggle button
     */
    toggleBounds: function (force = false) {
        if (config.render.bounds && !force) {
            config.render.bounds = false;
            ui.disableBtn('btn-show-bounds');
        } else {
            config.render.bounds = true;
            ui.enableBtn('btn-show-bounds');
        }
    },

    /*
        Handle console pause button
     */
    toggleConsolePause: function () {
        if (dbg_console.isPaused()) {
            dbg_console.resume();
            ui.disableBtn('btn-console-pause');
        } else {
            dbg_console.pause();
            ui.enableBtn('btn-console-pause');
        }
    },

    /*
        Handle console clear button
     */
    toggleConsoleClear: function () {
        dbg_console.clear();
    },

    /*
        Handle console send button
     */
    toggleConsoleSend: function () {
        const input = $('#console_input');
        const cmd = input.val().trim();
        if (cmd != '') {
            dbg_console.onSend(cmd);
        }
        input.val('');
        input.focus();
    },

    /*
        Handle console toggle button
     */
    toggleControlMode: function (mode) {
        ui.disableBtn('btn-control-mode-select');
        ui.enableBtn('btn-control-mode-select', mode);
        config.target.mode = mode;
        if (mode != 'PATROL') {
            patrol.stop();
            config.patrol.enabled = false;
        } else {
            config.patrol.enabled = true;
        }
        manual.toggleManualControls();
    },

    /*
        Handle control manual mode toggle button
     */
    toggleControlManualMode: function (mode) {
        ui.disableBtn('btn-control-manual-mode');
        ui.enableBtn('btn-control-manual-mode', mode);
        config.manual.mode = mode;
    },

    /*
        Handle target point select toggle button
     */
    toggleTargetPoint: function (point) {
        ui.disableBtn('btn-target-point-select');
        ui.enableBtn('btn-target-point-select', point);
        config.target.point = point;
    },

    /*
        Handle single target toggle button
     */
    toggleSingleTarget: function (force = false) {
        if (config.target.single && !force) {
            config.target.single = false;
            ui.disableBtn('btn-target-single-only');
        } else {
            config.target.single = true;
            ui.enableBtn('btn-target-single-only', null, 'success');
        }
    },

    /*
        Handle auto action name select
     */
    toggleActionAutoName: function (name, update = true) {
        config.action.auto_name = name;
        if (update) {
            $('select[data-trigger="auto_action_name"]').val(name);
        }
    },

    /*
        Handle auto action trigger mode select
     */
    toggleActionAutoMode: function (mode, update = true) {
        config.action.auto_mode = mode;
        if (update) {
            $('select[data-trigger="auto_action_mode"]').val(mode);
        }
    },

    /*
        Handle action mode toggle button
     */
    toggleActionMode: function (force = false) {
        if (config.action.enabled && !force) {
            if (action.isActive()) {
                action.stop();
            }
            config.action.enabled = false;
            ui.disableBtn('btn-attack-toggle');
        } else {
            config.action.enabled = true;
            ui.enableBtn('btn-attack-toggle', null, 'danger');

            if (config.target.mode != 'FOLLOW' && config.target.mode != 'PATROL') {
                config.target.mode = 'FOLLOW';
                ui.disableBtn('btn-control-mode-select');
                ui.enableBtn('btn-control-mode-select', 'FOLLOW');
            }
            if (!targets.isLocked()) {
                targets.lock();
            }
        }
    },

    /*
        Handle serial connect toggle button
     */
    toggleSerial: async function () {
        await serial.connect();
    },

    /*
        Handle simulator toggle button
     */
    toggleSimulator: function (force = false) {
        if (config.render.simulator && !force) {
            config.render.simulator = false;
            ui.disableBtn('btn-servo-simulator');
            render.clearSimulator();
        } else {
            if (servo.isEnabled()) {
                app.toggleServo();
            }
            if (config.render.locked) {
                app.toggleCenterLock();
            }
            config.render.simulator = true;
            ui.enableBtn('btn-servo-simulator');
        }
    },

    /*
        Handle view toggle button
     */
    toggleView: function (mode) {
        ui.disableBtn('btn-view-resize');
        ui.enableBtn('btn-view-resize', mode);
        switch (mode) {
            case 'RESIZED':
                config.render.resize = true;
                config.render.view = true;
                $('#canvas').removeClass('canvas-original');
                $('#canvas').addClass('canvas-resize');
                break;
            case 'ORIGINAL':
                config.render.resize = false;
                config.render.view = true;
                $('#canvas').removeClass('canvas-resize');
                $('#canvas').addClass('canvas-original');
                break;
            case 'DISABLED':
                config.render.resize = true;
                config.render.view = false;
                break;
        }
    },

    /*
        Handle area select toggle button
     */
    toggleAreaSelect: function (force = null) {
        if (force == null) {
            if (ui.panelEnabled('area')) {
                ui.hidePanel('area');
                ui.disableBtn('btn-area-select');
            } else {
                ui.showPanel('area');
                ui.enableBtn('btn-area-select');
            }
        } else {
            if (force) {
                ui.showPanel('area');
                ui.enableBtn('btn-area-select');
            }
        }

        const parents = ['TARGET', 'PATROL', 'ACTION'];
        const ids = ['xMin', 'yMin', 'width', 'height'];
        let mode;

        for (let parent of parents) {
            for (let id of ids) {
                $('input[data-role="area_config_value"][data-parent="' + parent + '"][data-id="' + id + '"]').val(config.area.box[parent.toLowerCase()][id]);
            }
            if (!config.area.enabled[parent.toLowerCase()]) {
                mode = 'OFF';
            } else {
                if (config.area.world[parent.toLowerCase()]) {
                    mode = 'WORLD';
                } else {
                    mode = 'CAM';
                }
            }
            $('select[data-role="area_config_value"][data-parent="' + parent + '"][data-id="mode"]').val(mode);
        }
    },

    /*
        Handle area configs
     */
    updateAreaConfig: function (parent, id, val) {
        const p = parent.toLowerCase();
        switch (id) {
            case 'xMin':
                val = val.trim();
                if (isNaN(val) || val == '' || val == null) {
                    return;
                }
                config.area.box[p].xMin = parseFloat(val);
                break;
            case 'yMin':
                val = val.trim();
                if (isNaN(val) || val == '' || val == null) {
                    return;
                }
                config.area.box[p].yMin = parseFloat(val);
                break;
            case 'width':
                val = val.trim();
                if (isNaN(val) || val == '' || val == null) {
                    return;
                }
                config.area.box[p].width = parseFloat(val);
                break;
            case 'height':
                val = val.trim();
                if (isNaN(val) || val == '' || val == null) {
                    return;
                }
                config.area.box[p].height = parseFloat(val);
                break;
            case 'mode':
                switch (val) {
                    case 'OFF':
                        config.area.enabled[p] = false;
                        break;
                    case 'CAM':
                        config.area.enabled[p] = true;
                        config.area.world[p] = false;
                        break;
                    case 'WORLD':
                        config.area.enabled[p] = true;
                        config.area.world[p] = true;
                        break;
                }
                break;
        }
    },

    /*
        Handle servo enable/disable toggle button
     */
    toggleServo: async function (force = false) {
        if (servo.isEnabled() && !force) {
            servo.disable();
        } else {
            // reset
            targeting.center();

            if (config.render.simulator) {
                app.toggleSimulator();
            }
            if (!config.render.locked) {
                app.toggleCenterLock();
            }
            if (!serial.enabled) {
                await serial.connect(true);
            }
            servo.enable();
        }
    },

    /*
        Handle target lock toggle button
     */
    toggleTargetLock: function (force = false) {
        if (targets.isLocked() && !force) {
            targets.unlock();
        } else {
            targets.lock();
        }
    },

    /*
        Handle manual action trigger
     */
    toggleAction: function (name, autohide = true) {
        action.show(name);
        command.update(name);
        if (autohide) {
            setTimeout(function () {
                action.hide();
            }, 10);
        } else {
            if (name == null) {
                action.hide();
            }
        }
    },

    /*
        Handle manual action enable trigger
     */
    toggleActionSwitch: function () {
        if (!action.isManualToggle) {
            ui.enableBtn('btn-action-switch', null, 'danger');
            action.isManualToggle = true;
            action.show();
        } else {
            action.isManualToggle = false;
            ui.disableBtn('btn-action-switch');
            action.hide();
        }
    },

    /*
        Handle center lock toggle button
     */
    toggleCenterLock: function (force = false) {
        if (config.render.locked && !force) {
            config.render.locked = false;
            ui.disableBtn('btn-center-lock');
        } else {
            if (config.render.simulator) {
                app.toggleSimulator();
            }
            if (servo.isEnabled()) {
                app.toggleServo();
            }
            targeting.center();
            config.render.locked = true;
            ui.enableBtn('btn-center-lock');
        }
    },

    /*
        Handle center screen toggle button
     */
    toggleCenter: function () {
        targeting.center();
    },

    /*
        Handle horizontal servo toggle button
     */
    toggleServoHorizontal: function (force = false) {
        if (config.servo.horizontal && !force) {
            config.servo.horizontal = false;
            ui.disableBtn('btn-servo-horizontal');
        } else {
            config.servo.horizontal = true;
            ui.enableBtn('btn-servo-horizontal');
        }
    },

    /*
        Handle vertical servo toggle button
     */
    toggleServoVertical: function (force = false) {
        if (config.servo.vertical && !force) {
            config.servo.vertical = false;
            ui.disableBtn('btn-servo-vertical');
        } else {
            config.servo.vertical = true;
            ui.enableBtn('btn-servo-vertical');
        }
    },

    /*
        Handle target switch toggle button
     */
    toggleSwitchtarget: function (mode) {
        if (mode == 'PREV') {
            targets.prev();
        } else if (mode == 'NEXT') {
            targets.next();
        }
    },

    /*
        Update status listener
     */
    updateStatus: function (msg) {
        document.getElementById('status').innerHTML = msg;
    },

    /*
        Update counter listener
     */
    updateCounter: function () {
        let a = tracker.objects.length;
        let i = tracker.countDetected();
        $('#info_target_counter').html(i + '/' + a);
    },

    /*
        Update debugger data
     */
    updateDebug: function () {
        dbg_console.listen();

        if (!config.core.enableDebug) {
            return;
        }
        debug.showDebug();
        debug.showServoDebug();
        debug.showCustomDebug();
    },

    /*
        Initialize config values
     */
    initConfig: function () {
        // update active video source
        $('#model_select').val(app.model);
        $('#source-' + app.source.toLowerCase()).addClass('active');

        if (config.patrol.enabled) {
            config.target.mode = 'PATROL';
        }

        app.toggleTargetPoint(config.target.point);
        app.toggleControlMode(config.target.mode);
        app.toggleControlManualMode(config.manual.mode);
        app.toggleActionAutoName(config.action.auto_name);
        app.toggleActionAutoMode(config.action.auto_mode);

        if (config.render.locked) {
            app.toggleCenterLock(true);
        }

        if (config.render.bounds) {
            app.toggleBounds(true);
        }

        if (config.action.enabled) {
            app.toggleActionMode(true);
        }

        if (config.render.simulator) {
            app.toggleSimulator(true);
        }

        if (config.target.locked) {
            app.toggleTargetLock(true);
        }

        if (config.target.single) {
            app.toggleSingleTarget(true);
        }

        if (config.servo.horizontal) {
            app.toggleServoHorizontal(true);
        }

        if (config.servo.vertical) {
            app.toggleServoVertical(true);
        }

        if (config.camera.deviceId != null) {
            camera.selectDevice(config.camera.deviceId);
        }

        if (config.core.enableDebug) {
            app.toggleDebug(true);
        }

        if (config.core.enableConsole) {
            app.toggleConsole(true);
        }

        if (config.panel.area) {
            app.toggleAreaSelect(config.panel.area);
        }

        if (config.render.view) {
            if (config.render.resize) {
                ui.enableBtn('btn-view-resize', 'RESIZED');
            } else {
                ui.enableBtn('btn-view-resize', 'ORIGINAL');
            }
        } else {
            ui.enableBtn('btn-view-resize', 'DISABLED');
        }

        // update elements by source
        switch (app.source) {
            // CAMERA
            case 'CAMERA':
                $('#video_area').hide();
                $('#canvas').addClass('camera');
                $('#camera_select').addClass('d-inline');
                break;

            // VIDEO
            case 'VIDEO':
                $('#video_area').show();
                if (app.sourceVideo == null || app.sourceVideo.trim() == '') {
                    app.sourceVideo = config.init.video;
                }
                $('#video source').attr('src', app.sourceVideo);
                $('#video').attr('src', app.sourceVideo);
                $('#video_src').val(app.sourceVideo);
                $('#video_src_prefix').html('MP4,AVI,MKV,WEBM')
                $('#canvas').addClass('clickable');
                $('#panel_video').show();

                // change video source URL input
                $('body').on('click', 'button[data-trigger="btn-load-video"]', function (e) {
                    e.preventDefault();
                    const src = $('#video_src').val();
                    const href = '?model=' + $(this).val() + '&source=' + app.source + '&url=' + src;
                    window.location.href = href;
                    video.load(src);
                });
                break;

            // STREAM
            case 'STREAM':
                $('#video_area').show();
                if (app.sourceVideo == null || app.sourceVideo.trim() == '') {
                    app.sourceVideo = config.init.stream;
                }

                $('#video source').attr('src', app.sourceVideo);
                $('#video_src').val(app.sourceVideo);
                $('#video_src_prefix').html('IPTV STREAM,m3u8');
                $('#canvas').addClass('clickable');
                $('#panel_video').show();

                // change video source URL input
                $('body').on('click', 'button[data-trigger="btn-load-video"]', function (e) {
                    const src = $('#video_src').val();
                    stream.load(src);
                });
                break;

            // REMOTE
            case 'REMOTE':
                $('#video_area').show();
                if (app.sourceRemote == null || app.sourceRemote.trim() == '') {
                    app.sourceRemote = config.init.remote;
                }

                // change video source URL input
                $('body').on('click', 'button[data-trigger="btn-load-video"]', function (e) {
                    const src = $('#video_src').val();
                    remote.load(src);
                });

                if (app.sourceRemote == null || app.sourceRemote == '') {
                    alert('No address specified. Not connected!')
                    return;
                }

                $('#remote').attr('src', app.sourceRemote + remote.appendToken());
                $('#video source').attr('src', app.sourceRemote + remote.appendToken());
                $('#video_src').val(app.sourceRemote);
                $('#video_src_prefix').html('REMOTE');
                $('#canvas').addClass('clickable');
                $('#panel_video').show();
                break;
        }
        ;
    },
}
