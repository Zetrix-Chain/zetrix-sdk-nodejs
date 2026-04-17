'use strict';

/**
 * evaluateFeeDemo.js
 *
 * Demonstrates all four evaluateFee scenarios using a native ZTX transfer.
 *
 * Scenario 1 — privateKeys + JSON
 *   SDK internally builds a temp blob, signs it, calls testTransaction to
 *   get the exact fee, then rebuilds with the real feeLimit/gasPrice and
 *   re-signs.  Returns { feeLimit, gasPrice, transactionBlob, signatures }
 *   — ready to pass directly to transaction.submit().
 *
 * Scenario 2 — blob + signatures  (external signer)
 *   The caller already has a signed blob (from a hardware wallet, air-gapped
 *   machine, or separate signing service).  The real signature bytes are sent
 *   to testTransaction so the fee is exact.
 *   Returns { feeLimit, gasPrice } only — SDK cannot re-sign for external signers.
 *
 * Scenario 3 — JSON only  (no key, no blob)
 *   Classic fallback: transaction_json is sent to testTransaction and the
 *   blockchain estimates signature size using Ed25519 defaults.
 *   Returns { feeLimit, gasPrice } only.
 *
 * Scenario 4 — blob only  (no key, no signatures)
 *   A pre-built blob without signatures. testTransaction uses the same
 *   Ed25519 fallback estimate as scenario 3.
 *   Returns { feeLimit, gasPrice } only.
 *
 * Prerequisites (.env):
 *   NODE_URL     — Zetrix node endpoint
 *   ZTX_ADDRESS  — Funded sender address
 *   PRIVATE_KEY  — Corresponding private key  (required for S1 & S2)
 *
 * Run:
 *   node example/evaluateFeeDemo.js
 */

require('dotenv').config({ path: '.env' });
const BigNumber = require('bignumber.js');
const ZtxChainSDK = require('../index');

const sdk = new ZtxChainSDK({ host: process.env.NODE_URL });

const sourceAddress = process.env.ZTX_ADDRESS;
const privateKey    = process.env.PRIVATE_KEY;
const destAddress   = sourceAddress; // self-transfer keeps it simple
const gasAmountMo   = '1000000';     // 1 ZTX in MO

const HR = '─'.repeat(60);

function header(title) {
    console.log('');
    console.log(HR);
    console.log(' ', title);
    console.log(HR);
}

function check(result, label) {
    if (result.errorCode !== 0) {
        console.error(`  ERROR in ${label}: [${result.errorCode}] ${result.errorDesc}`);
        process.exit(1);
    }
}

async function main() {
    if (!sourceAddress) {
        console.error('ZTX_ADDRESS is not set in .env');
        process.exit(1);
    }

    console.log('');
    console.log('evaluateFee — four scenarios demo');
    console.log('Node    :', process.env.NODE_URL);
    console.log('Address :', sourceAddress);

    // ── Common setup: nonce + operation ──────────────────────────────────────

    const nonceResult = await sdk.account.getNonce(sourceAddress);
    check(nonceResult, 'getNonce');
    const nonce = new BigNumber(nonceResult.result.nonce).plus(1).toString(10);
    console.log('Nonce   :', nonce);

    const opResult = sdk.operation.gasSendOperation({
        sourceAddress,
        destAddress,
        gasAmount: gasAmountMo,
    });
    check(opResult, 'gasSendOperation');
    const operationItem = opResult.result.operation;

    // Pre-build a blob with placeholder fee values for use in S2 & S4.
    // Use minimum valid values ('1') — buildBlob rejects 0.
    // In a real scenario this blob would arrive from an external builder.
    const preBlobResult = sdk.transaction.buildBlob({
        sourceAddress,
        gasPrice: '1',
        feeLimit:  '1',
        nonce,
        operations: [operationItem],
    });
    check(preBlobResult, 'buildBlob (pre-built)');
    const prebuiltBlob = preBlobResult.result.transactionBlob;

    // ── Scenario 1: privateKeys + JSON ───────────────────────────────────────

    header('Scenario 1 — privateKeys + JSON  →  exact fee + submit-ready blob & sigs');

    if (!privateKey) {
        console.log('  SKIPPED — PRIVATE_KEY not set in .env');
    } else {
        console.log('  Input : sourceAddress, nonce, operations, privateKeys');

        const s1 = await sdk.transaction.evaluateFee({
            sourceAddress,
            nonce,
            operations: [operationItem],
            privateKeys: [privateKey],
        });
        check(s1, 'evaluateFee S1');

        console.log('  feeLimit         :', s1.result.feeLimit, 'MO  (exact — real sig bytes)');
        console.log('  gasPrice         :', s1.result.gasPrice, 'MO');
        console.log('  transactionBlob  :', s1.result.transactionBlob.substring(0, 48) + '...');
        console.log('  signatures       :', s1.result.signatures.length, 'signature(s) — ready for submit');
        console.log('');
        console.log('  → Pass result.transactionBlob + result.signatures directly to submit()');
    }

    // ── Scenario 2: blob + signatures ────────────────────────────────────────

    header('Scenario 2 — blob + signatures  →  exact fee only  (external signer)');

    if (!privateKey) {
        console.log('  SKIPPED — PRIVATE_KEY not set in .env');
    } else {
        // Sign the pre-built blob to simulate an external signer
        const signResult = sdk.transaction.sign({
            privateKeys: [privateKey],
            blob: prebuiltBlob,
        });
        check(signResult, 'sign (S2 simulation)');
        const externalSigs = signResult.result.signatures;

        console.log('  Input : transactionBlob (pre-signed), signatures');

        const s2 = await sdk.transaction.evaluateFee({
            transactionBlob: prebuiltBlob,
            signatures:      externalSigs,
        });
        check(s2, 'evaluateFee S2');

        console.log('  feeLimit  :', s2.result.feeLimit, 'MO  (exact — real sig bytes)');
        console.log('  gasPrice  :', s2.result.gasPrice, 'MO');
        console.log('  (no transactionBlob / signatures in response — SDK cannot re-sign)');
        console.log('');
        console.log('  → External signer must rebuild with feeLimit =', s2.result.feeLimit, 'and re-sign');
    }

    // ── Scenario 3: JSON only ─────────────────────────────────────────────────

    header('Scenario 3 — JSON only  →  Ed25519 fallback estimate  (no key required)');

    console.log('  Input : sourceAddress, nonce, operations  (no privateKeys, no blob)');

    const s3 = await sdk.transaction.evaluateFee({
        sourceAddress,
        nonce,
        operations: [operationItem],
    });
    check(s3, 'evaluateFee S3');

    console.log('  feeLimit  :', s3.result.feeLimit, 'MO  (Ed25519 estimate)');
    console.log('  gasPrice  :', s3.result.gasPrice, 'MO');
    console.log('  (no transactionBlob / signatures in response)');
    console.log('');
    console.log('  → Use as a display estimate before the user signs');

    // ── Scenario 4: blob only ─────────────────────────────────────────────────

    header('Scenario 4 — blob only  →  Ed25519 fallback estimate  (no key required)');

    console.log('  Input : transactionBlob (unsigned)');

    const s4 = await sdk.transaction.evaluateFee({
        transactionBlob: prebuiltBlob,
    });
    check(s4, 'evaluateFee S4');

    console.log('  feeLimit  :', s4.result.feeLimit, 'MO  (Ed25519 estimate)');
    console.log('  gasPrice  :', s4.result.gasPrice, 'MO');
    console.log('  (no transactionBlob / signatures in response)');
    console.log('');
    console.log('  → Use to inspect fee of a pre-built blob before handing to a signer');

    // ── Summary ───────────────────────────────────────────────────────────────

    header('Summary');
    console.log('  Scenario  Input                     Fee accuracy   Returns blob+sigs?');
    console.log('  ────────  ────────────────────────  ─────────────  ──────────────────');
    if (privateKey) {
        console.log('  S1        privateKeys + JSON        Exact          Yes — submit-ready');
        console.log('  S2        blob + signatures          Exact          No  — external signer');
    } else {
        console.log('  S1        privateKeys + JSON        (skipped — no PRIVATE_KEY)');
        console.log('  S2        blob + signatures          (skipped — no PRIVATE_KEY)');
    }
    console.log('  S3        JSON only                  Estimate       No  — no key provided');
    console.log('  S4        blob only                  Estimate       No  — no key provided');
    console.log('');
}

main().catch(err => {
    console.error('Unexpected error:', err.message);
    process.exit(1);
});
