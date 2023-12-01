import { createBrowserRouter } from "react-router-dom";
import Transactions from "./routes/Transactions";
import Transaction from "./routes/Transaction";
import Home from "./routes/Home";
import Account from "./routes/Account";
import AccountOverview from "./routes/Account/Overview";
import AccountTransactions from "./routes/Account/UserTransactions";
import AccountResources from "./routes/Account/Resources";
import AccountModules from "./routes/Account/Modules";
import Block from "./routes/Block";
import Root from "./Root";
import Validators from "./routes/Validators";
import Test from "./routes/Test";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/accounts/:accountAddress",
        element: <Account />,
        children: [
          {
            index: true,
            element: <AccountOverview />,
          },
          {
            path: "transactions",
            element: <AccountTransactions />,
          },
          {
            path: "resources",
            element: <AccountResources />,
          },
          {
            path: "modules",
            element: <AccountModules />,
          },
        ],
      },
      {
        path: "/transactions",
        element: <Transactions />,
      },
      {
        path: "/transactions/:version",
        element: <Transaction />,
      },
      {
        path: "/blocks/:blockHeight",
        element: <Block />,
      },
      {
        path: "/validators",
        element: <Validators />,
      },
      {
        path: "/test",
        element: <Test />,
      },
    ],
  },
]);

export default router;
