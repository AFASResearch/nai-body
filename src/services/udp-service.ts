import * as dgram from 'dgram';

export interface MessageProcessor {
  process(words: string[]): string | undefined;
}

export interface UdpConfig {
  synonyms: {[index: string] : string[]};
  commands: UdpCommand[];
}

export interface UdpCommand {
  words: string[];
  packetIp: string;
  packetPort: number;
  packetContents: string; // comma delimited double octets
}

export let createUdpService = (config: UdpConfig): MessageProcessor => {
  let { synonyms, commands } = config;
  return {
    process: (words: string[]): string | undefined => {
      if (words.length > 10) {
        return undefined;
      }
      words = words.map(word => {
        let result = word;
        Object.keys(synonyms).forEach(normalizedWord => {
          if (synonyms[normalizedWord].indexOf(word) !== -1) {
            result = normalizedWord;
          }
        });
        return result;
      });
      for (let command of commands) {
        if (command.words.every(commandWord => words.indexOf(commandWord) !== -1)) {
          let array = command.packetContents.split(',').map(doubleOctet => parseInt(doubleOctet, 16));
          let typedArray = new Uint8Array(array);
          let message = new Buffer(typedArray);
          let client = dgram.createSocket('udp4');
          client.send(message, command.packetPort, command.packetIp, (err, bytes) => {
            if (err) {
              console.log('udp', err.toString());
            }
            console.log('udp packet sent');
            client.close();
          });
          return 'Ok';
        }
      };
      return undefined;
    }
  }
};