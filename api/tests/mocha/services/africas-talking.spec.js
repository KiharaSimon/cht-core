const chai = require('chai');
const sinon = require('sinon');
const config = require('../../../src/config');
const service = require('../../../src/services/africas-talking');
const lib = { SMS: { send: () => {} } };

describe('africas talking service', () => {

  beforeEach(() => {
    service._resetLib(lib);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('send', () => {

    it('forwards messages to lib', () => {
      sinon.stub(config, 'get').returns({ reply_to: '98765' });
      sinon.stub(lib.SMS, 'send').resolves({
        SMSMessageData: {
          Message: 'Sent to 1/1 Total Cost: KES 0.8000',
          Recipients: [{
            statusCode: 101,
            number: '+254711XXXYYY',
            status: 'Success',
            cost: 'KES 0.8000',
            messageId: 'ATPid_SampleTxnId123'  
          }]
        }
      });
      const given = [ { uuid: 'a', to: '+123', content: 'hello' } ];
      return service.send(given).then(actual => {
        chai.expect(lib.SMS.send.callCount).to.equal(1);
        chai.expect(lib.SMS.send.args[0][0]).to.deep.equal({
          to: [ '+123' ],
          from: '98765',
          message: 'hello'
        });
        chai.expect(actual).to.deep.equal([{
          messageId: 'a',
          gatewayRef: 'ATPid_SampleTxnId123',
          state: 'sent',
          details: 'Sent'
        }]);
        chai.expect(config.get.callCount).to.equal(1);
        chai.expect(config.get.args[0][0]).to.equal('sms');
      });
    });

    it('does not return status update for errors that should be retried', () => {
      sinon.stub(lib.SMS, 'send')
        // success
        .onCall(0).resolves({
          SMSMessageData: {
            Message: 'Sent to 1/1 Total Cost: KES 0.8000',
            Recipients: [{
              statusCode: 101,
              number: '+254711XXXYYY',
              status: 'Success',
              cost: 'KES 0.8000',
              messageId: 'abc'  
            }]
          }
        })
        // fatal error
        .onCall(1).rejects({
          SMSMessageData: {
            Message: 'Sent to 1/1 Total Cost: KES 0.8000',
            Recipients: [{
              statusCode: 403,
              number: '+254711XXXYYY',
              status: 'InvalidPhoneNumber',
              cost: 'KES 0.8000',
              messageId: 'def'  
            }]
          }
        })
        // temporary error - don't update state
        .onCall(2).rejects({
          SMSMessageData: {
            Message: 'Sent to 1/1 Total Cost: KES 0.8000',
            Recipients: [{
              statusCode: 500,
              number: '+254711XXXYYY',
              status: 'InternalServerError',
              cost: 'KES 0.8000',
              messageId: 'ghi'  
            }]
          }
        });
      const given = [
        { uuid: 'a', to: '+123', content: 'hello' },
        { uuid: 'b', to: '+456', content: 'hello' },
        { uuid: 'c', to: '+789', content: 'hello' }
      ];
      return service.send(given).then(actual => {
        chai.expect(lib.SMS.send.callCount).to.equal(3);
        chai.expect(actual).to.deep.equal([
          {
            messageId: 'a',
            gatewayRef: 'abc',
            state: 'sent',
            details: 'Sent'
          },
          {
            messageId: 'b',
            gatewayRef: 'def',
            state: 'failed',
            details: 'InvalidPhoneNumber'
          }
        ]);
      });
    });

    it('an invalid response is ignored so it will be retried', () => {
      sinon.stub(lib.SMS, 'send').rejects('Unknown error');
      const given = [ { uuid: 'a', to: '+123', content: 'hello' } ];
      return service.send(given).then(actual => {
        chai.expect(lib.SMS.send.callCount).to.equal(1);
        chai.expect(actual.length).to.equal(0);
      });
    });

    // TODO call lib with "from" of configured shortcode
  });

});