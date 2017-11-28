import {Gpio} from 'onoff';

export interface GpioService {
  lightEar(which: undefined | 1 | 2): void;
}

export let createGpioService = (): GpioService => {

  let leftEar = new Gpio(17, 'out');
  let rightEar = new Gpio(17, 'out');

  return {
    lightEar: (which) => {
      leftEar.writeSync(which === 1 ? 1 : 0);
      rightEar.writeSync(which === 2 ? 1 : 0);
    }
  }
};

