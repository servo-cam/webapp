// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const action = {
    active: false, // is active
    actionInterval: null, // loop interval
    targetInterval: null, // loop interval
    actionCounter: 0, // continuous counter
    targetCounter: 0, // target counter
    stopped: false,
    isManualToggle: false,
    isSingleAction: false,
    actions: [
        'A1',
        'A2',
        'A3',
        'B4',
        'B5',
        'B6'
    ],
    toggled: {
        'A1': false,
        'A2': false,
        'A3': false,
        'B4': false,
        'B5': false,
        'B6': false
    },

    begin: function (name) {
        action.toggled[name] = true;
    },

    end: function (name) {
        action.toggled[name] = false;
    },

    /*
        Handler running in loop
     */
    update: function () {
        if (action.actionCounter > config.action.timeout.action_length) {
            switch (config.action.auto_mode) {
                case 'SINGLE':
                    action.actionCounter = 0;
                    action.stopped = true; // tmp stop for single action
                    action.isSingleAction = false;
                    action.hide();
                    break;
                case 'CONTINUOUS':
                    action.actionCounter = 0;
                    action.begin(config.action.auto_name);
                    action.stopped = true; // tmp stop for single action         
                    action.hide();
                    break;
                case 'SERIES':
                    action.hide();
                    command.update(config.action.auto_name);
                    action.actionCounter = 0;
                    break;
            }

            if (config.action.auto_mode != 'TOGGLE') {
                return;
            }
        }

        action.targetCounter++;

        // next target
        if (action.targetCounter >= config.action.timeout.next_target) {
            action.targetCounter = 0;
            targets.next(); // go to next target if available
        }

        if (!action.stopped) {
            action.actionCounter++;
            action.show();
        }
    },

    /*
        Start action
     */
    start: function () {
        action.active = true; // activate
        action.stopped = false;

        switch (config.action.auto_mode) {
            case 'SINGLE':
                command.update(config.action.auto_name);
                action.actionCounter = config.action.timeout.action_length - 1;
                break;
            case 'CONTINUOUS':
                action.toggled[config.action.auto_name] = true;
                action.actionCounter = 0;
                command.update();
                break;
            case 'SERIES':
                command.update(config.action.auto_name);
                action.actionCounter = config.action.timeout.action_length - 1;
                break;
            case 'TOGGLE':
                action.toggled[config.action.auto_name] = true;
                action.actionCounter = 0;
                break;
        }

        action.targetCounter = 0;

        if (action.actionInterval == null) {
            action.actionInterval = setInterval(function () {
                action.actionCounter++;
            }, 10);
        }
        if (action.targetInterval == null) {
            action.targetInterval = setInterval(function () {
                action.targetCounter++;
            }, 10);
        }

        action.show(); // show status alert
    },

    /*
        Stop action
     */
    stop: function () {
        action.active = false; // deactivate
        action.actionCounter = 0; // reset counter
        action.targetCounter = 0; // reset counter
        action.stopped = false;
        action.isSingleAction = false;
        action.hide(); // hide status alert        
        command.update();
        action.clear();
    },

    /*
        Check if action is toggled
     */
    isToggled: function (name) {
        return name in action.toggled && action.toggled[name];
    },

    /*
        Toggle action
    */
    toggle: function (name) {
        if (action.isToggled(name)) {
            action.toggled[name] = false;
        } else {
            action.toggled[name] = true;
        }
    },

    /*
        Enable action
     */
    enable: function () {
        config.action.enabled = true;
    },

    /*
        Disable action
     */
    disable: function () {
        config.action.enabled = false;
        action.clear();
    },

    /*
        Check if action is active
     */
    isActive: function () {
        return action.active;
    },

    /*
        Check if action is enabled
     */
    isEnabled: function () {
        return config.action.enabled;
    },

    hasAction: function () {
        for (let idx in action.actions) {
            if (action.toggled[idx]) {
                return true;
            }
        }
        return false;
    },

    /*
        Show action alert
    */
    show: function (name = null) {
        ui.statusAlert('target-action');
    },

    /*
        Hide action alert
        */
    hide: function () {
        ui.statusAlert('target-action', false);
    },

    clear: function () {
        if (action.actionInterval != null) {
            clearInterval(action.actionInterval);
            action.actionInterval = null;
        }
        if (action.targetInterval != null) {
            clearInterval(action.targetInterval);
            action.targetInterval = null;
        }
        action.toggled = {
            'A1': false,
            'A2': false,
            'A3': false,
            'B4': false,
            'B5': false,
            'B6': false
        };
    },
}