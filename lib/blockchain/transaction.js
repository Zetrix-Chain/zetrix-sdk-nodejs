'use strict';

const wrap = require('co-wrap-all');
const is = require('is-type-of');
const merge = require('merge-descriptors');
const long = require('long');
const humps = require('humps');
const JSONbig = require('json-bigint');
const errors = require('../exception');


module.exports = Transaction;

function Transaction(options) {
    if (!(this instanceof Transaction)) {
        return new Transaction(options);
    }

    this.options = options;
}

const proto = Transaction.prototype;

merge(proto, require('../common/util'));

proto.buildBlob = function(args) {
    try {

        if (is.array(args) || !is.object(args)) {
            return this._responseError(errors.INVALID_ARGUMENTS);
        }

        const schema = {
            sourceAddress: {
                required: true,
                string: true,
                address: true,
            },
            gasPrice: {
                required: true,
                numeric: true,
            },
            feeLimit: {
                required: true,
                numeric: true,
            },
            nonce: {
                required: true,
                numeric: true,
            },
            ceilLedgerSeq: {
                required: false,
                numeric: true,
            },
            operations: {
                required: true,
                operations: true,
            },
            metadata: {
                required: false,
                string: true,
            }
        };

        if (!this._validate(args, schema).tag) {
            const msg = this._validate(args, schema).msg;
            return this._responseError(errors[msg]);
        }

        return this._responseData(this._buildBlob(args));
    } catch (err) {
        throw err;
    }
};

proto.sign = function(args) {
    // privateKeys, blob
    try {

        if (is.array(args) || !is.object(args)) {
            return this._responseError(errors.INVALID_ARGUMENTS);
        }

        const schema = {
            privateKeys: {
                required: true,
                privateKeys: true,
            },
            blob: {
                required: true,
                hex: true,
            },
        };

        if (!this._validate(args, schema).tag) {
            const msg = this._validate(args, schema).msg;
            return this._responseError(errors[msg]);
        }

        return this._responseData(this._signBlob(args));
    } catch (err) {
        throw err;
    }

};

// blob, signData, publicKey
proto.submit = function*(args) {

    if (is.array(args) || !is.object(args)) {
        return this._responseError(errors.INVALID_ARGUMENTS);
    }

    // blob, signature
    const schema = {
        signature: {
            required: true,
            signatures: true,
        },
        blob: {
            required: true,
            hex: true,
        },
    };

    if (!this._validate(args, schema).tag) {
        const msg = this._validate(args, schema).msg;
        return this._responseError(errors[msg]);
    }

    args = humps.decamelizeKeys(args, { separator: '_' });

    return yield this._submit(args);
};

proto.evaluateFee = function*(args) {
    try {

        if (is.array(args) || !is.object(args)) {
            return this._responseError(errors.INVALID_ARGUMENTS);
        }

        const {
            sourceAddress, nonce, operations, metadata, ceilLedgerSeq,
            privateKeys, gasPrice,
            transactionBlob, signatures,
        } = args;

        let { signtureNumber } = args;

        const hasBlob = !!transactionBlob;
        const hasSigs = !!(signatures && signatures.length > 0);
        const hasKeys = !!(privateKeys && privateKeys.length > 0);

        // Helper: extract fee from a testTransaction response
        const extractFee = (response) => {
            if (!is.object(response)) return null;
            if (response.error_code !== 0) return null;
            if (!response.result || !response.result.txs || response.result.txs.length === 0) return null;
            return response.result.txs[0].transaction_env.transaction;
        };

        // ── Scenarios 2 & 4: transaction_blob provided ─────────────────────────
        if (hasBlob) {
            if (!this._isHexString(transactionBlob)) {
                return this._responseError(errors.INVALID_BLOB_ERROR);
            }
            if (hasSigs && !this._isSignature(signatures)) {
                return this._responseError(errors.INVALID_SIGNATURE_ERROR);
            }

            const item = { transaction_blob: transactionBlob };
            if (hasSigs) {
                item.signatures = signatures.map(s => ({
                    sign_data:  s.signData,
                    public_key: s.publicKey,
                }));
            }

            const response = yield this._request('post', 'testTransaction', JSONbig.stringify({ items: [item] }));
            const fee = extractFee(response);
            if (!fee) {
                return this._responseErrorMsg(response.error_code, response.error_desc);
            }
            return this._responseData({ feeLimit: fee.fee_limit, gasPrice: fee.gas_price });
        }

        // ── Scenarios 1 & 3: transaction_json path ──────────────────────────────
        signtureNumber = signtureNumber || '1';

        const schema = {
            sourceAddress:  { required: true,  string: true, address: true },
            nonce:          { required: true,  string: true, numeric: true },
            operations:     { required: true,  operations: true },
            signtureNumber: { required: false, string: true, numeric: true },
            metadata:       { required: false, string: true },
            ceilLedgerSeq:  { required: false, numeric: true },
        };

        if (hasKeys && !this._isPrivateKeys(privateKeys)) {
            return this._responseError(errors.PRIVATEKEY_ONE_ERROR);
        }

        if (!this._validate(args, schema).tag) {
            const msg = this._validate(args, schema).msg;
            return this._responseError(errors[msg]);
        }

        signtureNumber = signtureNumber || 1;

        // ── Scenario 1: privateKeys provided — full cycle ────────────────────────
        if (hasKeys) {
            const blobArgs = {
                sourceAddress,
                gasPrice:     gasPrice || '0',
                feeLimit:     '0',
                nonce,
                operations,
                metadata,
                ceilLedgerSeq,
            };

            // Step 1: temp blob + sign → get accurate fee
            const tempBlob = this._buildBlob(blobArgs).transactionBlob;
            const tempSigs = this._signBlob({ privateKeys, blob: tempBlob }).signatures;

            const evalResponse = yield this._request('post', 'testTransaction', JSONbig.stringify({
                items: [{
                    transaction_blob: tempBlob,
                    signatures: tempSigs.map(s => ({ sign_data: s.signData, public_key: s.publicKey })),
                }],
            }));

            const fee = extractFee(evalResponse);
            if (!fee) {
                return this._responseErrorMsg(evalResponse.error_code, evalResponse.error_desc);
            }

            // Step 2: rebuild with actual fee + re-sign
            blobArgs.feeLimit = String(fee.fee_limit);
            blobArgs.gasPrice = String(fee.gas_price);
            const finalBlob = this._buildBlob(blobArgs).transactionBlob;
            const finalSigs = this._signBlob({ privateKeys, blob: finalBlob }).signatures;

            return this._responseData({
                feeLimit:        fee.fee_limit,
                gasPrice:        fee.gas_price,
                transactionBlob: finalBlob,
                signatures:      finalSigs,   // [{signData, publicKey}] — ready for submit
            });
        }

        // ── Scenario 3: no keys, no blob — fallback (current behaviour) ──────────
        const operationList = [];
        operations.forEach(item => {
            const operationItem = this._buildOperation(item.type, item.data);
            let operationMsg = humps.decamelizeKeys(operationItem, { separator: '_' });
            operationMsg = this._longToInt(operationMsg);
            operationList.push(operationMsg);
        });

        const data = JSONbig.stringify({
            items: [{
                transaction_json: {
                    source_address:  sourceAddress,
                    metadata:        metadata,
                    nonce:           nonce,
                    operations:      operationList,
                    ceil_ledger_seq: ceilLedgerSeq,
                    chain_id:        this.options.chainId,
                },
            }],
        });

        const response = yield this._request('post', 'testTransaction', data);
        if (is.object(response)) {
            const info = response;
            if (info.error_code === 0) {
                if (info.result.txs && info.result.txs.length > 0) {
                    const fee = info.result.txs[0].transaction_env.transaction;
                    return this._responseData({ feeLimit: fee.fee_limit, gasPrice: fee.gas_price });
                }
            }
            return this._responseErrorMsg(info.error_code, info.error_desc);
        }
    } catch (err) {
        throw err;
    }
};

proto.getInfo = function*(hash) {
    try {

        if (!is.string(hash) || this._isEmptyString(hash)) {
            return this._responseError(errors.INVALID_HASH_ERROR);
        }

        const data = yield this._request('get', 'getTransactionHistory', {
            hash: hash,
        });

        if (data.error_code === 0) {
            return this._responseData(data.result);
        }

        if (data.error_code === 4) {
            return this._responseError(errors.QUERY_RESULT_NOT_EXIST, data.result);
        }

        return this._responseError(errors.FAIL);

    } catch (err) {
        throw err;
    }
};


wrap(proto);