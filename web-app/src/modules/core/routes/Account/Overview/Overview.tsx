import { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Types } from 'aptos';

import useAptos from '../../../../aptos';
import HistoricalBalance from '../HistoricalBalance';
import Movements from '../Movements';
import Ancestry from '../Ancestry';
import Vouching from '../Vouching';

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
  }, [accountAddress]);

  return (
    <div>
      {account && (
        <div>
          <div className="grid grid-cols-12 gap-4 py-4">
            <div className="col-span-12 md:col-span-7 space-y-6">
              <Movements address={accountAddress!} />
            </div>
            <div className="col-span-12 md:col-span-5 space-y-6">
              <HistoricalBalance address={accountAddress!} />
              <Ancestry address={accountAddress!} />
              <Vouching address={accountAddress!} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
