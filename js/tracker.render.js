// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const render = {

    prevTargetIds: [], // targets buttons ids

    /*
        Handle detected objects and draw them on canvas
     */
    append: function () {
        // if render disabled then return
        if (!config.render.view) {
            return;
        }

        if (tracker.objects && tracker.objects.length > 0) {

            // loop on all detected objects
            for (let objIdx of tracker.objects.keys()) {

                // handle model's points rendering
                tracker.wrapper.onRender(objIdx, tracker.objects);
            }

        } else {
            // set summary score
            keypoints.score = 0.0;
        }

        // draw bounds
        if (config.render.bounds) {

            // draw target lock boundings
            render.drawLockBoundings();

            // draw target area
            if (config.area.enabled.target) {
                render.drawArea('TARGET');
            }
            // draw patrol area
            if (config.area.enabled.patrol) {
                render.drawArea('PATROL');
            }
            // draw action area
            if (config.area.enabled.action) {
                render.drawArea('ACTION');
            }
            // draw debug bounds
            if (config.core.enableDebug) {
                render.drawSortBoxes();
                render.drawMatchBoxes();
            }
        }
    },

    /*
        Clear simulation mode
     */
    clearSimulator: function () {
        tracker.ctx.setTransform(1, 0, 0, 1, 0, 0);
    },

    /*
        Draw target crosshair
     */
    drawCrosshair: function (w, h, x, y, r, g, b, a) {
        render.drawLine(0, y, w, y, r, g, b, a);
        render.drawLine(x, 0, x, h, r, g, b, a);
    },

    /*
        Draw object boundings
     */
    drawBoundings: function (objIdx, score, coords = true) {
        let text = tracker.objects[objIdx]['class'] + ' ' + objIdx + ' - ' + Math.round(parseFloat(tracker.objects[objIdx]['score']) * 100) + '% ';
        if (typeof tracker.objects[objIdx]['id'] != 'undefined') {
            text += '#' + tracker.objects[objIdx]['id'];
        }
        render.drawBoundingBox(tracker.objects[objIdx]['box'], text, score, coords);
    },

    /*
        Draw object center point
     */
    drawCenter: function (objIdx, score, coords = true) {
        let x = tracker.objects[objIdx]['center'].x;
        let y = tracker.objects[objIdx]['center'].y;
        render.drawCircle(x, y, 0, 255, 0, 0.6);
    },

    drawSortBoxes: function () {

        for (let id in sorter.prevBoxes) {
            const text = id + ' (' + ((new Date()).getTime() - sorter.prevBoxes[id]['dt'].getTime()) / 1000 + ') + x' + sorter.prevBoxes[id]['c'];
            render.drawDebugBox(sorter.prevBoxes[id]['box'], text, 'orange', 'rgba(50, 205, 50, 0.1)');
        }
    },

    drawMatchBoxes: function () {
        n = 0;
        for (let box in targets.box.last) {
            render.drawDebugBox(box, n, 'pink', 'rgba(50, 5, 150, 0.1)');
            n++;
        }
    },

    /*
        Draw bounding box
     */
    drawDebugBox: function (box, text, stroke, fill, coords = true) {
        if (box == null) {
            return;
        }
        const w = tracker.video.videoWidth;
        const h = tracker.video.videoHeight;

        let vx1, vx2, vy1, vy2;

        let xMin = box.xMin;
        let yMin = box.yMin;
        let xMax = xMin + box.width;
        let yMax = yMin + box.height;

        vx1 = w * xMin;
        vy1 = h * yMin;
        vx2 = w * (xMax - xMin);
        vy2 = h * (yMax - yMin);

        // coords on screen (resized canvas)
        const x1 = parseInt(upscaler.translateX(vx1));
        const y1 = parseInt(upscaler.translateY(vy1));
        const x2 = parseInt(vx2);
        const y2 = parseInt(vy2);

        tracker.ctx.beginPath();
        tracker.ctx.lineWidth = 2;
        tracker.ctx.strokeStyle = stroke;
        tracker.ctx.fillStyle = fill;
        tracker.ctx.fillRect(x1, y1, x2, y2);
        tracker.ctx.rect(x1, y1, x2, y2);
        tracker.ctx.stroke();
        tracker.ctx.closePath();

        if (text != null) {
            tracker.ctx.beginPath();
            tracker.ctx.lineWidth = 2;
            tracker.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            tracker.ctx.fillRect(x1, y1 - 30, x2, 30);
            tracker.ctx.strokeStyle = 'black';
            tracker.ctx.closePath();

            tracker.ctx.beginPath();
            tracker.ctx.lineWidth = 2;
            tracker.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            tracker.ctx.strokeStyle = 'black';
            tracker.ctx.font = '13px Arial';
            tracker.ctx.fillStyle = stroke;
            tracker.ctx.fillText(text, x1 + 10, y1 - 10);
            tracker.ctx.closePath();
        }
    },

    /*
        Draw bounding box
     */
    drawBoundingBox: function (box, text, score, coords = true) {
        if (box == null) {
            return;
        }
        const w = tracker.video.videoWidth;
        const h = tracker.video.videoHeight;

        let vx1, vx2, vy1, vy2;

        let xMin = box.xMin;
        let yMin = box.yMin;
        let xMax = xMin + box.width;
        let yMax = yMin + box.height;

        vx1 = w * xMin;
        vy1 = h * yMin;
        vx2 = w * (xMax - xMin);
        vy2 = h * (yMax - yMin);

        // coords on screen (resized canvas)
        const x1 = parseInt(upscaler.translateX(vx1));
        const y1 = parseInt(upscaler.translateY(vy1));
        const x2 = parseInt(vx2);
        const y2 = parseInt(vy2);

        tracker.ctx.beginPath();
        tracker.ctx.lineWidth = 2;
        tracker.ctx.strokeStyle = 'lime';
        tracker.ctx.fillStyle = 'rgba(50, 205, 50, 0.1)';
        tracker.ctx.fillRect(x1, y1, x2, y2);
        tracker.ctx.rect(x1, y1, x2, y2);
        tracker.ctx.stroke();
        tracker.ctx.closePath();

        if (text != null) {
            tracker.ctx.beginPath();
            tracker.ctx.lineWidth = 2;
            tracker.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            tracker.ctx.fillRect(x1, y1 - 30, x2, 30);
            tracker.ctx.strokeStyle = 'black';
            tracker.ctx.closePath();

            tracker.ctx.beginPath();
            tracker.ctx.lineWidth = 2;
            tracker.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            tracker.ctx.strokeStyle = 'black';
            tracker.ctx.font = '13px Arial';
            tracker.ctx.fillStyle = 'lime';
            tracker.ctx.fillText(text, x1 + 10, y1 - 10);
            tracker.ctx.closePath();
        }
    },

    /*
        Draw limit area
     */
    drawArea: function (type) {
        let box = {};
        let stroke = '';
        let fill = '';

        switch (type) {
            case 'TARGET':
                box = config.area.box.target;
                stroke = 'lime';
                fill = 'rgba(50, 205, 150, 0.1)';
                break;
            case 'PATROL':
                box = config.area.box.patrol;
                stroke = 'orange';
                fill = 'rgba(255, 255, 0, 0.1)';
                break;
            case 'ACTION':
                box = config.area.box.action;
                stroke = 'red';
                fill = 'rgba(255, 0, 0, 0.1)';
                break;
        }

        const w = tracker.video.videoWidth;
        const h = tracker.video.videoHeight;

        let vx1, vx2, vy1, vy2;
        let xMin = box.xMin;
        let yMin = box.yMin;

        if (config.render.simulator) {
            // if not world position then add delta transform
            if (!config.area.world[type.toLowerCase()]) {
                xMin -= tracker.dx;
                yMin += tracker.dy;
            }
        } else {
            if (config.render.locked) {
                // if world position then add delta transform
                if (config.area.world[type.toLowerCase()]) {
                    xMin -= tracker.dx;
                    yMin += tracker.dy;
                }
            }
        }

        let xMax = xMin + box.width;
        let yMax = yMin + box.height;

        vx1 = w * xMin;
        vy1 = h * yMin;
        vx2 = w * (xMax - xMin);
        vy2 = h * (yMax - yMin);

        // coords on screen (resized canvas)
        const x1 = parseInt(upscaler.translateX(vx1));
        const y1 = parseInt(upscaler.translateY(vy1));
        const x2 = parseInt(vx2);
        const y2 = parseInt(vy2);

        // draw
        tracker.ctx.beginPath();
        tracker.ctx.lineWidth = 2;
        tracker.ctx.strokeStyle = stroke;
        tracker.ctx.fillStyle = fill;
        tracker.ctx.fillRect(x1, y1, x2, y2);
        tracker.ctx.rect(x1, y1, x2, y2);
        tracker.ctx.stroke();
        tracker.ctx.closePath();
    },

    /*
        Draw lock boundings
     */
    drawLockBoundings: function () {
        if (targets.box.lock != {
            'xMin': 0,
            'yMin': 0,
            'width': 0,
            'height': 0,
        }) {
            render.drawLockBox(targets.box.lock, null, 1);
        }
    },

    /*
        Draw lock box
     */
    drawLockBox: function (box, text, score) {
        if (box == null) {
            return;
        }
        const w = tracker.video.videoWidth;
        const h = tracker.video.videoHeight;

        let vx1, vx2, vy1, vy2;
        let xMin = box.xMin;
        let yMin = box.yMin;
        let xMax = xMin + box.width;
        let yMax = yMin + box.height;

        vx1 = w * xMin;
        vy1 = h * yMin;
        vx2 = w * (xMax - xMin);
        vy2 = h * (yMax - yMin);

        // coords on screen (resized canvas)
        const x1 = parseInt(upscaler.translateX(vx1));
        const y1 = parseInt(upscaler.translateY(vy1));
        const x2 = parseInt(vx2);
        const y2 = parseInt(vy2);

        tracker.ctx.beginPath();
        tracker.ctx.lineWidth = 10;
        tracker.ctx.strokeStyle = 'red';
        tracker.ctx.rect(x1, y1, x2, y2);
        tracker.ctx.stroke();
        tracker.ctx.closePath();
    },

    /*
        Draw point and bone on canvas
     */
    drawPath: function (x1, y1, x2, y2, r, g, b, score) {
        // use score to calculate alpha
        let a = score - 0.15;
        if (a < 0) {
            a = 0.0;
        }
        // draw connection
        render.drawLine(x1, y1,
            x2, y2,
            r, g, b, a);

        // draw joint
        render.drawCircle(x1, y1,
            r, g, b, a);
    },

    /*
        Draw connection between points on canvas
     */
    drawLine: function (x1, y1, x2, y2, r, g, b, a) {
        const m = upscaler.denormalize({x: x1, y: y1});
        const l = upscaler.denormalize({x: x2, y: y2});

        tracker.ctx.beginPath();
        tracker.ctx.lineWidth = config.render.pointWidth;
        tracker.ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        tracker.ctx.moveTo(upscaler.translateX(m.x), upscaler.translateY(m.y));
        tracker.ctx.lineTo(upscaler.translateX(l.x), upscaler.translateY(l.y));
        tracker.ctx.stroke();
        tracker.ctx.closePath();
    },

    /*
        Draw point on canvas
     */
    drawCircle: function (x, y, r, g, b, a) {
        const c = upscaler.denormalize({x: x, y: y});

        tracker.ctx.beginPath();
        tracker.ctx.arc(upscaler.translateX(c.x), upscaler.translateY(c.y), config.render.pointRadius, 0, 2 * Math.PI);
        tracker.ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        tracker.ctx.fill();
        tracker.ctx.closePath();
    },

    /*
       Draw all data on canvas
     */
    drawTargetData: function () {
        const vidSize = upscaler.getVideoSize();
        if (targeting.target != null) {
            render.drawCircle(targeting.target.x, targeting.target.y, 255, 255, 255, 1.0); // final target (head, body, etc.)
        }
        render.drawLine(targeting.cam.x, targeting.cam.y, targeting.now.x, targeting.now.y, 255, 0, 0, 0.5); // magnitude from center to target
        render.drawCrosshair(vidSize.width, vidSize.height, targeting.now.x, targeting.now.y, 255, 0, 0, 1.0); // current target crosshair
        render.drawCircle(targeting.now.x, targeting.now.y, 200, 0, 0, 1.0); // current target
        render.drawCircle(targeting.cam.x, targeting.cam.y, 255, 255, 0, 0.9); // camera center point
    },

    /*
        Draw 3D keypoints using ScatterGL
     */
    drawKeypoints3D: function (keypoints) {
        const scoreThreshold = config.model.minScore || 0;
        const pointsData = keypoints.map(keypoint => [keypoint.x, -keypoint.y, -keypoint.z]);
        const dataset = new ScatterGL.Dataset([...pointsData, ...tracker.anchors3D]);
        const keypointInd = poseDetection.util.getKeypointIndexBySide(tracker.detectorModel);

        // defined colors for sizes
        tracker.scatterGL.setPointColorer(i => {
            if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
                return '#ffffff'; // white if low score
            }
            if (i === 0) {
                return '#ff0000'; // red
            }
            if (keypointInd.left.indexOf(i) > -1) {
                return '#00ff00'; // green
            }
            if (keypointInd.right.indexOf(i) > -1) {
                return '#ffa500'; // orange
            }
        });

        // check if already rendered
        if (!tracker.scatterGLInitialized) {
            tracker.scatterGL.render(dataset);
        } else {
            tracker.scatterGL.updateDataset(dataset);
        }

        const connections = poseDetection.util.getAdjacentPairs(tracker.detectorModel);
        const sequences = connections.map(pair => ({
            indices: pair
        }));
        tracker.scatterGL.setSequences(sequences);
        tracker.scatterGLInitialized = true;
    },

    /*
        Build targets buttons
     */
    buildTargetButtons: function () {
        let ids = [];
        for (let obj of tracker.objects) {
            if (obj.score < config.model.minScore) {
                continue;
            }

            if (typeof obj['id'] != 'undefined') {
                ids.push(obj['id']);
            } else {
                ids.push(-1);
            }
        }
        ids.sort();

        if (JSON.stringify(render.prevTargetIds) !== JSON.stringify(ids)) {
            document.getElementById('targets_list').innerHTML = '';
            for (let identifier of ids) {
                idx = ids.indexOf(identifier);
                btn = document.createElement('button');
                btn.classList.add('btn');

                if (targets.isLocked() && targets.objIdx == idx) {
                    btn.classList.add('btn-danger');
                } else {
                    btn.classList.add('btn-secondary');
                }

                btn.classList.add('btn_obj_select');
                btn.classList.add('btn-sm');
                btn.setAttribute('data-obj', identifier);
                btn.setAttribute('data-idx', idx);
                btn.setAttribute('onclick', 'targets.switchTarget(' + idx + ');');
                let str = '';
                if (typeof tracker.objects[idx]['class'] != 'undefined') {
                    str += tracker.objects[idx]['class'] + ' ';
                }
                str += idx;
                str += ' #' + identifier;
                btn.innerHTML = str;
                document.getElementById('targets_list').appendChild(btn);
            }
        }
        render.prevTargetIds = ids;
    },

    /*
        Update targets buttons
     */
    updateTargetButtons: function () {
        // remove btn primary from all obj buttons
        $('.btn_obj_select').removeClass('btn-primary');
        $('.btn_obj_select').addClass('btn-secondary');

        if (targets.isLocked()) {
            $('.btn_obj_select').removeClass('btn-danger');
            $('.btn_obj_select').addClass('btn-secondary');

            $('.btn_obj_select[data-idx="' + targets.tmpObjIdx + '"]').removeClass('btn-secondary');
            $('.btn_obj_select[data-idx="' + targets.tmpObjIdx + '"]').addClass('btn-danger');
        } else {
            $('.btn_obj_select').removeClass('btn-danger');
            $('.btn_obj_select').addClass('btn-secondary');
        }

        if (targets.isLost() && !targets.isLocked()) {
            $('#lock-lost-counter').show();
        } else {
            $('#lock-lost-counter').hide();
        }

        // update obj select bottom button
        $('.btn_obj_select[data-idx="' + targets.tmpObjIdx + '"]').addClass('btn-primary');
        $('.btn_obj_select[data-idx="' + targets.tmpObjIdx + '"]').removeClass('btn-secondary');
    },

    /*
       Display play/pause icon
    */
    showPlaybackControls: function () {
        let size = (tracker.canvas.height / 2) * 0.5;

        tracker.ctx.fillStyle = "black";
        tracker.ctx.globalAlpha = 0.5;
        tracker.ctx.fillRect(0, 0, tracker.canvas.width, tracker.canvas.height);
        tracker.ctx.fillStyle = "#DDD";
        tracker.ctx.globalAlpha = 0.75;
        tracker.ctx.beginPath();
        tracker.ctx.moveTo(tracker.canvas.width / 2 + size / 2, tracker.canvas.height / 2);
        tracker.ctx.lineTo(tracker.canvas.width / 2 - size / 2, tracker.canvas.height / 2 + size);
        tracker.ctx.lineTo(tracker.canvas.width / 2 - size / 2, tracker.canvas.height / 2 - size);
        tracker.ctx.closePath();
        tracker.ctx.fill();
        tracker.ctx.globalAlpha = 1;
    },
}