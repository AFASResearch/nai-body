import {createMessageLogic, MessageLogic} from '../../src/logic/message-logic';
import {expect} from 'chai';

describe('messageLogic', () => {
  let createLogic = (): MessageLogic => createMessageLogic({
    getTemperature: () => 12.34, aboutLogic: {
      getIp: () => '::1', shutdown: () => undefined, reboot: () => undefined, update: () => undefined
    }
  });

  it('responds with the temperature', async () => {
    let logic = createLogic();
    let reply = await logic.process('What is the temperature?', {toMe:false, source: ''});
    expect(reply).to.equal('It is 12.3 °C');
  });

  it('knows when it is adressed directly', async () => {
    let logic = createLogic();
    let reply = await logic.process('dance you', {toMe:false, source: ''});
    expect(reply).to.be.undefined;
    reply = await logic.process('dance @nai', {toMe:false, source: ''});
    expect(reply).to.not.be.undefined;
  })
});
