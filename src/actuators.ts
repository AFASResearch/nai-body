import {GpioService} from './services/gpio';
import {MicroBitService} from './services/microBit';

let alarmInterval: number | undefined;
let currentEar: 1 | 2 = 1;

export interface Actuators {
  setAlarm: (interval: number) => void;
  clearAlarm: () => void;
  setFaceEmotion: (emotion: string) => void;
}

export let createActuators = (services: {gpio: GpioService, microBit: MicroBitService}): Actuators => {
  let {gpio, microBit} = services;

  let rest = function() {
    gpio.lightEar(undefined);
    currentEar = 2;
  };

  let step = function() {
    currentEar = currentEar === 1 ? 2 : 1;
    gpio.lightEar(currentEar);
  };

  rest();

  return {

    setAlarm: (interval: number) => {
      if (alarmInterval) {
        clearInterval(alarmInterval);
      }
      alarmInterval = setInterval(step, interval) as any;
    },

    clearAlarm: () => {
      if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = undefined;
      }
      rest();
    },

    setFaceEmotion: (emotion: string) => {
      microBit.sendCommand(emotion);
    }
  };
};
