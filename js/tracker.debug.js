// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const debug = {

    pointerCoords: false,
    custom: [],
    console: [],
    paused: false,
    showConsole: false,
    prevCode: null,

    /*
        Servo debug
     */
    showServoDebug: function () {
        let items = [];

        // target point
        items.push(debug.item(debug.tag(config.target.point, 'orange'), null, false));

        // servo #1
        items.push(debug.nl());
        items.push(debug.item(debug.title('SERVO X')));
        items.push(debug.item(debug.val('LEFT: ')));
        if (targeting.move.left) {
            items.push(debug.item(debug.val('+'), null, false));
        }
        items.push(debug.item(debug.val('RIGHT: ')));
        if (targeting.move.right) {
            items.push(debug.item(debug.val('+'), null, false));
        }

        // servo #2
        items.push(debug.nl());
        items.push(debug.item(debug.title('SERVO Y')));
        items.push(debug.item(debug.val('UP: ')));
        if (targeting.move.up) {
            items.push(debug.item(debug.val('+'), null, false));
        }
        items.push(debug.item(debug.val('DOWN: ')));
        if (targeting.move.down) {
            items.push(debug.item(debug.val('+'), null, false));
        }

        // targeting coords
        items.push(debug.nl());
        items.push(debug.item(debug.title('target'), debug.vector(targeting.target)));
        items.push(debug.item(debug.title('beforeTarget'), debug.vector(targeting.beforeTarget)));
        items.push(debug.item(debug.title('now'), debug.vector(targeting.now)));
        items.push(debug.item(debug.title('cam'), debug.vector(targeting.cam)));

        // dist, perc
        items.push(debug.nl());
        items.push(debug.item(debug.title('distCN'), debug.vector(targeting.distCN)));
        items.push(debug.item(debug.title('percCN %'), debug.vector(targeting.percCN)));
        items.push(debug.item(debug.title('distNT'), debug.vector(targeting.distNT)));
        items.push(debug.item(debug.title('percNT %'), debug.vector(targeting.percNT)));

        // params
        items.push(debug.item(debug.title('speed'), debug.vector(targeting.speed)));
        items.push(debug.item(debug.title('threshold'), debug.vector(targeting.th)));
        items.push(debug.item(debug.title('power'), debug.vector(targeting.power)));
        items.push(debug.item(debug.title('cam'), debug.vector(targeting.cam)));

        // dx, dy
        items.push(debug.nl());
        items.push(debug.item(debug.title('dx'), debug.val(tracker.dx.toFixed(2) + ' / max ' + (config.servo.maxAngle.x / config.camera.fov.x).toFixed(2))));
        items.push(debug.item(debug.title('dy'), debug.val(tracker.dy.toFixed(2) + ' / max ' + (config.servo.maxAngle.y / config.camera.fov.y).toFixed(2))));

        items.push(debug.nl());

        // angle x
        items.push(debug.item(debug.title('angle.x', 'white'), debug.val(command.angle.x + '^ / ' + command.prev.x, 'white')));
        if (command.sendCmd.x) {
            items.push(debug.item(debug.tag('SEND', 'yellow'), null, false));
        }
        // angle y
        items.push(debug.item(debug.title('angle.y', 'white'), debug.val(command.angle.y + '^ / ' + command.prev.y, 'white')));
        if (command.sendCmd.y) {
            items.push(debug.item(debug.tag('SEND', 'yellow'), null, false));
        }

        // score
        items.push(debug.nl());
        items.push(debug.item(debug.title('SCORE'), debug.val(keypoints.score.toFixed(2))));

        // prev target
        items.push(debug.nl());
        items.push(debug.item(debug.title('PREV TARGET')));
        for (i in targeting.prevTarget) {
            items.push(debug.item(debug.title(i), debug.vector(targeting.prevTarget[i])));
        }

        // prev now
        items.push(debug.nl());
        items.push(debug.item(debug.title('PREV NOW')));
        for (i in targeting.prevNow) {
            items.push(debug.item(debug.title(i), debug.vector(targeting.prevNow[i])));
        }

        // prev cam
        items.push(debug.nl());
        items.push(debug.item(debug.title('PREV CAM')));
        for (i in targeting.prevCam) {
            items.push(debug.item(debug.title(i), debug.vector(targeting.prevCam[i])));
        }

        // fov, angle
        items.push(debug.nl());
        items.push(debug.item(debug.title('FOV'), debug.vector(config.camera.fov)));
        items.push(debug.item(debug.title('ANGLE'), debug.vector(config.servo.maxAngle)));

        // serial extra cmd
        items.push(debug.nl());
        items.push(debug.item(debug.title('CODE'), debug.val(serial.code)));

        if (debug.prevCode != serial.code) {
            items.push(debug.item(debug.tag('SEND', 'yellow'), null, false));
            debug.prevCode = serial.code;
        }

        // last serial cmd
        items.push(debug.item(debug.title('CMD'), debug.val(command.current)));
        if (!serial.enabled) {
            items.push(debug.item(debug.tag('NO SERIAL', 'orange'), null, false));
        }

        $('#debug_servo').html(items.join(''));
    },

    /*
        Main debug
     */
    showDebug: function () {
        let items = [];

        const size = upscaler.getVideoSize();
        const canvas = upscaler.getCanvas();
        const canvasSize = upscaler.getCanvasSize();
        const canvasSizeCurrent = upscaler.getCurrentCanvasSize();
        const view = upscaler.fit();

        items.push(debug.item(debug.tag(config.target.mode, 'orange'), null, false));

        // patrol
        if (patrol.isActive()) {
            items.push(debug.item(debug.tag('PATROL', 'lime'), null, false));
        }

        // dimensions
        items.push(debug.nl());
        items.push(debug.item(debug.title('CANVAS (CURRENT)'), debug.dim(canvasSizeCurrent)));
        items.push(debug.item(debug.title('CANVAS (INITIAL)'), debug.dim(canvasSize)));
        items.push(debug.item(debug.title('VIEW'), debug.dim(view)));
        items.push(debug.item(debug.title('VIDEO'), debug.dim(size)));

        // obj, idx, id
        items.push(debug.nl());
        items.push(debug.item(debug.title('OBJ IDX'), debug.val(targets.objIdx)));
        items.push(debug.item(debug.title('OBJ TMP IDX'), debug.val(targets.tmpObjIdx)));
        items.push(debug.item(debug.title('OBJ IDENTIFIER'), debug.val(targets.identifier)));
        items.push(debug.item(debug.title('OBJ TMP IDENTIFIER'), debug.val(targets.tmpIdentifier)));
        items.push(debug.item(debug.title('CHANGE IDX'), debug.val(targets.changeIdx)));

        // match type
        items.push(debug.nl());
        items.push(debug.item(debug.title('MATCH'), debug.val(targets.matchType)));

        // search, target
        if (targets.isSearch()) {
            items.push(debug.item(debug.tag('SEARCH', 'lime'), null, false));
        }
        if (targets.hasTarget()) {
            items.push(debug.item(debug.tag('TARGET', 'red'), null, false));
        }

        items.push(debug.nl());
        items.push(debug.item(debug.title('targets.center.last'), debug.vector(targets.center.last)));
        items.push(debug.item(debug.title('targets.center.current'), debug.vector(targets.center.current)));
        items.push(debug.item(debug.title('targets.box.current'), debug.bound(targets.box.current)));
        items.push(debug.item(debug.title('targets.box.lock'), debug.bound(targets.box.lock)));

        // last boxes
        items.push(debug.item(debug.title('targets.box.last')));
        for (let idx in targets.box.last) {
            if (targets.box.last[idx] == null) {
                continue;
            }
            items.push(debug.item(debug.title(' -- [' + idx + ']'), debug.bound(targets.box.last[idx])));
        }

        items.push(debug.nl());

        // timers, counters        
        items.push(debug.item(debug.title('target.counter.on'), debug.val(target.counter.on)));
        items.push(debug.item(debug.title('target.counter.leave'), debug.val(target.counter.leave)));

        // values
        items.push(debug.nl());
        items.push(debug.item(debug.title('isControl'), debug.bool(targeting.isControl)));
        items.push(debug.item(debug.title('search'), debug.bool(targets.search)));
        items.push(debug.item(debug.title('locked'), debug.bool(config.target.locked)));
        items.push(debug.item(debug.title('matched'), debug.bool(targets.matched)));
        items.push(debug.item(debug.title('single'), debug.bool(config.target.single)));
        items.push(debug.item(debug.title('isLost'), debug.bool(targets.isLost())));
        items.push(debug.item(debug.title('isTarget'), debug.bool(targets.hasTarget())));

        // action
        items.push(debug.nl());
        items.push(debug.item(debug.title('action enabled'), debug.bool(config.action.enabled)));
        items.push(debug.item(debug.title('action.active'), debug.bool(action.active)));
        items.push(debug.item(debug.title('action.counter'), debug.val(action.counter)));

        items.push(debug.nl());

        // objects, keypoints
        let n = 0, i = 0;
        for (let obj of tracker.objects) {

            items.push(debug.nl());

            // header
            let str = '<b>[' + n + ']';
            str += ' <span style="color:orange">' + obj['class'] + '</span>';
            str += ' (' + Math.round(obj['score'] * 100, 2) + '%)';
            if (typeof obj['id'] !== 'undefined') {
                str += ' ID: ' + obj['id'];
            }
            str += '</b>';

            items.push(debug.val(str));

            // center, lock
            if (typeof obj['center'] !== 'undefined') {
                items.push(debug.item(debug.title('CENTER'), debug.vector(obj['center'])));
                if (keypoints.inBounding(obj['center'], targets.box.last, n)) {
                    items.push(debug.item(debug.tag('MATCHED PREV', 'lime'), null, false));
                } else {
                    items.push(debug.item(debug.tag('LEAVED', 'red'), null, false));
                }
            }

            // matched
            if (targets.isMatched) {
                items.push(debug.item(debug.tag('MATCHED', 'lime', null, true)));
            }

            // box
            if (typeof obj['box'] !== 'undefined') {
                items.push(debug.item(debug.title('BOX'), debug.bound(obj['box'])));
            }

            // keypoints
            i = 0;
            if (typeof obj['keypoints'] !== 'undefined') {
                for (let kp of obj.keypoints) {
                    items.push(debug.item(debug.kpoint(i, kp)));
                    i++;
                }
            }
            items.push(debug.nl());
            n++;
        }

        $('#debug_main').html(items.join(''));
    },

    /*
        Log message
     */
    log: function (k, v, log = false) {
        if (typeof k === 'string' || k instanceof String) {
            k = k + ': ';
        }
        debug.custom.push(debug.item(k, v));
        if (log) {
            dbg_console.log(k, v);
        }
    },

    /*
        Custom debug
     */
    showCustomDebug: function () {
        $('#debug_custom').html(debug.custom.join(''));
        debug.custom = [];
    },

    /*
        Pointer coords debug
     */
    handlePointerCoords: function () {
        if (!config.core.enableDebug) {
            return;
        }

        $('#debug_pointer').show();

        const pv = upscaler.pointerToVideo(tracker.mouseX, tracker.mouseY);
        const tv = upscaler.pointerToVideoTransform(tracker.mouseX, tracker.mouseY);
        const d = upscaler.pointerToVideoDeltaNormalized(tracker.mouseX, tracker.mouseY);
        const a = servo.deltaToAngle({x: d.x, y: d.y});
        const vidSize = upscaler.getVideoSize();

        let pX = 0;
        let pY = 0;

        if (window.innerWidth / 2 >= tracker.mouseX) {
            pX = 25;
        } else {
            pX = -140;
        }

        if (window.innerHeight / 2 >= tracker.mouseY) {
            pY = 25;
        } else {
            pY = -120;
        }

        $('#debug_pointer').css('top', tracker.mouseY + pY + 'px');
        $('#debug_pointer').css('left', tracker.mouseX + pX + 'px');

        let items = [];

        // show points
        items.push(debug.item(debug.title('m'), debug.val(tracker.mouseX + ', ' + tracker.mouseY), false));
        items.push(debug.item(debug.title('p'), debug.val(parseInt(pv.x) + ', ' + parseInt(pv.y))));
        items.push(debug.item(debug.title('t'), debug.val(parseInt(tv.x) + ', ' + parseInt(tv.y))));
        items.push(debug.item(debug.title('o'), debug.val((tv.x / vidSize.width).toFixed(2) + ', ' + (tv.y / vidSize.height).toFixed(2))));
        items.push(debug.item(debug.title('s'), debug.val(parseInt(upscaler.translateX(tv.x)) + ', ' + parseInt(upscaler.translateY(tv.y)))));
        items.push(debug.item(debug.title('d'), debug.val(d.x.toFixed(2) + ', ' + d.y.toFixed(2))));
        items.push(debug.item(debug.title('a'), debug.val(a.x.toFixed(2) + ', ' + a.y.toFixed(2))));

        $('#debug_pointer').html(items.join(''));
    },

    /*
        Make entry for title
     */
    title: function (text, color = null) {
        if (color != null) {
            return '<b style="color: ' + color + '">' + text + ':</b> ';
        } else {
            return '<b>' + text + ':</b> ';
        }
    },

    /*
        Make entry for vector
     */
    vector: function (vector) {
        if (vector == null || typeof vector.x === 'undefined' || typeof vector.y === 'undefined') {
            return;
        }
        return vector.x.toFixed(2) + ', ' + vector.y.toFixed(2);
    },

    /*
       Make entry for keypoint 
     */
    kpoint: function (i, kp) {
        let str = i + ': ';

        if (typeof kp.name !== 'undefined') {
            str = kp.name;
        }
        if (typeof kp.x !== 'undefined') {
            str = str + ', ';
            str = str + 'x:' + parseInt(kp.x);
        }
        if (typeof kp.y !== 'undefined') {
            str = str + ', ';
            str = str + 'y:' + parseInt(kp.y);
        }
        if (typeof kp.z !== 'undefined') {
            str = str + ', ';
            str = str + 'z:' + parseInt(kp.z);
        }
        if (typeof kp.score !== 'undefined') {
            str = str + ', ';
            str = str + 's:' + kp.score.toFixed(2);
        }

        return str;
    },

    /*
       Make entry for bound box 
     */
    bound: function (box) {
        if (box == null
            || typeof box.xMin === 'undefined'
            || typeof box.yMin === 'undefined'
            || typeof box.width === 'undefined'
            || typeof box.height === 'undefined'
            || box.xMin == null) {
            return;
        }
        return box.xMin.toFixed(3) + ', '
            + box.yMin.toFixed(3) + ', '
            + box.width.toFixed(3) + ', '
            + box.height.toFixed(3);
    },

    /*
        Make entry for dimension
     */
    dim: function (dim) {
        if (dim == null || typeof dim.width === 'undefined' || typeof dim.height === 'undefined') {
            return;
        }
        return dim.width + 'x' + dim.height;
    },

    /*
       Make entry for new line 
     */
    nl: function () {
        return '<br/>';
    },

    /*
        Make entry for value
     */
    val: function (val, color = null) {
        if (color != null) {
            return '<span style="color: ' + color + '">' + val + '</span>';
        } else {
            return val;
        }
    },

    /*
        Make entry for bool
     */
    bool: function (val) {
        if (val == true) {
            return '<span style="color: lime">TRUE</span>';
        } else {
            return '<span style="color: red">FALSE</span>';
        }
    },

    /*
        Add item
     */
    item: function (key, value = '', nl = true) {
        let str = '';
        if (value == null) {
            value = '';
        }
        if (nl) {
            str += '<br/>';
        }
        return str + key + value;
    },

    /*
       Make entry for tag
     */
    tag: function (text, color = 'red') {
        return ' <span style="color: ' + color + '; font-weight: bold">[' + text + ']</span>';
    },

    /*
        Enable pointer corods debug
     */
    enablePointerCoords: function () {
        debug.pointerCoords = true;
        $('#debug_pointer').show();
    },

    /*
        Disable pointer coords debug
     */
    disablePointerCoords: function () {
        debug.pointerCoords = false;
        $('#debug_pointer').hide();
    },
}