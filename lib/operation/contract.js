'use strict';

const is = require('is-type-of');
const errors = require('../exception');

const proto = exports;

proto.contractCreateOperation = function(args) {
  try {

    if (is.array(args) || !is.object(args)) {
      return this._responseError(errors.INVALID_ARGUMENTS);
    }

    const schema = {
      sourceAddress: {
        required: false,
        string: true,
        address: true,
      },
      metadata: {
        required: false,
        string: true,
      },
      initInput: {
        required: false,
        string: true,
      },
      owner: {
        required: false,
        string: true
      }
    };

    if (!this._validate(args, schema).tag) {
      const msg = this._validate(args, schema).msg;
      return this._responseError(errors[msg]);
    }

    if (!is.undefined(args.initBalance)) {
      if (!this._isAvailableValue(args.initBalance)) {
        return this._responseError(errors.INVALID_INITBALANCE_ERROR);
      }
    }

    if (!is.string(args.payload) ||
      args.payload.trim().length === 0) {
      return this._responseError(errors.PAYLOAD_EMPTY_ERROR)
    }

    if (args.initBalance === '0') {
      delete args.initBalance;
    }

    return this._responseData({
      operation: {
        type: 'contractCreate',
        data: args,
      },
    });
  } catch (err) {
    throw err;
  }
};

proto.contractInvokeByAssetOperation = function* (args) {
  try {

    if (is.array(args) || !is.object(args)) {
      return this._responseError(errors.INVALID_ARGUMENTS);
    }

    const schema = {
      contractAddress: {
        required: true,
        address: true,
      },
      sourceAddress: {
        required: false,
        address: true,
      },
      code: {
        required: false,
        string: true,
      },
      issuer: {
        required: false,
        address: true,
      },
      metadata: {
        required: false,
        string: true,
      },
      input: {
        required: false,
        string: true,
      },
    };

    if (!this._validate(args, schema).tag) {
      const msg = this._validate(args, schema).msg;
      return this._responseError(errors[msg]);
    }

    if (!is.undefined(args.assetAmount)) {
      if (!this._isAvailableValue(args.assetAmount)) {
        return this._responseError(errors.INVALID_ASSET_AMOUNT_ERROR);
      }
    }

    if (args.sourceAddress && args.contractAddress === args.sourceAddress) {
      return this._responseError(errors.SOURCEADDRESS_EQUAL_CONTRACTADDRESS_ERROR);
    }

    const isContractAddress = yield this._isContractAddress(args.contractAddress);

    if (!isContractAddress) {
      return this._responseError(errors.CONTRACTADDRESS_NOT_CONTRACTACCOUNT_ERROR);
    }

    if (args.assetAmount === '0') {
      delete args.assetAmount;
      delete args.issuer;
      delete args.code;
    }

    return this._responseData({
      operation: {
        type: 'contractInvokeByAsset',
        data: args,
      },
    });
  } catch (err) {
    throw err;
  }
};

proto.contractInvokeByGasOperation = function* (args) {
  try {

    if (is.array(args) || !is.object(args)) {
      return this._responseError(errors.INVALID_ARGUMENTS);
    }

    const schema = {
      contractAddress: {
        required: true,
        address: true,
      },
      sourceAddress: {
        required: false,
        address: true,
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

    if (!is.undefined(args.gasAmount)) {
      if (!this._isAvailableValue(args.gasAmount)) {
        return this._responseError(errors.INVALID_CONTRACT_GAS_AMOUNT_ERROR);
      }
    }

    if (!is.undefined(args.input)) {
      if (!is.string(args.input) || args.input.trim().length === 0) {
        return this._responseError(errors.INVALID_INPUT_ERROR);
      }
    }

    if (args.sourceAddress && args.contractAddress === args.sourceAddress) {
      return this._responseError(errors.SOURCEADDRESS_EQUAL_CONTRACTADDRESS_ERROR);
    }

    const isContractAddress = yield this._isContractAddress(args.contractAddress);

    if (!isContractAddress) {
      return this._responseError(errors.CONTRACTADDRESS_NOT_CONTRACTACCOUNT_ERROR);
    }

    if (args.gasAmount === '0') {
      delete args.gasAmount;
    }

    return this._responseData({
      operation: {
        type: 'contractInvokeByGas',
        data: args,
      },
    });
  } catch (err) {
    throw err;
  }
};

proto.contractUpgradeOperation = function* (args) {
  try {

    if (is.array(args) || !is.object(args)) {
      return this._responseError(errors.INVALID_ARGUMENTS);
    }

    const schema = {
      contractAddress: {
        required: true,
        address: true,
      },
      sourceAddress: {
        required: false,
        address: true,
      },
      metadata: {
        required: false,
        string: true,
      },
      sPayload: {
        required: true,
        boolean: true
      },
      sOwner: {
        required: true,
        boolean: true
      },
      owner: {
        required: false,
        string: true
      }
    };

    if (!this._validate(args, schema).tag) {
      const msg = this._validate(args, schema).msg;
      return this._responseError(errors[msg]);
    }

    if (!args.sPayload && !args.sOwner) {
      return this._responseError(errors.S_PAYLOAD_S_OWNER_NULL_ERROR);
    }

    if (args.sPayload && (!args.payload ||
        (is.string(args.payload) && args.payload.trim().length === 0))) {
      return this._responseError(errors.PAYLOAD_EMPTY_ERROR);
    }

    if (args.sOwner && !args.owner) {
      return this._responseError(errors.OWNER_NULL_ERROR);
    }

    if (!is.undefined(args.input)) {
      if (!is.string(args.input) || args.input.trim().length === 0) {
        return this._responseError(errors.INVALID_INPUT_ERROR);
      }
    }

    if (args.sourceAddress && args.contractAddress === args.sourceAddress) {
      return this._responseError(errors.SOURCEADDRESS_EQUAL_CONTRACTADDRESS_ERROR);
    }

    const isContractAddress = yield this._isContractAddress(args.contractAddress);

    if (!isContractAddress) {
      return this._responseError(errors.CONTRACTADDRESS_NOT_CONTRACTACCOUNT_ERROR);
    }

    return this._responseData({
      operation: {
        type: 'contractUpgrade',
        data: args,
      },
    });
  } catch (err) {
    throw err;
  }
};