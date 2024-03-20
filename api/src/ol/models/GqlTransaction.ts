import { createUnionType } from "@nestjs/graphql";

import { GqlBlockMetadataTransaction } from "./GqlBlockMetadataTransaction.js";
import { GqlGenesisTransaction } from "./GqlGenesisTransaction.js";
import { GqlUserTransaction } from "./GqlUserTransaction.js";
import { GqlScriptUserTransaction } from "./GqlScriptUserTransaction.js";

export type AbstractTransaction =
  | GqlGenesisTransaction
  | GqlBlockMetadataTransaction
  | GqlUserTransaction
  | GqlScriptUserTransaction;

export const GqlTransaction = createUnionType({
  name: "Transaction",
  types: () =>
    [
      GqlGenesisTransaction,
      GqlBlockMetadataTransaction,
      GqlUserTransaction,
      GqlScriptUserTransaction,
    ] as const,
});
