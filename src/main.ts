import { actuators } from './actuators';
import { sensors } from './sensors';

import { firebase } from './firebase';

firebase.initialize();

firebase.onActuatorsUpdate((actuatorData) => {
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
