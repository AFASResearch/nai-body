export let rtm: any;

if (process.env.SLACK_BOT_TOKEN) {
  var RtmClient = require('@slack/client').RtmClient;
  var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

  var bot_token = process.env.SLACK_BOT_TOKEN || '';

  rtm = new RtmClient(bot_token);

  // The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
  rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData: any) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  });

  // you need to wait for the client to fully connect before you can send messages
  rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
    rtm.sendMessage("Hello from nao-body!", 'G0R4BNJTB');
  });

  rtm.start();
} else {
  console.warn('Not connecting to slack because SLACK_BOT_TOKEN environment variable is missing');
  rtm = {};
}