// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const storage = {

    /*
        Store in storage
     */
    setLocalStorage: function (key, val) {
        if (typeof (localStorage) !== 'undefined') {
            localStorage.setItem(key, val);
        }
    },

    /*
        Get from storage
     */
    getLocalStorage: function (key) {
        if (typeof (localStorage) !== 'undefined') {
            return localStorage.getItem(key);
        }
    },

    /*
        Remove from storage
     */
    removeLocalStorage: function (key) {
        if (typeof (localStorage) !== 'undefined') {
            localStorage.removeItem(key);
        }
    },

    /*
        Check if n storage
     */
    isLocalStorage: function (key) {
        if (typeof (localStorage) !== 'undefined') {
            if (localStorage.getItem(key) !== null) return true;
        }
    },

    /*
        Save config
     */
    saveConfig: function () {
        const cfg = {};
        cfg['version'] = app.version;
        cfg['time'] = Date.now();
        cfg['data'] = {
            'init': config.init,
            'core': config.core,
            'target': config.target,
            'patrol': config.patrol,
            'action': config.action,
            'manual': config.manual,
            'render': config.render,
            'camera': config.camera,
            'servo': config.servo,
            'area': config.area,
            'panel': config.panel,
        }
        storage.setLocalStorage('config', JSON.stringify(cfg));
        alert('Config saved.');
    },

    /*
        Reset config
     */
    resetConfig: function () {
        if (storage.isLocalStorage('config')) {
            storage.removeLocalStorage('config');
            window.location.reload();
        }
    },

    /*
        Load config
     */
    loadConfig: function () {
        if (storage.isLocalStorage('config')) {
            const cfg = JSON.parse(storage.getLocalStorage('config'));

            if (typeof cfg['data']['init'] !== 'undefined') {
                config.init = cfg['data']['init'];
            }
            if (typeof cfg['data']['core'] !== 'undefined') {
                config.core = cfg['data']['core'];
            }
            if (typeof cfg['data']['target'] !== 'undefined') {
                config.target = cfg['data']['target'];
            }
            if (typeof cfg['data']['patrol'] !== 'undefined') {
                config.patrol = cfg['data']['patrol'];
            }
            if (typeof cfg['data']['action'] !== 'undefined') {
                config.action = cfg['data']['action'];
            }
            if (typeof cfg['data']['manual'] !== 'undefined') {
                config.manual = cfg['data']['manual'];
            }
            if (typeof cfg['data']['render'] !== 'undefined') {
                config.render = cfg['data']['render'];
            }
            if (typeof cfg['data']['camera'] !== 'undefined') {
                config.camera = cfg['data']['camera'];
            }
            if (typeof cfg['data']['servo'] !== 'undefined') {
                config.servo = cfg['data']['servo'];
            }
            if (typeof cfg['data']['area'] !== 'undefined') {
                config.area = cfg['data']['area'];
            }
            if (typeof cfg['data']['panel'] !== 'undefined') {
                config.panel = cfg['data']['panel'];
            }
        }

        if (config.init.modelName != '' && app.model != config.init.modelName) {
            app.model = config.init.modelName;
        }
    },
}