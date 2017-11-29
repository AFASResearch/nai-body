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

  wss.on('connection', (ws: any) => {
    dependencies.microBit.sendCommand('asleep');
    ws.on('message', (message: string) => {
      console.log(`Server received: ${message}`);
      try {
        let event: ExternalEvent = JSON.parse(message);
        if (event.type === 'textRecognized' && event.text) {
          dependencies.messageLogic.process(event.text, {toMe: true, source: 'webserver'}).then((reply) => {
            if (reply) {
              ws.send(reply);
            }
          });
        } else if (event.type === 'waiting') {
          dependencies.microBit.sendCommand('asleep');
        } else if (event.type === 'listening') {
          dependencies.microBit.sendCommand('smile');
        } else if (event.type === 'audioSent') {
          dependencies.microBit.sendCommand('think');
        } else if (event.type === 'speaking') {
          dependencies.microBit.sendCommand('speak');
        }
      } catch (e) {
        console.log('Could not process message received from webserver: ' + e);
      }
    });
    ws.on('close', () => {
      dependencies.microBit.sendCommand('away');
    })
  });

  console.log('Webserver listening on http://localhost:' + config.port);

  return {
    stop: (cb: () => void) => {
      server.close(cb)
    }
  }
};
