import * as admin from 'firebase-admin';
import {app, database} from 'firebase';

let onerror = (error: any) => {
  console.error(error);
};

let fbapp: app.App;

export interface ActuatorData {
  /**
   * undefined or 0 means off,
   * a value > 0 means the nr of milliseconds for the alarm interval
   */
  alarm?: number;

  faceColor?: {
    red?: boolean;
    green?: boolean;
    blue?: boolean;
  },

  faceDirection?: number;
}

export interface SensorData {
  temperature: number;
}

let lastSensorData: SensorData | undefined;
let sensorsChanged = (sensorData: SensorData) => {
  let result = false;
  if (!lastSensorData || sensorData.temperature !== lastSensorData.temperature) {
    result = true;
  }
  lastSensorData = sensorData;
  return result;
};

export let firebase = {
  initialize: () => {
    let serviceAccount: any;

    if (process.env.NAI_BODY_KEY) {
      serviceAccount = JSON.parse(process.env.NAI_BODY_KEY);
    }

    if (!serviceAccount) {
      try {
        // Not in source control
        serviceAccount = require('../nai-body-key.json');
      } catch (e) {
        console.error('Firebase credentials are not configured, please provide firebase service account private key ' +
          'in environment variable NAI_BODY_KEY or file ./nai-body-key.json');
        process.exit(1);
      }
    }

    console.log(`connecting to https://${serviceAccount.project_id}.firebaseio.com/nai ....`);

    fbapp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    }) as Object as app.App;

    let connectedRef = fbapp.database().ref('.info/connected');
    connectedRef.on('value', function(snap) {
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
          since: database.ServerValue.TIMESTAMP
        })
      }).then(() => {
      console.log('connection registered');
    }).catch(onerror);
  },

  onActuatorsUpdate: (callback: (actuators: ActuatorData) => void) => {
    fbapp.database().ref('nai/actuators').on('value', (snapshot) => {
      callback(snapshot.val());
    });
  },

  publishSensors: (sensors: SensorData): void => {
    if (sensorsChanged(sensors)) {
      fbapp.database().ref('nai/sensors').set(sensors);
    }
  }
};
