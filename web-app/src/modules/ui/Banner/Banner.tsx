import { FC } from 'react';
import clsx from 'clsx';

const Banner: FC = () => {
  return (
    <div
      className={clsx(
        'flex items-center gap-x-6 bg-gray-900 px-6 py-2.5 sm:px-3.5',
        'justify-center',
      )}
    >
      <p className="text-sm leading-6 text-white">
        <a href="https://twitter.com/0LNetwork/status/1768791010283282611">
          <strong className="font-semibold">Chain is under maintenance</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          See the announcement&nbsp;
          <span aria-hidden="true">&rarr;</span>
        </a>
      </p>
    </div>
  );
};

export default Banner;
