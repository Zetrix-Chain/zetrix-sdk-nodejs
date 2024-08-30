zetrix-sdk-nodejs
=======
A complete and simple library for developers to connect and use the Zetrix layer 1 blockchain.

## Docs & Useful Links

  * [SDK Documentation](https://docs.zetrix.com/en/sdk/node.js)
  * [Zetrix Explorer](https://explorer.zetrix.com)
  * [Zetrix Testnet Faucet](https://faucet.zetrix.com)
  * [Zetrix Smart Contract IDE](https://ide.zetrix.com/)
  * [Zetrix Wallet](https://www.zetrix.com/zetrix-wallet/)


## Installation & Prerequisite

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 6.0.0 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install zetrix-sdk-nodejs
```

We also recommend using the [dotenv](https://www.npmjs.com/package/dotenv) package to conveniently manage environment variables
```bash
$ npm install dotenv
```

## Configuration
Create a `.env` file in the root of your project and insert your key/value pairs in the following format of `KEY=VALUE`:

Zetrix Testnet:
```sh
NODE_URL=test-node.zetrix.com
```

Zetrix Mainnet:
```sh
NODE_URL=node.zetrix.com
```

## Quick Start & Basic Usages
Here's a simple guide to connect your dApp to the Zetrix wallet if you're using the Chrome extension wallet on the browser only. Mobile wallet connection requires a separate SDK:
```js
window.zetrix.authorize(
  { method: "changeAccounts" }, 
  (resp) => {
    if (resp.code === 0) {
      window.zetrix.authorize(
        { method: "sendRandom", param: { random: "blob" } }, 
        (resAuth) => {
          if (resAuth.code === 0) {
            // retrieve the necessary info from resp.data and resAuth.data to retrieve the address, signData & publicKey
            sessionStorage.setItem("zetrixAccount", resp.data.address);
            sessionStorage.setItem("isLogin", "true");
          }
        }
      );
    } 
  }
);
```
Create the zetrix-sdk-nodejs instance to begin using the SDK:

```js
'use strict';

const ZtxChainSDK = require('zetrix-sdk-nodejs');

const sdk = new ZtxChainSDK({
  host: process.env.NODE_URL,
});
```

Retrieving account balance using the SDK:
```js
// Retrieve account balance by passing the address
sdk.account.getBalance(address).then(resp => {
  if (resp.errorCode === 0) {
    console.log(resp.result.balance);
  }
}).catch(err => {
  console.log(err.message);
});
```

Creating a new account using the SDK:
```js
// Create a new account onchain
sdk.account.create().then(data => {
  console.log(data);
}).catch(err => {
  console.log(err.message);
});
```

Sample contract call using the SDK:
```js
// Querying a contract
const data = yield sdk.contract.call({
    optType: 2,
    // Insert contract address
    contractAddress: contractAddress, 
    // Pass input parameters as a JSON string
    input: JSON.stringify({
      // Calling the 'getCertificateBySerialNumber' query function from the smart contract
      method: 'getCertificateBySerialNumber',
      // Passing the paramets for querying
      params: {
        serialNumber: "1237"
      }
    }),
  });
```

Another [sample](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/blob/main/example/exchange.js#L621) contract invocation:
```js
// Invoke a contract by sending tokens
const operationInfo = await sdk.operation.contractInvokeByGasOperation({
  sourceAddress: newAddress,
  contractAddress: contractAddress,
  // 0 ZETA will be sent
  amount: 0,
  // Input destination address under "to" and number of tokens under "value"
  input: '{\"method\":\"transfer\",\"params\":{\"to\":\"ZTX3Ta7d4GyAXD41H2kFCTd2eXhDesM83rvC3\",\"value\":\"10000000\"}}',
  metadata: 'invoking contract by sending tokens. 0 ZETRIX (gas) amount is sent'
});
```

More examples can be found in the [examples](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/tree/main/example) and [test](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/tree/main/test) folder in the repo.


## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

  [MIT](LICENSE)
