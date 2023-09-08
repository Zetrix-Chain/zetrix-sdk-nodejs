'use strict';
require("dotenv").config();
require('chai').should();
const ZtxChainSDK = require('zetrix-sdk');

const sdk = new ZtxChainSDK({
  host: 'http://192.168.10.100:19343',//Can use process.env.HOST_URL to prevent repetition
});

describe('The demo of offline signature', function() {

  // ====================================
  // Take `gasSendOperation` as an example
  // Offline signature contains 2 steps:
  // step1. Get blob
  // step2. Sign blob with sender private key
  // ====================================
  it('The demo of offline signature', async() => {
    const senderPrivateKey = 'sender private key';//Can use process.env.ADDRESS_1_PRIVATE_KEY to prevent repetition
    const senderAddress = 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3';//Can use process.env.ADDRESS_1 to prevent repetition
    const receiverAddress = 'ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3';//Can use process.env.ADDRESS_2 to prevent repetition
    // The unit is UGAS
    const gasPrice = '1000';
    // The unit is UGAS
    const feeLimit = '306000'; //feeLimit = gasPrice * tx_size
    // The unit is UGAS
    const gasAmount = '7000'; //gasAmount is referring to the native token to be sent
    // Transaction initiation account's Nonce + 1
    const nonce = '10';
    const metadata = 'send gas demo';

    // build operation (gasSendOperation)
    const operationInfo = sdk.operation.gasSendOperation({
      sourceAddress: senderAddress,
      destAddress: receiverAddress,
      gasAmount, //gasAmount is referring to the native token to be sent
      metadata,
    });

    if (operationInfo.errorCode !== 0) {
      console.log(operationInfo);
      return;
    }

    const operationItem = operationInfo.result.operation;

    // ====================================
    // step1. Get blob
    // ====================================
    const blobInfo = sdk.transaction.buildBlob({
      sourceAddress: senderAddress,
      gasPrice,
      feeLimit, //feeLimit = gasPrice * tx_size
      nonce,
      operations: [ operationItem ],
    });

    if (blobInfo.errorCode !== 0) {
      console.log(blobInfo);
      return;
    }

    const blob = blobInfo.result.transactionBlob;

    // ====================================
    // step2. Sign blob with sender private key
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

    console.log(signature);
  });

});
