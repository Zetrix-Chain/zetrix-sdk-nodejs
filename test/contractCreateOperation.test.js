'use strict';
require("dotenv").config();
require('chai').should();
const ZtxChainSDK = require('../index');

const sdk = new ZtxChainSDK({
  host: 'http://192.168.10.100:19343',//Can use process.env.HOST_URL to prevent repetition
});

describe('Test contract create operation', function() {

  it('test operation.contractCreateOperation()', function() {

    let contractCreateOperation = sdk.operation.contractCreateOperation({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      initBalance: '1000',
      type: 0,
      payload: 'afasfsaff',
      initInput: 'aaaaa',
      metadata: 'Test contract create operation',
    });

    if (contractCreateOperation.errorCode !== 0) {
      console.log(contractCreateOperation);
      return;
    }

    const operationItem = contractCreateOperation.result.operation;

    const blobInfo = sdk.transaction.buildBlob({
      sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
      gasPrice: '1000',
      feeLimit: '1000000', //feeLimit = gasPrice * tx_size
      nonce: '123',
      operations: [ operationItem ],
    });

    console.log(blobInfo);
  });

});
