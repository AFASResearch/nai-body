import {networkInterfaces} from 'os';
import {spawn} from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let updateFileContents = `
console.log('Updating to latest version, please wait...');
const child_process = require('child_process');
try {
  child_process.execSync('git pull', { cwd: process.cwd(), encoding: 'UTF-8', stdio: [0, 1, 2] });
  child_process.execSync('node index.js', { cwd: process.cwd(), encoding: 'UTF-8', stdio: [0, 1, 2] });
} catch (e) {
  console.error('update failed', e);
  console.log('Press enter to continue');
  process.stdin.once('data', function(){
    process.exit(1);
  });
}`;

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
    fs.writeFileSync(path.join(process.cwd(), 'build', 'update.js'), updateFileContents);
    let install = spawn('node', ['build/update.js'], { stdio: 'ignore', shell: true, detached: true, cwd: process.cwd() });
    install.unref();
    process.exit(0);
  },
};

export type ProgramLogic = typeof programLogic;