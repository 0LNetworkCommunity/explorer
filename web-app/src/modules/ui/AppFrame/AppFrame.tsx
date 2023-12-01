import { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import Logo from "../Logo/Logo";
import { Link, NavLink } from "react-router-dom";

const navigation = [
  { name: "Transactions", to: "/transactions" },
  { name: "Validators", to: "/validators" },
];

const AppFrame: FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div className="min-h-full">
        <nav className="bg-primary-500">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/">
                    <Logo className="h-8 w-8" />
                  </Link>
                </div>
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigation.map((item, index) => (
                    <NavLink
                      key={index}
                      end
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          isActive
                            ? "bg-primary-700 text-white"
                            : "text-white hover:underline",
                          "rounded-md px-3 py-2 text-md font-medium",
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {children}
      </div>
    </>
  );
};

export default AppFrame;
