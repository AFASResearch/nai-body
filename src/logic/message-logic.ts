import {ProgramLogic, programLogic} from './program-logic';

export interface MessageLogic {
  process(message: string, options: { toMe?: boolean }): Promise<string | undefined>;
}

export let createMessageLogic = (config: { getTemperature: () => number | undefined, aboutLogic: ProgramLogic }): MessageLogic => {
  let {getTemperature, aboutLogic} = config;

  let temperatureSynonyms = ['temperature', 'temp', 'warm', 'cold', 'hot', 'temperatuur', 'koud', 'heet', 'warm'];
  let temperatureQuestionWords = ['is', 'hoe', 'hoog'];

  let process = async (message: string, options: { toMe?: true }): Promise<string | undefined> => {
    let { toMe } = options;
    let words = message.toLocaleLowerCase().split(/\W+/g);
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
        case 'shutdown':
          programLogic.shutdown();
          return 'Goodbye cruel world';
        case 'reboot':
          programLogic.reboot();
          return 'Back in a sec';
        case 'update':
          setTimeout(programLogic.update, 100);
          return 'More AI is on its way';
      }
      return 'Sorry, I don\'t understand, I am just a robot.'
    }

    return undefined;
  };

  return {
    process
  };
};
