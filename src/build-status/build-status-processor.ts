import { FirebaseService } from '../services/firebase';

let stripEmoji = (line: string) => {
  if (line.length > 3 && line.charAt(line.length - 3) === ' ') {
    console.log(line);
    return line.substr(0, line.length - 3);
  }
  return line;
};

export let createBuildStatusProcessor = (config: {firebase: FirebaseService}) => {
  let { firebase } = config;
  let incoming = firebase.getBuildStatus().child('incoming');
  let processed = firebase.getBuildStatus().child('processed');
  console.log('Monitoring incoming buildstatuses');
  ['frontend', 'runtime', 'architecture'].forEach(project => {
    let projectRef = incoming.child(project);
    projectRef.orderByKey().limitToFirst(1).on('child_added', (evt) => {
      console.log('Incoming buildstatus for ' + project);
      let buildData: any = evt.val();
      let extracted = {
        definition: stripEmoji(buildData.resource.definition.name).replace(/[\s-\.]+/g, '-'),
        success: buildData.resource.status === 'succeeded',
        triggeredBy: buildData.resource.requests.map((req: any) => ({
          fullName: req.requestedFor.displayName,
          login: req.requestedFor.uniqueName.split('\\')[1]
        })),
        start: buildData.resource.startTime,
        end: buildData.resource.finishTime // used as key
      };
      extracted.triggeredBy.forEach((trigger: any) => {
        if (!trigger.login) {
          delete trigger.login;
        }
      });
      console.log(JSON.stringify(extracted));
      processed.child(`${project}-${extracted.definition}`).child(extracted.end.substr(0, extracted.end.indexOf('.'))).set(extracted);
    });
  });
};
