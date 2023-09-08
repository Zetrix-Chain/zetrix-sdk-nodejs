'use strict';
require("dotenv").config();
require('chai').should();
const BigNumber = require('bignumber.js');
const ZtxChainSDK = require('zetrix-sdk');

const sdk = new ZtxChainSDK({
  host: 'http://192.168.10.100:19343',//Can use process.env.HOST_URL to prevent repetition
});

describe('The demo of submit transaction ', function() {

  it('The demo of submit transaction', async() => {
    const senderPrivateKey = 'sender private key';//Can use process.env.ADDRESS_1_PRIVATE_KEY to prevent repetition
    const senderAddress = 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3';//Can use process.env.ADDRESS_1 to prevent repetition
    const receiverAddress = 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3';//Can use process.env.ADDRESS_2 to prevent repetition

    const accountInfo = await sdk.account.getNonce(senderAddress);

    if (accountInfo.errorCode !== 0) {
      console.log(accountInfo);
      return;
    }
    let nonce = accountInfo.result.nonce;
    // nonce + 1
    nonce = new BigNumber(nonce).plus(1).toString(10);

    // ====================================
    // 1. build operation (gasSendOperation)
    // ====================================
    const operationInfo = sdk.operation.gasSendOperation({
      sourceAddress: senderAddress,
      destAddress: receiverAddress,
      gasAmount: '7000', //gasAmount is referring to the native token to be sent
      metadata: 'send gas demo',
    });

    if (operationInfo.errorCode !== 0) {
      console.log(operationInfo);
      return;
    }

    const operationItem = operationInfo.result.operation;

    // ====================================
    // 2. build blob
    // ====================================
    const blobInfo = sdk.transaction.buildBlob({
      sourceAddress: senderAddress,
      gasPrice: '1000',
      feeLimit: '306000', //feeLimit = gasPrice * tx_size
      nonce,
      operations: [ operationItem ],
    });

    if (blobInfo.errorCode !== 0) {
      console.log(blobInfo);
      return;
    }

    const blob = blobInfo.result.transactionBlob;

    // ====================================
    // 3. sign blob with sender private key
    // ====================================
    let signatureInfo = sdk.transaction.sign({
      privateKeys: [ senderPrivateKey ],
      blob,
    });

    if (signatureInfo.errorCode !== 0) {
      console.log(signatureInfo);
      return;
    }

    const signature = signatureInfo.result.signatures;

    // ====================================
    // 4. submit transaction
    // ====================================
    const transactionInfo = await sdk.transaction.submit({
      blob,
      signature: signature,
    });

    if (transactionInfo.errorCode !== 0) {
      console.log(transactionInfo);
    }
    console.log(transactionInfo);
  });

});
