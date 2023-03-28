// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const upscaler = {

    /*
        Return video dimmensions
     */
    getVideoSize: function () {
        return {
            width: Math.round(tracker.video.videoWidth, 0),
            height: Math.round(tracker.video.videoHeight, 0),
        };
    },

    /*
        Return original canvas dimmensions
     */
    getCanvasSize: function () {
        return {
            width: Math.round(tracker.canvas.width, 0),
            height: Math.round(tracker.canvas.height, 0),
        };
    },

    /*
        Return real current canvas dimmensions
     */
    getCurrentCanvasSize: function () {
        const canvas = upscaler.getCanvas();
        return {
            width: Math.round(canvas.width(), 0),
            height: Math.round(canvas.height(), 0),
        };
    },

    /*
        Return canvas object
     */
    getCanvas: function () {
        return $('#canvas');
    },

    /*
        Prepare point coods on video
     */
    pointerToVideo: function (x, y) {
        const vidSize = upscaler.getVideoSize();
        const canvasSize = upscaler.getCurrentCanvasSize();
        const canvas = upscaler.getCanvas();
        const view = upscaler.fit();

        let vx = x - canvas.offset().left;
        let vy = y - canvas.offset().top + $(window).scrollTop();
        let diff = 0;

        // fix min/max
        if (vidSize.width < view.width) {
            if (canvasSize.width > view.width) {
                diff = (canvasSize.width - view.width) / 2;
                vx = vx - diff;
            }
        }

        let maxX = view.width;
        let maxY = view.height;

        // fix min/max
        if (canvasSize.width > view.width) {
            maxX = canvasSize.width;
            maxY = canvasSize.height;
        }
        if (canvasSize.height < view.height) {
            maxY = canvasSize.height;
        }

        // check min and max
        if (vx < 0) {
            vx = 0;
        }
        if (vx > maxX) {
            vx = maxX;
        }
        if (vy < 0) {
            vy = 0;
        }
        if (vy > maxY) {
            vy = maxY;
        }

        return {
            x: vx,
            y: vy,
        };
    },

    /*
        Translate point to video coord
     */
    pointerToVideoTransform: function (x, y) {
        const vidSize = upscaler.getVideoSize();
        const view = upscaler.fit();
        const p = upscaler.pointerToVideo(x, y); // translate screen point to video point        
        const canvas = upscaler.getCanvas(); // get current canvas dimmensions
        const canvasSize = upscaler.getCurrentCanvasSize(); // get current canvas dimmensions

        let tx, ty, percX, percY;

        if (canvasSize.width > view.width) {
            // e.g. video, 720p, on full page canvas width and height > video, view = video
            percX = (p.x / canvasSize.width) * 100;
            tx = (percX / 100) * vidSize.width;
            percY = (p.y / canvasSize.height) * 100;
            ty = (percY / 100) * vidSize.height;

        } else if (canvasSize.width == view.width) {
            // e.g. camera, view resized, canvas height > view height, canvas heigth < video height
            percX = (p.x / view.width) * 100;
            tx = (percX / 100) * vidSize.width;
            percY = (p.y / view.height) * 100;
            ty = (percY / 100) * vidSize.height;

            if (canvasSize.height < view.height) {
                percY = (p.y / canvasSize.height) * 100;
                ty = (percY / 100) * vidSize.height;
            }

        } else {
            // e.g. video 1080p, canvas width and height < video, view = video
            percX = (p.x / canvasSize.width) * 100;
            tx = (percX / 100) * vidSize.width;
            percY = (p.y / canvasSize.height) * 100;
            ty = (percY / 100) * vidSize.height;
        }

        if (tx > vidSize.width) {
            tx = vidSize.width;
        }
        if (ty > vidSize.height) {
            ty = vidSize.height;
        }

        // return real video x, y coords
        return {
            x: tx,
            y: ty,
        };
    },

    /*
        Translate point to video delta position
     */
    pointerToVideoDelta: function (x, y) {
        const view = upscaler.fit();
        const vidSize = upscaler.getVideoSize(); // get original video size, do not scale now to screen x, y
        const canvas = upscaler.getCanvas(); // canvas obj

        let transform = upscaler.pointerToVideoTransform(x, y); // get coords translated to video x, y points
        let dx = -(transform.x - vidSize.width) - (vidSize.width / 2);
        let dy = -(transform.y - vidSize.height) - (vidSize.height / 2);

        return {
            x: dx,
            y: dy,
        };
    },

    /*
        Translate point to video delta position
     */
    pointerToVideoDeltaNormalized: function (x, y) {
        const transform = upscaler.pointerToVideoTransform(x, y);
        const vidSize = upscaler.getVideoSize();
        return {
            x: -(transform.x / vidSize.width) + 0.5,
            y: -(transform.y / vidSize.height) + 0.5,
        };
    },

    /*
        Re-calculate size between source and destination area
     */
    fit: function () {
        const vidSize = upscaler.getVideoSize();
        const canvasSize = upscaler.getCanvasSize();
        const vidRatio = vidSize.width / vidSize.height;
        const canvasRatio = canvasSize.width / canvasSize.height;

        // if resizing disabled then return original video width and canvas height
        if (!config.render.resize) {
            return {
                width: vidSize.width,
                height: canvasSize.height
            };
        }

        switch (config.init.mode) {
            case 'camera':
            case 'remote':
                if (vidSize.width < vidSize.height) {
                    return {
                        width: Math.round(canvasSize.height * vidRatio, 0),
                        height: canvasSize.height,
                    };
                } else {
                    return {
                        width: canvasSize.width,
                        height: Math.round(canvasSize.width / vidRatio, 0),
                    };
                }
                break;

            case 'video':
            case 'stream':
                if (canvasRatio > vidRatio) {
                    return {
                        width: Math.round(canvasSize.height * vidRatio, 0),
                        height: canvasSize.height,
                    };
                } else {
                    return {
                        width: canvasSize.width,
                        height: Math.round(canvasSize.width / vidRatio, 0),
                    };
                }
                break;
        }
    },

    /*
        Re-calculate/scale X position of point
     */
    translateX: function (x) {
        if (!config.render.resize) {
            // if servo movement simulation then append delta offset
            if (config.render.simulator) {
                x += upscaler.denormalize({x: tracker.dx, y: 0}).x;
            }
            return x;
        }

        const vidSize = upscaler.getVideoSize();
        const canvasSize = upscaler.getCanvasSize();
        const view = upscaler.fit();
        const factor = (view.width) / vidSize.width;
        let xOffset = (canvasSize.width - view.width) / 2;

        if (!config.render.autofit) {
            xOffset = 0;
        }
        x = Math.ceil(x * factor) + xOffset;

        // update with delta X
        if (config.render.simulator) {
            x += upscaler.denormalize({x: tracker.dx, y: 0}).x;
        }

        return x;
    },

    /*
        Re-calculate/scale Y position of point
     */
    translateY: function (y) {
        if (!config.render.resize) {
            // if servo movement simulation then append delta offset
            if (config.render.simulator) {
                y += upscaler.denormalize({x: 0, y: tracker.dy}).y;
            }
            return y;
        }

        const vidSize = upscaler.getVideoSize();
        const canvasSize = upscaler.getCanvasSize();
        const view = upscaler.fit();
        const factor = view.height / vidSize.height;

        yOffset = 0;

        y = Math.ceil(y * factor) + yOffset;

        // update with delta Y
        if (config.render.simulator) {
            y += upscaler.denormalize({x: 0, y: tracker.dy}).y;
        }

        return y;
    },
    /**
     * Normalize to float x, y
     */
    normalize: function (coord) {
        const view = upscaler.fit();
        return {
            x: coord.x / view.width,
            y: coord.y / view.height
        };
    },

    /**
     * Denormalize to pixel x, y
     */
    denormalize: function (coord) {
        const view = upscaler.fit();
        return {
            x: Math.round(parseFloat(coord.x * view.width), 0),
            y: Math.round(parseFloat(coord.y * view.height), 0)
        };
    },
}