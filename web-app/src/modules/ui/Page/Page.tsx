import { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title?: string;
}>;

const Page: FC<Props> = ({ title, children }) => {
  return (
    <>
      {title && (
        <header className="bg-white shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold leading-6 text-gray-900">
              {title}
            </h1>
          </div>
        </header>
      )}
      <main>
        <div className="py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  );
};

export default Page;
