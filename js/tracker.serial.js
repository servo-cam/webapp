// ###############################################################################
// This file is a part of servocam.org package <servocam.org>
// Created By: Marcin Szczygliński <info@servocam.org>
// GitHub: https://github.com/servo-cam
// License: MIT
// Updated At: 2023.03.27 02:00
// ###############################################################################

const serial = {

    // USB serial port
    port: null,
    textEncoder: null,
    writableStreamClosed: null,
    writer: null,
    enabled: false, // is serial enabled

    /*
        Connect to USB serial
     */
    connect: async function (is_servo = false) {
        try {
            serial.port = await navigator.serial.requestPort();
            await serial.port.open({baudRate: config.serial.baudRate});
            let settings = {};

            if (localStorage.dtrOn == "true") {
                settings.dataTerminalReady = true;
            }
            if (localStorage.rtsOn == "true") {
                settings.requestToSend = true;
            }
            if (Object.keys(settings).length > 0) {
                await serial.port.setSignals(settings);
            }

            serial.textEncoder = new TextEncoderStream();
            serial.writableStreamClosed = serial.textEncoder.readable.pipeTo(serial.port.writable);
            serial.writer = serial.textEncoder.writable.getWriter();
            serial.enabled = true;
            if (is_servo) {
                ui.enableBtn('btn-servo', null, 'success');
            }
            await serial.listen(); // start listening
        } catch (e) {
            // dispatch tracker event
            tracker.dispatch('serialDisconnect', e);
            console.error(e);
            serial.enabled = false;
            servo.disable();
            ui.disableBtn('btn-usb-connect', null);
            ui.disableBtn('btn-servo', null);

            // alert
            alert("USB Serial Connection Failed: " + e);
        }
    },

    /*
        Send data
     */
    send: async function (data) {
        if (!serial.enabled) {
            console.error('Serial port is disabled. Abort sending...');
            return;
        }

        // dispatch tracker event
        tracker.dispatch('serialSend', data);
        console.log(data);
        await serial.writer.write(data);
    },

    /*
        Listen port
     */
    listen: async function () {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = serial.port.readable.pipeTo(textDecoder.writable);

        while (serial.port.readable) {
            const reader = textDecoder.readable.getReader();

            ui.disableBtn('btn-usb-connect', null, false);
            ui.enableBtn('btn-usb-connect', null, 'success');

            serial.enabled = true;

            // dispatch tracker event
            tracker.dispatch('serialConnect', serial.port);

            if (servo.enabled) {
                ui.disableBtn('btn-servo', null, false);
                ui.enableBtn('btn-servo', null, 'success');
            }

            try {
                // Listen to data coming from the serial device.
                while (true) {
                    const {value, done} = await reader.read();
                    if (done) {
                        //console.log('[readLoop] DONE', done);
                    }
                    serial.onReceive(value);
                }
            } catch (error) {
                console.error('LISTEN', error);
            } finally {
                // Allow the serial port to be closed later.
                reader.releaseLock();
            }
        }
    },

    /*
        On from serial port data receive
     */
    onReceive: function (data) {
        // dispatch tracker event
        tracker.dispatch('serialReceive', data);

        // receive status data
        switch (config.command.serial.format) {
            // raw
            case 'RAW':
                tracker.remoteStatus['local'] = data;
                break;
            // json
            case 'JSON':
                try {
                    tracker.remoteStatus['local'] = JSON.parse(data);
                } catch (err) {
                    console.error('JSON parse error', err);
                }
                break;
        }

        console.log(data);
    },
}