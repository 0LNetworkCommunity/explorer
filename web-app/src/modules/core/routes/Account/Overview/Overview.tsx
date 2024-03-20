import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Types } from "aptos";

import useAptos from "../../../../aptos";
import HistoricalBalance from "../HistoricalBalance";
import Movements from "../Movements";

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
        <div>
          <div className="grid grid-cols-12 gap-4 py-4">
            <div className="col-span-6 space-y-6">
              <Movements address={accountAddress!} />
            </div>
            <div className="col-span-6 space-y-6">
              <HistoricalBalance address={accountAddress!} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
