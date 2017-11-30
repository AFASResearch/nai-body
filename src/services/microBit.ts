import {handleError} from '../utilities';

export interface MicroBitService {
  sendCommand(command: string): void;
  onValueReceived(name: string, callback: (value: number) => void): void;
  quit(): void;
}

/**
 * We send to the micro bit over serial port using usb. Sending as comma separated strings
 * receive as newline separated keyvalue pairs
 *
 * @param serialPort ex: /dev/ttyACM0 or /dev/cu.usbmodem1422
 */
export let createMicroBitService = (serialPort: string): MicroBitService => {
  let SerialPort = require('serialport');
  let port = new SerialPort(serialPort, {
    baudRate: 115200
  }, handleError);
  let receivers: {[name: string]: ((value: number) => void)[] } = {};
  let buffer = '';

  let processLine = (line: string) => {
    // console.log('Processing line ' + line);
    let keyValue = line.split(':');
    if (keyValue.length !== 2) {
      console.error('Strange line ' + line);
    } else {
      let valueReceivers = receivers[keyValue[0]];
      if (valueReceivers) {
        let value = parseInt(keyValue[1], 10);
        valueReceivers.forEach(vr => vr(value));
      }
    }
  };

  port.on('data', (bytes: Uint8Array) => {
    let data: string = String.fromCharCode.apply(null, bytes);
    while (data.indexOf('\n') >= 0) {
      let line = buffer + data.substr(0, data.indexOf('\n'));
      data = data.substr(data.indexOf('\n') + 1);
      processLine(line);
      buffer = '';
    }
    buffer += data;
  });
  port.on('error', handleError);
  return {
    sendCommand: (command: string) => {
      port.write(command + ',', 'ascii', handleError);
    },
    onValueReceived: (name: string, callback) => {
      let valueReceivers = receivers[name];
      if (!valueReceivers) {
        valueReceivers = receivers[name] = [];
      }
      valueReceivers.push(callback);
    },
    quit: () => {
      port.write('exit,', 'ascii', handleError);
    }
  }
};
