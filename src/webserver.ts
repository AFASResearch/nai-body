import { MessageLogic } from './logic/message-logic';
import { Server } from 'http';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import {MicroBitService} from './services/microBit';
var querystring = require('querystring');

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
    ws.on('message', (message: string) => {
      console.log(`Server received: ${message}`);
      dependencies.messageLogic.process(message, {toMe: true, source: 'webserver'}).then((reply) => {
        ws.send(reply);
      });
    });
  });

  console.log('Webserver listening on http://localhost:' + config.port);
};
