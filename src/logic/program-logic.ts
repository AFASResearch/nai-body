import {networkInterfaces} from 'os';
import {spawn} from 'child_process';

export let programLogic = {
  getIp: () => {
    let interfaces = networkInterfaces();
    let addresses: string[] = [];
    for (let k in interfaces) {
      for (let k2 in interfaces[k]) {
        let address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address);
        }
      }
    }
    return addresses.join(' ');
  },
  shutdown: () => {
    let install = spawn('shutdown', ['-h', 'now'], { stdio: 'ignore', shell: true, detached: true, cwd: process.cwd() });
    install.unref();
  },
  reboot: () => {
    let install = spawn('shutdown', ['-r', 'now'], { stdio: 'ignore', shell: true, detached: true, cwd: process.cwd() });
    install.unref();
  },
  update: () => {
    let install = spawn('git', ['pull'], { stdio: 'ignore', shell: true, detached: true, cwd: process.cwd() });
    install.unref();
    process.exit(0);
  },
};

export type ProgramLogic = typeof programLogic;