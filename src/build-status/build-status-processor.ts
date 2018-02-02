import { FirebaseService } from '../services/firebase';
import { handleError } from '../utilities';
import { ExtractedBuildInfo } from './interfaces';

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
  incoming.orderByKey().limitToFirst(1).on('child_added', (evt) => {
    let buildData: any = evt.val();
    if (buildData.resource && buildData.resource.definition && buildData.resource.definition.name && buildData.resource.requests) {
      console.log('Incoming buildstatus for ' + buildData.resource.definition.name);
      let sourceGetVersion = buildData.resource.sourceGetVersion;
      let branch = sourceGetVersion.split(':')[1];
      if (branch && branch.startsWith('refs/heads/'))
      {
        branch = branch.substr('refs/heads/'.length);
      }
      let extracted: ExtractedBuildInfo = {
        definition: stripEmoji(buildData.resource.definition.name).replace(/[\s-\.]+/g, '-'),
        sourceGetVersion,
        branch,
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
      processed.child(`${extracted.definition}`).child(extracted.end.substr(0, extracted.end.indexOf('.'))).set(extracted);
    } else {
      console.error('Weird incoming buildstatus found ' + JSON.stringify(buildData));
    }
    evt.ref.remove().catch(handleError);
  });
};
