/**
 * Dev of the week
 */

let cron = require('node-cron');

interface Developers {
  index: {
    slackId: string;
  }
}

interface Cycle {
  current: string;
  past: string[];
  next: string[];
}

export let dotw = (slackBotToken: string, updateData:(cycle:Cycle) => void) => {
  let cycle:Cycle;
  let developers: any;
  let WebClient = require('@slack/client').WebClient;

  let web = new WebClient(slackBotToken);

  let chooseNewDevOfTheWeek = function () {
    if (!cycle.next.length) {
      cycle.next = Object.keys(developers);
      cycle.past = [];
    } else {
      cycle.past.push(cycle.current);
    }
    cycle.current = cycle.next.shift();
    updateData(cycle);
    return cycle.current;
  };

  let start = (cronTime: string) => {
    cron.schedule(cronTime, function () {
      let newDev = chooseNewDevOfTheWeek();

      web.groups.setTopic('G3DBUKF0Q', `Dev of the week @${newDev}`);
      //let devsSlackId = developers[newDev].slackId;
      //web.chat.postMessage(devsSlackId, 'Je bent komende week dev of the week.', (err: any, res: any) => {
      //  if (err) {
      //    console.log('Error:', err);
      //  } else {
      //    console.log('Message sent: ', res);
      //  }
      //})
    });

  };

  let initialize = (loadedDevelopers:Developers, loadedCycle:Cycle, cron: string) => {
    cycle = loadedCycle;
    developers = loadedDevelopers;
    start(cron);
  };

  return {
    initialize,
    chooseNewDevOfTheWeek
  }
};