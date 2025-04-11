'use strict';

const is = require('is-type-of');
const protobuf = require('protobufjs');
const long = require('long');
const tou8 = require('buffer-to-uint8array');

/**
 * contractUPgrade Operation
 * @param args
 * @return {object}
 */
module.exports = function (args) {
  try {
    const { sourceAddress, contractAddress, sPayload, payload, sOwner, owner, metadata } = args;
    const root = protobuf.Root.fromJSON(require('../../crypto/protobuf/bundle.json'));
    const upgradeContractOperation = root.lookupType('protocol.OperationUpgradeContract');
    let opt = {
      destAddress: contractAddress
    };

    if (sPayload === true) {
      opt.sPayload = sPayload;
    }

    if (sOwner === true) {
      opt.sOwner = sOwner;
    }

    if (payload) {
      opt.payload = payload;
    }

    if (owner) {
      opt.owner = owner;
    }

    const upgradeContractMsg = upgradeContractOperation.create(opt);

    const operation = root.lookupType('protocol.Operation');
    const upgradeContract = {
      upgradeContract: upgradeContractMsg,
      type: operation.Type.UPGRADE_CONTRACT,
      sourceAddress,
    };

    if (metadata) {
      upgradeContract.metadata = metadata;
    }

    const err = operation.verify(upgradeContract);

    if (err) {
      throw Error(err);
    }

    return operation.create(upgradeContract);
  } catch (err) {
    throw err;
  }
};
