export interface GpioService {
  lightEar(which: undefined | 1 | 2): void;
}

export let createGpioService = (): GpioService => {
  let Gpio: any = require('pigpio').Gpio;

  interface GpioPin {
    digitalWrite(level: 0 | 1): void;

    /**
     * @param pulseWidth Starts servo pulses at 50Hz on the GPIO, 0 (off), 500 (most anti-clockwise) to 2500 (most clockwise)
     */
    servoWrite(pulseWidth: number): void;
  }

  let leftEar: GpioPin = new Gpio(17, {mode: Gpio.OUTPUT});
  let rightEar: GpioPin = new Gpio(27, {mode: Gpio.OUTPUT});

  return {
    lightEar: (which) => {
      leftEar.digitalWrite(which === 1 ? 1 : 0);
      rightEar.digitalWrite(which === 2 ? 1 : 0);
    }
  }
};

