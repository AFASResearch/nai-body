import { Gpio } from 'onoff';
import * as raspi from 'raspi';
import { PWM } from 'raspi-pwm';

let leftEar = new Gpio(17 /*0*/, 'out');
let rightEar = new Gpio(27 /*1*/, 'out');

let neckServo: PWM;
raspi.init(() => {
  neckServo = new PWM({pin: 12 /* GPIO18 */, });
  neckServo.write(72);
});


let redFace = new Gpio(22 /*3*/, 'out');
let greenFace = new Gpio(23 /*4*/, 'out');
let blueFace = new Gpio(24 /*5*/, 'out');

let alarmInterval: number | undefined;
let currentEar = leftEar;

let logErr = (err?: Object) => {
  if (err) {
    console.error(err);
  }
};

let rest = function() {
  leftEar.write(0, logErr);
  rightEar.write(0, logErr);
  currentEar = leftEar;
};

let step = function() {
  currentEar.write(0, logErr);
  currentEar = currentEar === leftEar ? rightEar : leftEar;
  currentEar.write(1, logErr);
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
  },

  setFaceColor: (red: boolean, green: boolean, blue: boolean) => {
    redFace.write(red ? 1 : 0, logErr);
    greenFace.write(green ? 1 : 0, logErr);
    blueFace.write(blue ? 1 :0, logErr);
  },

  turnFace: (direction: number /* 0 - 180 */) => {
    neckServo.write(direction);
  }

};
