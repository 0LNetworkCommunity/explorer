import { FC } from "react";

const Postero: FC = () => {
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("postero_enabled", "true");
          alert("Good! Just refresh this page now.");
        }}
      >
        Enable Postero
      </button>
    </div>
  );
};

export default Postero;
