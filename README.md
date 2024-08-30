zetrix-sdk-nodejs
=======
A complete and simple library for developers to connect and use the Zetrix layer 1 blockchain.


## Installation & Prerequisite

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).

Before installing, [download and install Node.js](https://nodejs.org/en/download/).
Node.js 6.0.0 or higher is required.

Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install zetrix-sdk-nodejs --save
```

In this tutorial, we will also use the [dotenv](https://www.npmjs.com/package/dotenv) package to conveniently manage environment variables
```bash
$ npm install dotenv --save
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

## Quick Start

Create zetrix-sdk-nodejs instance:

```js
'use strict';

const ZtxChainSDK = require('zetrix-sdk-nodejs');

const sdk = new ZtxChainSDK({
  host: process.env.NODE_URL,
});
```

## Example Usages:
Here's a simple example of what you can do with the SDK.
```js
// Create a new account onchain
sdk.account.create().then(data => {
  console.log(data);
}).catch(err => {
  console.log(err.message);
});
```
More examples can be found in the [examples](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/tree/main/example) and [test](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/tree/main/test) folder in the repo.


## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## Docs & Useful Links

  * [SDK Documentation](https://docs.zetrix.com/en/sdk/node.js)
  * [Zetrix Explorer](https://explorer.zetrix.com)
  * [Zetrix Testnet Faucet](https://faucet.zetrix.com)
  * [Zetrix Smart Contract IDE](https://ide.zetrix.com/)

## Community Support & Feedback
If you have questions [submit an issue](https://github.com/Zetrix-Chain/zetrix-sdk-nodejs/issues/new/choose) or join us on [Discord](https://discord.gg/)

## License

  [MIT](LICENSE)
