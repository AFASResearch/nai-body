import {app, database} from 'firebase';
import {handleError} from '../utilities';
import {ProgramLogic} from '../logic/program-logic';

const admin: any = require('firebase-admin');

export interface FirebaseService {
  onActuatorsUpdate(callback: (actuators: ActuatorData) => void): void;
  getDOTWData() : any;
  updateDOTWCycle(cycle: any): void;
  getDOTWcycle(): any;
  publishSensors(sensors: SensorData): void;
  getBuildStatus(): database.Reference
}

export interface ActuatorData {
  /**
   * undefined or 0 means off,
   * a value > 0 means the nr of milliseconds for the alarm interval
   */
  alarm?: number;

  faceDirection?: number;
}

export interface SensorData {
  temperature: number;
}

export let createFirebaseService = (serviceAccount: any, aboutLogic: ProgramLogic): FirebaseService => {

  let fbapp: app.App;

  let lastSensorData: SensorData | undefined;
  let sensorsChanged = (sensorData: SensorData) => {
    let result = false;
    if (!lastSensorData || sensorData.temperature !== lastSensorData.temperature) {
      result = true;
    }
    lastSensorData = sensorData;
    return result;
  };

  console.log(`connecting to https://${serviceAccount.project_id}.firebaseio.com/nai ....`);

  fbapp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  }) as Object as app.App;

  let connectedRef = fbapp.database().ref('.info/connected');
  connectedRef.on('value', function (snap) {
    if (snap.val() === true) {
      console.log('firebase connected');
    } else {
      console.log('firebase disconnected');
    }
  });

  fbapp.database().ref('nai/body')
    .onDisconnect().remove()
    .then(() => {
      return fbapp.database().ref('nai/body').set({
        registered: true,
        since: database.ServerValue.TIMESTAMP,
        address: aboutLogic.getIp()
      })
    }).then(() => {
    console.log('connection registered');
  }).catch(handleError);

  return {
    onActuatorsUpdate: (callback: (actuators: ActuatorData) => void) => {
      fbapp.database().ref('nai/actuators').on('value', (snapshot) => {
        callback(snapshot.val());
      });
    },

    getDOTWData: () => {
      return fbapp.database().ref('nai/dotw/').once('value').then((snapshot) => {
        let data = snapshot.val();
        let cycle = {
          current: data.cycle.current,
          next: data.cycle.next ? data.cycle.next.split(',') : [],
          past: data.cycle.past ? data.cycle.past.split(',') : []
        };
        return {
          devs: data.devs,
          cycle,
          cron: data.cron
        };
      });
    },

    updateDOTWCycle: (cycle: any): void => {
      let data = {
        current: cycle.current,
        next: cycle.next.join(','),
        past: cycle.past.join(',')
      };
      fbapp.database().ref('nai/dotw/cycle').set(data);
    },

    getDOTWcycle: () => {
      return fbapp.database().ref('nai/dotw/cycle').once('value').then((snapshot) => {
        return snapshot.val();
      });
    },

    publishSensors: (sensors: SensorData): void => {
      if (sensorsChanged(sensors)) {
        fbapp.database().ref('nai/sensors').set(sensors);
      }
    },

    getBuildStatus: () => {
      return fbapp.database().ref('buildStatus');
    }
  };
};
