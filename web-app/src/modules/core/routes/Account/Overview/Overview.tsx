import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Types } from "aptos";

import useAptos from "../../../../aptos";
import DetailsTable from "../../../../ui/DetailsTable";
import DetailRow from "../../../../ui/DetailsTable/DetailRow";
import HistoricalBalance from "../HistoricalBalance";

const Overview: FC = () => {
  const { accountAddress } = useParams();
  const aptos = useAptos();
  const [account, setAccount] = useState<Types.AccountData>();

  useEffect(() => {
    const load = async () => {
      const account = await aptos.getAccount(accountAddress!);
      setAccount(account);
    };
    load();
  }, []);

  return (
    <div>
      {account && (
        <div className="grid grid-cols-12 gap-4 py-4">
          <DetailsTable className="col-span-6 space-y-6">
            <DetailRow
              label="Authentication key"
              value={account.authentication_key}
            />
            <DetailRow
              label="Sequence Number"
              value={account.sequence_number}
            />
          </DetailsTable>
          <div className="col-span-6 space-y-6">
            <HistoricalBalance address={accountAddress!} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
