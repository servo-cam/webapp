#!/usr/bin/env python3

import argparse
import webbrowser
import time
import sys
import os
from flask import Flask
from threading import Thread
from flask import send_from_directory

root = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=root)


@app.route('/<path:path>', methods=['GET'])
def static_proxy(path):
    return send_from_directory(root, path)


@app.route('/', methods=['GET'])
def index():
    return send_from_directory(root, 'index.html')


def start_webserver(port):
    app.run(host='0.0.0.0', port=port, debug=True,
                 threaded=True, use_reloader=False)


if __name__ == '__main__':
    port = 8000
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", "--port", required=False,
                    help="port (8000 is default")

    args = vars(ap.parse_args())
    if "port" in args and args['port'] is not None:
        port = int(args['port'])

    print("Starting webserver on port: {}".format(port))

    t = Thread(target=start_webserver, args=(port,))
    t.daemon = True
    t.start()

    time.sleep(1.0)
    webbrowser.open('http://localhost:{}'.format(port))

    while True:
        try:
            time.sleep(0.1)
        except KeyboardInterrupt:
            print("Exiting...")
            sys.exit(0)
