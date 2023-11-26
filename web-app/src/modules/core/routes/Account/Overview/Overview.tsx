import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Types } from "aptos";

import useAptos from "../../../../aptos";
import DetailsTable from "../../../../ui/DetailsTable";
import DetailRow from "../../../../ui/DetailsTable/DetailRow";

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
        <DetailsTable>
          <DetailRow
            label="Authentication key"
            value={account.authentication_key}
          />
          <DetailRow label="Sequence Number" value={account.sequence_number} />
        </DetailsTable>
      )}
    </div>
  );
};

export default Overview;
