import {MessageLogic} from '../logic/message-logic';
import {ProgramLogic} from '../logic/program-logic';

export let rtm: any;

export interface SlackService {
  sendMessage(message: string): void;
  logDiagnostic(obj: any): void;
}

export let createSlackService = (token: string, messageLogic: MessageLogic, programLogic: ProgramLogic) => {
  let RtmClient = require('@slack/client').RtmClient;
  let CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

  rtm = new RtmClient(token);

  // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
  rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData: any) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  });

  let sendMessage = (message: string) => {
    rtm.sendMessage(message, 'G0R4BNJTB' /* Frontend-core */);
  };

  let logDiagnostic = (msg: any) => {
    rtm.sendMessage(JSON.stringify(msg, undefined, 2).replace('@', '☏'), 'C3T18HUF3' /* nai-diagnostics */);
  };

  // you need to wait for the client to fully connect before you can send messages
  rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log('connection opened');
    logDiagnostic({
      type: 'connected',
      address: programLogic.getIp()
    });
  });

  rtm.on('message', (messageData: any) => {
    console.log('Processing message ' + messageData.text);
    // console.log(JSON.stringify(messageData));
    messageLogic.process(messageData.text, {
      toMe: messageData.channel.substr(0, 1) === 'D',
      source: messageData.user
    }).then(reply => {
      if (reply) {
        rtm.sendMessage(reply, messageData.channel);
      }
    });
  });

  rtm.start();

  return {
    sendMessage,
    logDiagnostic
  };
};
