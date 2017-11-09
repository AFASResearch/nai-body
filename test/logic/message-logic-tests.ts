import {createMessageLogic} from '../../src/logic/message-logic';
import {expect} from 'chai';

describe('messageLogic', () => {
  it('responds with the temperature', async () => {
    let logic = createMessageLogic({getTemperature: () => 12.34, aboutLogic: { getIp: () => '::1'}});
    let reply = await logic.process('What is the temperature?', {toMe:false});
    expect(reply).to.equal('It is 12.3 °C');
  });
});
