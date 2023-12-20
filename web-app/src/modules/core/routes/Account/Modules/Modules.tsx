import { FC } from "react";
import { Outlet } from "react-router-dom";
import ModulesIndex from "./ModulesIndex";


const Modules: FC = () => {
  return (
    <div className="flex flex-row">
      <ModulesIndex />
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default Modules;
