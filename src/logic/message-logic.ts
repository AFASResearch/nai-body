import {ProgramLogic, programLogic} from './program-logic';

export interface MessageLogic {
  process(message: string, options: { toMe?: boolean, source: any }): Promise<string | undefined>;
  registerDiagnosticLogger(logger: (msg: any) => void): void;
}

export let createMessageLogic = (config: { getTemperature: () => number | undefined, aboutLogic: ProgramLogic }): MessageLogic => {
  let {getTemperature, aboutLogic} = config;
  let diagnosticLogger = (msg: any) => undefined as void;

  let temperatureSynonyms = ['temperature', 'temp', 'warm', 'cold', 'hot', 'temperatuur', 'koud', 'heet', 'warm'];
  let temperatureQuestionWords = ['is', 'hoe', 'hoog'];

  let process = async (message: string, options: { toMe?: boolean, source: string }): Promise<string | undefined> => {
    let { toMe, source } = options;
    let words = message.toLocaleLowerCase().split(/\W+/g);
    if (!toMe && words.indexOf('nai') !== -1) {
      toMe = true;
      words = words.filter(word => word !== 'nai');
    }
    let findWord = (word: string) => words.indexOf(word) !== -1;
    let findWords = (needles: string[]) => needles.some(findWord);
    let isQuestion = message.endsWith('?');

    if (findWords(temperatureSynonyms)) {
      if (toMe || words.length <= 2 || (findWords(temperatureQuestionWords) && words.length <= 8)) {
        let temp = getTemperature();
        if (temp === undefined) {
          return 'I don\'t know';
        }
        return `It is ${getTemperature().toFixed(1)} °C`;
      }
    }

    if (toMe) {
      if (findWords(['location', 'adres', 'address', 'ip']) || (isQuestion && findWords(['waar', 'where']))) {
        return `I am at ${aboutLogic.getIp()}`
      }
      switch (message.toLowerCase()) {
        case 'shut down':
        case 'shutdown':
          programLogic.shutdown();
          return 'Goodbye cruel world';
        case 'reboot':
          programLogic.reboot();
          return 'Back in a sec';
        case 'terminate':
          programLogic.terminate();
          return 'Bye';
        case 'update':
          setTimeout(programLogic.update, 100);
          return 'More AI is on its way';
      }
      if (source === 'webserver') {
        return undefined; // Lets the reply come from Google Assistant, because we do not understand it here
      }
      return 'Sorry, I don\'t understand, I am just a robot.'
    }

    return undefined;
  };

  return {
    process: (msg, options) => {
      return process(msg, options).then(reply => {
        diagnosticLogger({ msg, options, reply });
        return reply;
      })
    },
    registerDiagnosticLogger: (logger) => { diagnosticLogger = logger; }
  };
};
