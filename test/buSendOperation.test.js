'use strict';
require('dotenv').config({path: ".env"});
require('chai').should();
const ZtxChainSDK = require('../index');


const sdk = new ZtxChainSDK({
  host: process.env.NODE_URL,
});

describe('Test gas send operation', function() {

  it('test operation.gasSendOperation()', function() {
    let data = sdk.operation.gasSendOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      gasAmount: '6000', //gasAmount is referring to the native token to be sent
      metadata: 'oh my send gas',
    });
    data.errorCode.should.equal(0);
    data.result.should.be.a('object');
    data.result.should.have.property('operation');
    data.result.operation.should.be.a('object');
    data.result.operation.should.have.property('type').equal('payCoin');
    data.result.operation.should.have.property('data');

    // Invalid sourceAddress
    data = sdk.operation.gasSendOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3A',
      destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      gasAmount: '6000', //gasAmount is referring to the native token to be sent
      metadata: 'oh my send gas',
    });
    data.errorCode.should.equal(11002);

    data = sdk.operation.gasSendOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3A',
      gasAmount: '6000', //gasAmount is referring to the native token to be sent
      metadata: 'oh my send gas',
    });
    data.errorCode.should.equal(11003);

    // Invalid gasAmount
    data = sdk.operation.gasSendOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      gasAmount: '6000A', //gasAmount is referring to the native token to be sent
      metadata: 'oh my send gas',
    });
    data.errorCode.should.equal(11026);

    // Invalid metadata
    data = sdk.operation.gasSendOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      gasAmount: '6000', //gasAmount is referring to the native token to be sent
      metadata: '',
    });

    data.errorCode.should.equal(15028);
  });

});
