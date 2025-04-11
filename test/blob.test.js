'use strict';
require('dotenv').config({path: ".env"});
require('chai').should();
const BigNumber = require('bignumber.js');

const ZtxChainSDK = require('../index');

const sdk = new ZtxChainSDK({
  host: process.env.NODE_URL,
});

describe('Test build blob', function() {

  it('test transaction.buildBlob()', async () => {
    const sourceAddress = 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3';
    const accountInfo = await sdk.account.getInfo(sourceAddress);

    if (accountInfo.errorCode !== 0) {
      console.log(accountInfo);
      return;
    }

    let nonce = accountInfo.result.nonce;
    nonce = new BigNumber(nonce).plus(1).toString(10);

    const acountActivateOperation = {
      type: 'activateAccount',
      data: {
        sourceAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
        destAddress: 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3',
        initBalance: '1000',
        metadata: 'Test Account Activate',
      },
    };

    let data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '1234',
      feeLimit: '123', //feeLimit = gasPrice * tx_size
      nonce: `${nonce}`,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });

    data.errorCode.should.equal(0);
    data.result.should.be.a('object');
    data.result.should.have.property('transactionBlob');

    // Invalid sourceAddress
    data = sdk.transaction.buildBlob({
      sourceAddress: '',
      gasPrice: '1234',
      feeLimit: '123', //feeLimit = gasPrice * tx_size
      nonce: `${nonce}`,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });
    data.errorCode.should.equal(11002);

    // Invalid gasPrice
    data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '-1234',
      feeLimit: '123', //feeLimit = gasPrice * tx_size
      nonce: `${nonce}`,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });
    data.errorCode.should.equal(11049);

    // Invalid feeLimit
    data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '1234',
      feeLimit: '', //feeLimit = gasPrice * tx_size
      nonce: `${nonce}`,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });
    data.errorCode.should.equal(11050);

    // Invalid nonce
    data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '100',
      feeLimit: '1000', //feeLimit = gasPrice * tx_size
      nonce: '',
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });

    data.errorCode.should.equal(11048);

    // Invalid metadata
    data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '100',
      feeLimit: '1000', //feeLimit = gasPrice * tx_size
      nonce,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 1234,
    });

    data.errorCode.should.equal(15028);

    // Invalid operation
    delete acountActivateOperation.type;
    data = sdk.transaction.buildBlob({
      sourceAddress,
      gasPrice: '100',
      feeLimit: '1000', //feeLimit = gasPrice * tx_size
      nonce,
      ceilLedgerSeq: '1',
      operations: [ acountActivateOperation ],
      metadata: 'oh my test build blob',
    });

    data.errorCode.should.equal(15022);

  });

});
