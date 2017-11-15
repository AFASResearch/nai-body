import { FirebaseService } from '../services/firebase';

export let createBuildStatusProcessor = (config: {firebase: FirebaseService}) => {
  let {firebase} = config;
  firebase.getBuildStatus().child('incoming').on('child_added', (evt) => {
    let buildData: any = evt.val();
    let processed = {
      definition: buildData.resource.definition.name,
      success: buildData.resource.status === 'succeeded',
      triggeredBy: buildData.resource.requests.map((req: any) => ({fullName: req.requestedFor.displayName, login: req.requestedFor.uniqueName.split('\\')[1]}))
    };
    console.log(JSON.stringify(processed))
  });
};
