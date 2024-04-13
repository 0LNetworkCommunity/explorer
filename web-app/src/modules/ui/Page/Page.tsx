import clsx from 'clsx';
import { FC, PropsWithChildren, ReactNode } from 'react';

type Props = PropsWithChildren<{
  title?: string | ReactNode;
  __deprecated_grayBg: boolean;
}>;

const Page: FC<Props> = ({ title, children, __deprecated_grayBg: grayBg }) => {
  return (
    <>
      {title && (
        <header className="bg-white shadow-sm">
          <div className="px-3 py-3">
            {typeof title === 'string' ? (
              <h1 className="text-base font-semibold leading-6 text-gray-900 overflow-hidden text-ellipsis">
                {title}
              </h1>
            ) : (
              <>{title}</>
            )}
          </div>
        </header>
      )}
      <main className={clsx('py-3 px-3 flex-grow', grayBg && 'bg-gray-100')}>{children}</main>
    </>
  );
};

export default Page;
