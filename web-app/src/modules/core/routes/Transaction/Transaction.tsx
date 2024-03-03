import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Page from "../../../ui/Page/Page";
import useAptos from "../../../aptos";
import { Types } from "aptos";
import BlockMetadataTransactionDetails from "./BlockMetadataTransactionDetails";
import UserTransactionDetails from "./UserTransactionDetails";
import StateCheckpointTransactionDetails from "./StateCheckpointTransactionDetails";

const Transaction: FC = () => {
  const { version } = useParams();
  const [transaction, setTransaction] = useState<Types.Transaction>();

  const aptos = useAptos();

  useEffect(() => {
    const load = async () => {
      const transaction = await aptos.getTransactionByVersion(
        parseInt(version!, 10)
      );
      setTransaction(transaction);
    };
    load();
  }, [version]);

  return (
    <Page title={`Transaction: ${version}`} __deprecated_grayBg>
      {transaction && (
        <div>
          {transaction.type === "block_metadata_transaction" && (
            <BlockMetadataTransactionDetails
              transaction={transaction as Types.BlockMetadataTransaction}
            />
          )}
          {transaction.type === "user_transaction" && (
            <UserTransactionDetails
              transaction={transaction as Types.UserTransaction}
            />
          )}
          {transaction.type === "state_checkpoint_transaction" && (
            <StateCheckpointTransactionDetails
              transaction={transaction as Types.StateCheckpointTransaction}
            />
          )}
          {![
            "user_transaction",
            "block_metadata_transaction",
            "state_checkpoint_transaction",
          ].includes(transaction.type) && <div>{transaction.type}</div>}
        </div>
      )}
    </Page>
  );
};

export default Transaction;
