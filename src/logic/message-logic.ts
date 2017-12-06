import {ProgramLogic, programLogic} from './program-logic';
import { MessageProcessor } from '../services/udp-service';

export interface MessageLogic {
  process(message: string, options: { toMe?: boolean, source: any }): Promise<string | undefined>;
  registerDiagnosticLogger(logger: (msg: any) => void): void;
  registerBeforeExit(callback: () => void): void;
}

export let createMessageLogic = (config: { getTemperature: () => number | undefined, aboutLogic: ProgramLogic, processors: MessageProcessor[] }): MessageLogic => {
  let {getTemperature, aboutLogic, processors} = config;
  let diagnosticLogger = (msg: any) => undefined as void;
  let beforeExit = () => undefined as void;

  let temperatureSynonyms = ['temperature', 'temp', 'warm', 'cold', 'hot', 'temperatuur', 'koud', 'heet', 'warm'];
  let temperatureQuestionWords = ['is', 'hoe', 'hoog'];

  let process = async (message: string, options: { toMe?: boolean, source: string }): Promise<string | undefined> => {
    let { toMe, source } = options;
    let words = message.toLocaleLowerCase().split(/\W+/g);
    if (!toMe && words.indexOf('nai') !== -1) {
      toMe = true;
      words = words.filter(word => word !== 'nai');
    }
    if (toMe) {
      for (let processor of processors) {
        let result = processor.process(words);
        if (result) {
          return result;
        }
      }
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
        return `According to my sensors, it is ${getTemperature().toFixed(1)} °C`;
      }
    }

    if (toMe) {
      if (findWords(['location', 'adres', 'address', 'ip']) || (isQuestion && findWords(['waar', 'where']))) {
        return `I am at ${aboutLogic.getIp()}`
      }
      let match = /shut ?down\W?(\w*)$/.exec(message);
      if (match) {
        if (!match[1]) {
          return 'You forgot the magic word';
        }
        if (match[1].toUpperCase().charCodeAt(0) === new Date().toString().charCodeAt(0)) {
          beforeExit();
          programLogic.shutdown();
          return 'Goodbye cruel world';
        } else {
          return 'Sorry, try again';
        }
      }
      switch (message.toLowerCase()) {
        case 'reboot':
          beforeExit();
          programLogic.reboot();
          return 'Back in a sec';
        // case 'terminate':
        //   beforeExit();
        //   programLogic.terminate();
        //   return 'Bye';
        case 'updates':
        case 'update':
          beforeExit();
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
    registerDiagnosticLogger: (logger) => { diagnosticLogger = logger; },
    registerBeforeExit: (callback) => { beforeExit = callback; }
  };
};
