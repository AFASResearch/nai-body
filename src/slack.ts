import {MessageLogic} from './logic/message-logic';

export let rtm: any;

export interface SlackService {
  sendMessage(message: string): void;
}

export let createSlackService = (token: string, messageLogic: MessageLogic) => {
  let RtmClient = require('@slack/client').RtmClient;
  let CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

  rtm = new RtmClient(token);

  // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
  rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData: any) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  });

  // you need to wait for the client to fully connect before you can send messages
  rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    console.log('connection opened');
  });

  rtm.on('message', (messageData: any) => {
    console.log('Processing message ' + messageData.text);
    // console.log(JSON.stringify(messageData));
    messageLogic.process(messageData.text, {toMe: messageData.channel.substr(0, 1) === 'D'}).then(reply => {
      if (reply) {
        rtm.sendMessage(reply, messageData.channel);
      }
    });
  });

  rtm.start();

  return {
    sendMessage: (message: string) => {
      rtm.sendMessage(message, 'G0R4BNJTB' /* Frontend-core */);
    }
  };
};