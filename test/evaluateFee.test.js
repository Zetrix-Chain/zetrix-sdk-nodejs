'use strict';

/**
 * evaluateFee.test.js
 *
 * Integration tests for all four evaluateFee scenarios.
 *
 * Requires .env to contain:
 *   NODE_URL     — Zetrix node endpoint  (e.g. 111.119.233.204:19333)
 *   ZTX_ADDRESS  — Funded sender address
 *   PRIVATE_KEY  — Corresponding private key  (needed for S1 & S2)
 */

require('dotenv').config({ path: '.env' });
require('chai').should();
const BigNumber = require('bignumber.js');
const ZtxChainSDK = require('../index');

const sdk = new ZtxChainSDK({ host: process.env.NODE_URL });

const sourceAddress = process.env.ZTX_ADDRESS;
const privateKey    = process.env.PRIVATE_KEY;
const destAddress   = 'ZTX3b69xfJZbiC8WbrtE2Ez27zri3a6K9B5pt'; // self-transfer is fine for fee estimation

describe('evaluateFee — four scenarios', function () {
    this.timeout(30000); // network round-trips; S1 makes two

    // ── shared state built once before all tests ─────────────────────────────

    let nonce;
    let operationItem;
    let prebuiltBlob;      // used by S2 & S4
    let externalSigs;      // used by S2 (simulates an external signer)

    before(async () => {
        if (!sourceAddress) throw new Error('ZTX_ADDRESS is not set in .env');

        // Fetch nonce
        const nonceResult = await sdk.account.getNonce(sourceAddress);
        nonceResult.errorCode.should.equal(0);
        nonce = new BigNumber(nonceResult.result.nonce).plus(1).toString(10);

        // Build operation (1 ZTX transfer — small amount, fee estimation only)
        const opResult = sdk.operation.gasSendOperation({
            sourceAddress,
            destAddress,
            gasAmount: '1000000', // 1 ZTX in MO
        });
        opResult.errorCode.should.equal(0);
        operationItem = opResult.result.operation;

        // Pre-build a blob with placeholder fee values — used by S2 & S4.
        // Use minimum valid values ('1') because buildBlob rejects 0.
        const blobResult = sdk.transaction.buildBlob({
            sourceAddress,
            gasPrice: '1',
            feeLimit:  '1',
            nonce,
            operations: [operationItem],
        });
        blobResult.errorCode.should.equal(0);
        prebuiltBlob = blobResult.result.transactionBlob;

        // Sign the pre-built blob — simulates an external signer for S2
        if (privateKey) {
            const signResult = sdk.transaction.sign({
                privateKeys: [privateKey],
                blob: prebuiltBlob,
            });
            signResult.errorCode.should.equal(0);
            externalSigs = signResult.result.signatures;
        }
    });

    // ── Scenario 1 ───────────────────────────────────────────────────────────

    it('S1: privateKeys + JSON — exact fee, returns blob & signatures ready for submit', async function() {
        if (!privateKey) return this.skip();

        const result = await sdk.transaction.evaluateFee({
            sourceAddress,
            nonce,
            operations: [operationItem],
            privateKeys: [privateKey],
        });

        result.errorCode.should.equal(0);
        result.result.should.be.a('object');

        // Fee values
        result.result.should.have.property('feeLimit');
        result.result.should.have.property('gasPrice');
        new BigNumber(result.result.feeLimit).isGreaterThan(0).should.equal(true);
        new BigNumber(result.result.gasPrice).isGreaterThan(0).should.equal(true);

        // S1 must return a submit-ready blob + signatures
        result.result.should.have.property('transactionBlob');
        result.result.should.have.property('signatures');
        result.result.transactionBlob.should.be.a('string').with.length.greaterThan(0);
        result.result.signatures.should.be.an('array').with.length.greaterThan(0);
        result.result.signatures[0].should.have.property('signData');
        result.result.signatures[0].should.have.property('publicKey');

        console.log('    feeLimit  :', result.result.feeLimit, 'MO');
        console.log('    gasPrice  :', result.result.gasPrice, 'MO');
        console.log('    blob      :', result.result.transactionBlob.substring(0, 40) + '...');
        console.log('    sigs      :', result.result.signatures.length, 'signature(s)');
    });

    // ── Scenario 2 ───────────────────────────────────────────────────────────

    it('S2: blob + signatures — exact fee, returns fee values only', async function() {
        if (!privateKey || !externalSigs) return this.skip();

        const result = await sdk.transaction.evaluateFee({
            transactionBlob: prebuiltBlob,
            signatures:      externalSigs,
        });

        result.errorCode.should.equal(0);
        result.result.should.be.a('object');

        result.result.should.have.property('feeLimit');
        result.result.should.have.property('gasPrice');
        new BigNumber(result.result.feeLimit).isGreaterThan(0).should.equal(true);
        new BigNumber(result.result.gasPrice).isGreaterThan(0).should.equal(true);

        // SDK cannot re-sign for external signers — no blob/sigs in response
        result.result.should.not.have.property('transactionBlob');
        result.result.should.not.have.property('signatures');

        console.log('    feeLimit  :', result.result.feeLimit, 'MO  (exact — real sig bytes)');
        console.log('    gasPrice  :', result.result.gasPrice, 'MO');
    });

    // ── Scenario 3 ───────────────────────────────────────────────────────────

    it('S3: JSON only — Ed25519 fallback estimate, returns fee values only', async () => {
        const result = await sdk.transaction.evaluateFee({
            sourceAddress,
            nonce,
            operations: [operationItem],
        });

        result.errorCode.should.equal(0);
        result.result.should.be.a('object');

        result.result.should.have.property('feeLimit');
        result.result.should.have.property('gasPrice');
        new BigNumber(result.result.feeLimit).isGreaterThan(0).should.equal(true);
        new BigNumber(result.result.gasPrice).isGreaterThan(0).should.equal(true);

        // No private key supplied — no blob/sigs in response
        result.result.should.not.have.property('transactionBlob');
        result.result.should.not.have.property('signatures');

        console.log('    feeLimit  :', result.result.feeLimit, 'MO  (Ed25519 estimate)');
        console.log('    gasPrice  :', result.result.gasPrice, 'MO');
    });

    // ── Scenario 4 ───────────────────────────────────────────────────────────

    it('S4: blob only — Ed25519 fallback estimate, returns fee values only', async () => {
        const result = await sdk.transaction.evaluateFee({
            transactionBlob: prebuiltBlob,
        });

        result.errorCode.should.equal(0);
        result.result.should.be.a('object');

        result.result.should.have.property('feeLimit');
        result.result.should.have.property('gasPrice');
        new BigNumber(result.result.feeLimit).isGreaterThan(0).should.equal(true);
        new BigNumber(result.result.gasPrice).isGreaterThan(0).should.equal(true);

        // No signatures supplied — no blob/sigs in response
        result.result.should.not.have.property('transactionBlob');
        result.result.should.not.have.property('signatures');

        console.log('    feeLimit  :', result.result.feeLimit, 'MO  (Ed25519 estimate)');
        console.log('    gasPrice  :', result.result.gasPrice, 'MO');
    });

    // ── Validation — invalid inputs ───────────────────────────────────────────

    it('S2/S4 — invalid blob is rejected', async () => {
        const result = await sdk.transaction.evaluateFee({
            transactionBlob: 'not-a-valid-hex-blob',
        });
        result.errorCode.should.equal(11056); // INVALID_BLOB_ERROR
    });

    it('S1/S3 — missing sourceAddress is rejected', async () => {
        const result = await sdk.transaction.evaluateFee({
            nonce,
            operations: [operationItem],
        });
        result.errorCode.should.not.equal(0);
    });

});
