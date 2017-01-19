import {Actuators} from "./actuators";

let noop = (): void => undefined;

let actuators: Actuators;

try {
  actuators = require('./actuators');
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

firebase.initialize();

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