import {Actuators} from "./actuators";

let noop = (): void => undefined;
let actuators: Actuators;

try {
  actuators = require('./actuators').actuators;
} catch(e) {
  console.error('Actuators could not be loaded:' + e);
  actuators = {
    turnFace: noop,
    setAlarm: noop,
    setFaceColor: noop,
    clearAlarm: noop
  }
}

import { sensors } from './sensors';

import { rtm } from './slack';
import { firebase } from './firebase';

import { dotw } from './dotw';

let devOfTheWeek = dotw(firebase.updateDOTWCycle);

firebase.initialize();

firebase.getDOTWData().then(result => {
  devOfTheWeek.initialize(result.devs, result.cycle, result.cron);
});

firebase.onActuatorsUpdate((actuatorData) => {
  console.log('updating actuators', JSON.stringify({
    alarm: actuatorData.alarm, 
    faceColor: actuatorData.faceColor, 
    faceDirection: actuatorData.faceDirection
  }));
  if (actuatorData.alarm) {
    actuators.setAlarm(actuatorData.alarm);
  } else {
    actuators.clearAlarm();
  }
  if (actuatorData.faceColor) {
    actuators.setFaceColor(actuatorData.faceColor.red || false, actuatorData.faceColor.green || false, actuatorData.faceColor.blue || false);
  }
  if (actuatorData.faceDirection) {
    actuators.turnFace(actuatorData.faceDirection);
  }
});

rtm.toString();
