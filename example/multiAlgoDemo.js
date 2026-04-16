'use strict';

/**
 * Multi-Algorithm Key Generation Demo
 *
 * Demonstrates account.create() with different key algorithms.
 * No network connection required — key generation is purely local.
 *
 * Usage:
 *   node example/multiAlgoDemo.js
 */

const ZtxChainSDK = require('../lib/sdk');

const sdk = new ZtxChainSDK({ host: 'http://localhost:19333' });

async function main() {
  const types = ['ed25519', 'sm2', 'dilithium3', 'hybrid'];

  for (const signType of types) {
    console.log(`\n--- ${signType.toUpperCase()} ---`);
    const result = await sdk.account.create(signType);

    if (result.errorCode !== 0) {
      console.error(`  Error: ${result.errorDesc}`);
      continue;
    }

    const { privateKey, publicKey, address } = result.result;
    console.log(`  Address    : ${address}`);
    console.log(`  Public key : ${publicKey.substring(0, 20)}... (${publicKey.length} chars)`);
    console.log(`  Private key: ${privateKey.substring(0, 20)}... (${privateKey.length} chars)`);
  }
}

main().catch(console.error);
