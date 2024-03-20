import { Buffer } from "buffer";
import { Decimal } from "decimal.js";
import { GqlMovement, GqlTransaction } from "./gql-types";
import { Transaction, Movement, GenesisTransaction, UserTransaction, BlockMetadataTransaction } from "./types";
import { BN } from "bn.js";

export const gqlTransactionMapper = (gqlTransaction: GqlTransaction): Transaction => {
  switch (gqlTransaction.__typename) {
    case "GenesisTransaction":
      return new GenesisTransaction({
        version: new BN(gqlTransaction.version),
        timestamp: new BN(gqlTransaction.timestamp),
      });

    case "UserTransaction":
      return new UserTransaction({
        version: new BN(gqlTransaction.version),
        timestamp: new BN(gqlTransaction.timestamp),
        success: gqlTransaction.success,
        moduleAddress: Buffer.from(gqlTransaction.moduleAddress, "hex"),
        moduleName: gqlTransaction.moduleName,
        functionName: gqlTransaction.functionName,
        sender: Buffer.from(gqlTransaction.sender, "hex"),
        arguments: gqlTransaction.arguments,
      });

    case "BlockMetadataTransaction":
      return new BlockMetadataTransaction({
        version: new BN(gqlTransaction.version),
        timestamp: new BN(gqlTransaction.timestamp),
        epoch: new BN(gqlTransaction.epoch),
      });
  }

  throw new Error(`Invalid transaction type ${(gqlTransaction as any).__typename}`);
}

export const gqlMovementMapper = (gqlMovement: GqlMovement): Movement => {
  return new Movement({
    balance: new Decimal(gqlMovement.balance),
    transaction: gqlTransactionMapper(gqlMovement.transaction),
  });
}
