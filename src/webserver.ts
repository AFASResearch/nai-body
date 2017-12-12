import { MessageLogic } from './logic/message-logic';
import { Server } from 'http';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import {MicroBitService} from './services/microBit';
var querystring = require('querystring');

interface ExternalEvent {
  type: 'waiting' | 'listening' | 'audioSent' | 'textRecognized' | 'speaking';
  text?: string; /* only if type === textRecognized */
}

interface WebserverConfig {
  port: number;
}

export let startWebserver = (config: WebserverConfig, dependencies: {messageLogic: MessageLogic, microBit: MicroBitService}) => {
  let server = new Server((req, res) => {
    if (req.url === '/emotion') {
      let body = '';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end', () => {
        let post = querystring.parse(body);
        dependencies.microBit.sendCommand(post.emotion);
        res.writeHead(302, { Location: '/index.html' });
        res.end();
      });
      return;
    }
    let indexHtml = fs.readFileSync(`${__dirname}/../public/index.html`, { encoding: 'UTF8' });
    res.writeHead(200, { type: 'text/html' });
    res.write(indexHtml);
    res.end();
  });
  const wss = new WebSocket.Server({ server, path: '/ws' });

  server.listen(config.port);

  let faceAnimation: any | undefined;
  let stopAnimation = () => {
    if (faceAnimation) {
      clearInterval(faceAnimation);
      faceAnimation = undefined;
    }
  };

  wss.on('connection', (ws: any) => {
    console.log('Websocket connected');
    stopAnimation();
    dependencies.microBit.sendCommand('asleep');
    ws.on('message', (message: string) => {
      console.log(`Server received: ${message}`);
      try {
        let event: ExternalEvent = JSON.parse(message);
        if (event.type === 'textRecognized' && event.text) {
          dependencies.messageLogic.process(event.text, {toMe: true, source: 'webserver'}).then((reply) => {
            if (reply) {
              stopAnimation();
              dependencies.microBit.sendCommand('asleep');
              ws.send(reply);
            }
          });
        } else if (event.type === 'waiting') {
          stopAnimation();
          dependencies.microBit.sendCommand('asleep');
        } else if (event.type === 'listening') {
          stopAnimation();
          dependencies.microBit.sendCommand('smile');
        } else if (event.type === 'audioSent') {
          stopAnimation();
          dependencies.microBit.sendCommand('think');
          // animation
          let state = 0;
          faceAnimation = setInterval(() => {
            state = (state + 1) % 4;
            switch (state) {
              case 0:
                dependencies.microBit.sendCommand('think');
                break;
              case 1:
                dependencies.microBit.sendCommand('think-right');
                break;
              case 2:
                dependencies.microBit.sendCommand('think');
                break;
              case 3:
                dependencies.microBit.sendCommand('think-left');
                break;
            }
          }, 250);

        } else if (event.type === 'speaking') {
          stopAnimation();
          dependencies.microBit.sendCommand('speak2');
          // animation
          let speak2 = true;
          faceAnimation = setInterval(() => {
            speak2 = !speak2;
            dependencies.microBit.sendCommand(speak2 ? 'speak2' : 'speak');
          }, 200);
        }
      } catch (e) {
        console.log('Could not process message received from webserver: ' + e);
      }
    });
    ws.on('close', () => {
      console.log('Websocket disconnected');
      stopAnimation();
      dependencies.microBit.sendCommand('away');
    })
  });

  console.log('Webserver listening on http://localhost:' + config.port);

  return {
    stop: (cb: () => void) => {
      server.close(cb);
      setTimeout(cb, 500);
    }
  }
};
