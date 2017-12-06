import {createSlackService, SlackService} from './services/slack';
import {createFirebaseService, FirebaseService} from './services/firebase';
import {dotw} from './dotw';
import {createMicroBitService, MicroBitService} from './services/microBit';
import {createFake} from './utilities';
import {Actuators, createActuators} from './actuators';
import {createMessageLogic} from './logic/message-logic';
import {programLogic} from './logic/program-logic';
import { createBuildStatusProcessor } from './build-status/build-status-processor';
import { startWebserver } from './webserver';
import {GpioService} from './services/gpio';
import { createUdpService, MessageProcessor } from './services/udp-service';

let config: any = require('../local-config.json');

let gpioService: GpioService;
let microBitService: MicroBitService;
let slackService: SlackService;
let firebaseService: FirebaseService;

let temperature: number | undefined;

let processors: MessageProcessor[] = [];

if (config.udp) {
  processors.push(createUdpService(config.udp));
}

let messageLogic = createMessageLogic({
  getTemperature: () => temperature,
  aboutLogic: programLogic,
  processors
});

gpioService = {
  lightEar: createFake('gpioService.lightEar')
};
if (config.gpio) {
  try {
    gpioService = require('./services/gpio').createGpioService();
  } catch (e) {
    console.error('GpioService could not be loaded:' + e);
  }
}

try {
  if (!config.microBitSerialPort) {
    throw new Error('localConfig did not contain microBitSerialPort');
  }
  microBitService = createMicroBitService(config.microBitSerialPort);
  microBitService.sendCommand('away'); // webservice not yet connected
  messageLogic.registerBeforeExit(microBitService.quit);
} catch (e) {
  console.error('MicroBitService could not be loaded' + e);
  microBitService = {
    onValueReceived: () => undefined,
    sendCommand: createFake('microBitService.sendCommand'),
    quit: createFake('microBitService.quit')
  };
}

if (config.slackBotToken) {
  slackService = createSlackService(config.slackBotToken, messageLogic, programLogic);
  messageLogic.registerDiagnosticLogger(slackService.logDiagnostic);
} else {
  slackService = {
    sendMessage: createFake('slackService.sendMessage'),
    logDiagnostic: createFake('slackService.logDiagnostic')
  }
}

if (config.firebase) {
  firebaseService = createFirebaseService(config.firebase, programLogic);

  if (config.slackBotToken) {
    let devOfTheWeek = dotw(config.slackBotToken, firebaseService.updateDOTWCycle);

    firebaseService.getDOTWData().then((result: any) => {
      devOfTheWeek.initialize(result.devs, result.cycle, result.cron);
    });
  }
} else {
  firebaseService = {
    getDOTWData: () => undefined,
    onActuatorsUpdate: () => undefined,
    publishSensors: createFake('firebaseService.publishSensors'),
    updateDOTWCycle: () => undefined,
    getDOTWcycle: () => undefined,
    getBuildStatus: () => ({child: () => ({ on: () => false } as any)}) as any
  }
}

let actuators: Actuators = createActuators({gpio: gpioService, microBit: microBitService});

firebaseService.onActuatorsUpdate((actuatorData) => {
  console.log('updating actuators', JSON.stringify({
    alarm: actuatorData.alarm,
    faceDirection: actuatorData.faceDirection
  }));
  if (actuatorData.alarm) {
    actuators.setAlarm(actuatorData.alarm);
  } else {
    actuators.clearAlarm();
  }
  if (actuatorData.faceDirection) {
    // actuators.turnFace(actuatorData.faceDirection);
  }
});

let lastReportedTemperature = 0;
let lastReportedTimestamp = 0;

microBitService.onValueReceived('temperature', (value: number) => {
  temperature = value / 10;
  let timestamp = new Date().getTime();
  let delta = timestamp - lastReportedTimestamp;
  if (Math.abs(lastReportedTemperature - temperature) * (delta / (1000 * 60)) > 1) { // 1 degree 1 minute
    firebaseService.publishSensors({ temperature });
    lastReportedTemperature = temperature;
    lastReportedTimestamp = timestamp;
  }
});

if (config.webserver) {
  let server = startWebserver(config.webserver, {messageLogic, microBit: microBitService});
  programLogic.beforeShutdown(server.stop);
}

// createBuildStatusProcessor({firebase: firebaseService});
