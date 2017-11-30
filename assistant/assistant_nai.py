#!/usr/bin/env python3


# This is sample code from Google that has been altered to pass all events that happen through a websocket
# and receiving instructions back if a text was handled locally.


# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Run a recognizer using the Google Assistant Library.

The Google Assistant Library has direct access to the audio API, so this Python
code doesn't need to record audio. Hot word detection "OK, Google" is supported.

The Google Assistant Library can be installed with:
    env/bin/pip install google-assistant-library==0.0.2

It is available for Raspberry Pi 2/3 only; Pi Zero is not supported.
"""

import logging
import sys
import websocket
import _thread
import time
import json

import aiy.assistant.auth_helpers
import aiy.voicehat
from google.assistant.library import Assistant
from google.assistant.library.event import EventType

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s:%(name)s:%(message)s"
)

def send(obj):
    global ws
    try:
        ws.send(json.dumps(obj))
    except:
        print("Message could not be sent");

def process_event(event):
    status_ui = aiy.voicehat.get_status_ui()
    if event.type == EventType.ON_START_FINISHED:
        status_ui.status('ready')
        if sys.stdout.isatty():
            print('Say "OK, Google" then speak, or press Ctrl+C to quit...')
            
    elif event.type == EventType.ON_CONVERSATION_TURN_STARTED:
        status_ui.status('listening')
        send({"type": "listening"})

    elif event.type == EventType.ON_END_OF_UTTERANCE:
        status_ui.status('thinking')
        send({"type": "audioSent"})

    elif event.type == EventType.ON_RECOGNIZING_SPEECH_FINISHED:
        status_ui.status('thinking')
        send({"type": "textRecognized", "text": event.args['text']})

    elif event.type == EventType.ON_RESPONDING_STARTED:
        send({"type": "speaking"})

    elif event.type == EventType.ON_CONVERSATION_TURN_FINISHED:
        if event.args and event.args['with_follow_on_turn']:
            status_ui.status('listening')
            send({"type": "listening"})
        else:
            status_ui.status('ready')
            send({"type": "waiting"})

    elif event.type == EventType.ON_ASSISTANT_ERROR and event.args and event.args['is_fatal']:
        send({"type": "error"})
        sys.exit(1)

def on_message(ws, message):
    global assistant
    print(message)
    assistant.stop_conversation();
    aiy.audio.say(message);

def on_error(ws, error):
  print("error")
  print(error)

def on_open(ws):
  print("open")

def run_websocket(*args):
    print("opening websocket")
    while True:
        global ws
        ws = websocket.WebSocketApp("ws://localhost/ws",
                                on_message = on_message,
                                on_error = on_error)
        ws.on_open = on_open
        ws.run_forever()
        print("Trying again to open websocket in 10 seconds")
        time.sleep(10)

def main():
    global assistant;
    _thread.start_new_thread(run_websocket, ())
    print("starting assistant")
    credentials = aiy.assistant.auth_helpers.get_assistant_credentials()
    with Assistant(credentials) as assistant:
        for event in assistant.start():
            process_event(event)

if __name__ == '__main__':
    main()
