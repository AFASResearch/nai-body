let Gpio: any = require('pigpio').Gpio;

interface GpioPin {
  digitalWrite(level: 0|1): void;
  /**
   * @param pulseWidth Starts servo pulses at 50Hz on the GPIO, 0 (off), 500 (most anti-clockwise) to 2500 (most clockwise)
   */
  servoWrite(pulseWidth: number): void;
}

let leftEar: GpioPin = new Gpio(17, {mode: Gpio.OUTPUT});
let rightEar: GpioPin = new Gpio(27, {mode: Gpio.OUTPUT});

let neckServo: GpioPin = new Gpio(18, {mode: Gpio.OUTPUT});

let redFace: GpioPin = new Gpio(22, {mode: Gpio.OUTPUT});
let greenFace: GpioPin = new Gpio(23, {mode: Gpio.OUTPUT});
let blueFace: GpioPin = new Gpio(24, {mode: Gpio.OUTPUT});

let alarmInterval: number | undefined;
let currentEar = leftEar;

let logErr = (err?: Object) => {
  if (err) {
    console.error(err);
  }
};

let rest = function() {
  leftEar.digitalWrite(0);
  rightEar.digitalWrite(0);
  currentEar = leftEar;
};

let step = function() {
  currentEar.digitalWrite(0);
  currentEar = currentEar === leftEar ? rightEar : leftEar;
  currentEar.digitalWrite(1);
};

rest();

export let actuators = {

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

  setFaceColor: (red: boolean, green: boolean, blue: boolean) => {
    redFace.digitalWrite(red ? 1 : 0);
    greenFace.digitalWrite(green ? 1 : 0);
    blueFace.digitalWrite(blue ? 1 :0);
  },

  turnFace: (direction: number /* 0 - 180 */) => {
    neckServo.servoWrite(1000 + Math.round((1000 * direction / 180)));
  }

};

export type Actuators = typeof actuators;
