import { bytes } from "@ckb-lumos/codec";
import {
  helpers,
  Address,
  Script,
  hd,
  Cell,
  commons,
  WitnessArgs,
  BI,
} from "@ckb-lumos/lumos";
import { values, blockchain } from "@ckb-lumos/base";
const { ScriptValue } = values;
import offCKB from "./offckb.config";
import { signCkbTx } from "../snap";

const { indexer, rpc, lumosConfig } = offCKB;
offCKB.initializeLumosConfig();

type Account = {
  lockScript: Script;
  address: Address;
  pubKey: string;
};
export const generateAccountFromPrivateKey = (privKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = lumosConfig.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };
  const address = helpers.encodeToAddress(lockScript, { config: lumosConfig });
  return {
    lockScript,
    address,
    pubKey,
  };
};

export async function capacityOf(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address, { config: lumosConfig }),
  });

  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}

interface Options {
  from: string;
  to: string;
  amount: string;
  privKey: string;
}

export async function transfer(options: Options): Promise<string> {
  let txSkeleton = helpers.TransactionSkeleton({});
  const fromScript = helpers.parseAddress(options.from, {
    config: lumosConfig,
  });
  const toScript = helpers.parseAddress(options.to, { config: lumosConfig });

  if (BI.from(options.amount).lt(BI.from("6100000000"))) {
    throw new Error(
      `every cell's capacity must be at least 61 CKB, see https://medium.com/nervosnetwork/understanding-the-nervos-dao-and-cell-model-d68f38272c24`
    );
  }

  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BI.from(options.amount).add(100000);
  let collectedSum = BI.from(0);
  const collected: Cell[] = [];
  const collector = indexer.collector({ lock: fromScript, type: "empty" });
  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
    collected.push(cell);
    if (collectedSum.gte(neededCapacity)) break;
  }

  if (collectedSum.lt(neededCapacity)) {
    throw new Error(`Not enough CKB, ${collectedSum} < ${neededCapacity}`);
  }

  const transferOutput: Cell = {
    cellOutput: {
      capacity: BI.from(options.amount).toHexString(),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cellOutput: {
      capacity: collectedSum.sub(neededCapacity).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collected)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(transferOutput, changeOutput)
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      outPoint: {
        txHash: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.TX_HASH,
        index: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.INDEX,
      },
      depType: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    };
    if (witness !== "0x") {
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (
        !!lock &&
        !!newWitnessArgs.lock &&
        !bytes.equal(lock, newWitnessArgs.lock)
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.inputType;
      if (inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const Sig = hd.key.signRecoverable(message!, options.privKey);
  const tx = helpers.sealTransaction(txSkeleton, [Sig]);
  const hash = await rpc.sendTransaction(tx, "passthrough");

  return hash;
}

interface SignOptions {
  from: string;
  to: string;
  amount: string;
}

export async function getTransferMessage(
  options: SignOptions
): Promise<string> {
  console.log(options);
  let txSkeleton = helpers.TransactionSkeleton({});
  const fromScript = helpers.parseAddress(options.from, {
    config: lumosConfig,
  });
  const toScript = helpers.parseAddress(options.to, { config: lumosConfig });

  if (BI.from(options.amount).lt(BI.from("6100000000"))) {
    throw new Error(
      `every cell's capacity must be at least 61 CKB, see https://medium.com/nervosnetwork/understanding-the-nervos-dao-and-cell-model-d68f38272c24`
    );
  }

  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  const neededCapacity = BI.from(options.amount).add(100000);
  let collectedSum = BI.from(0);
  const collected: Cell[] = [];
  const collector = indexer.collector({ lock: fromScript, type: "empty" });
  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
    collected.push(cell);
    if (collectedSum.gte(neededCapacity)) break;
  }

  if (collectedSum.lt(neededCapacity)) {
    throw new Error(`Not enough CKB, ${collectedSum} < ${neededCapacity}`);
  }

  const transferOutput: Cell = {
    cellOutput: {
      capacity: BI.from(options.amount).toHexString(),
      lock: toScript,
    },
    data: "0x",
  };

  const changeOutput: Cell = {
    cellOutput: {
      capacity: collectedSum.sub(neededCapacity).toHexString(),
      lock: fromScript,
    },
    data: "0x",
  };

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push(...collected)
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(transferOutput, changeOutput)
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      outPoint: {
        txHash: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.TX_HASH,
        index: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.INDEX,
      },
      depType: (lumosConfig.SCRIPTS as any).SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    };
    if (witness !== "0x") {
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (
        !!lock &&
        !!newWitnessArgs.lock &&
        !bytes.equal(lock, newWitnessArgs.lock)
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.inputType;
      if (inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  console.log(message);
  const sig = await signCkbTx(message, options.from);
  const tx = helpers.sealTransaction(txSkeleton, [sig]);
  const hash = await rpc.sendTransaction(tx, "passthrough");

  return hash;
}
