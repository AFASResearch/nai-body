import {rtm} from './slack';
import {firebase} from './services/firebase';
import {dotw} from './dotw';
import {createGpioService, GpioService} from './services/gpio';
import {createMicroBitService, MicroBitService} from './services/microBit';
import {createFake} from './utilities';
import {Actuators, createActuators} from './actuators';

let config: any = require('../local-config.json');

let gpioService: GpioService;
let microBitService: MicroBitService;

try {
  gpioService = createGpioService();
} catch (e) {
  console.error('GpioService could not be loaded:' + e);
  gpioService = {
    lightEar: createFake('lightEar')
  }
}

try {
  microBitService = createMicroBitService(config.microBitSerialPort);
} catch (e) {
  console.error('MicroBitService could not be loaded' + e);
  microBitService = {
    onValueReceived: () => undefined,
    sendCommand: createFake('sendCommand')
  };
}

let actuators: Actuators = createActuators({gpio: gpioService, microBit: microBitService});

let devOfTheWeek = dotw(firebase.updateDOTWCycle);

firebase.initialize();

firebase.getDOTWData().then(result => {
  devOfTheWeek.initialize(result.devs, result.cycle, result.cron);
});

firebase.onActuatorsUpdate((actuatorData) => {
  console.log('updating actuators', JSON.stringify({
    alarm: actuatorData.alarm,
    faceEmotion: actuatorData.faceEmotion,
    faceDirection: actuatorData.faceDirection
  }));
  if (actuatorData.alarm) {
    actuators.setAlarm(actuatorData.alarm);
  } else {
    actuators.clearAlarm();
  }
  if (actuatorData.faceEmotion) {
    actuators.setFaceEmotion(actuatorData.faceEmotion);
  }
  if (actuatorData.faceDirection) {
    // actuators.turnFace(actuatorData.faceDirection);
  }
});

let lastReportedTemperature = 0;
let lastReportedTimestamp = 0;

microBitService.onValueReceived('temperature', (value: number) => {
  let temperature = value / 10;
  let timestamp = new Date().getTime();
  let delta = timestamp - lastReportedTimestamp;
  if (Math.abs(lastReportedTemperature - temperature) * (delta / (1000 * 60)) > 1) { // 1 degree 1 minute
    firebase.publishSensors({ temperature });
    lastReportedTemperature = temperature;
    lastReportedTimestamp = timestamp;
  }
});

// sensors.onTemperatureChange((temperature: number) => {
//   firebase.publishSensors({temperature: temperature});
// });

rtm.toString();
