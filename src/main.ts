import { actuators } from './actuators';
import { sensors } from './sensors';

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
