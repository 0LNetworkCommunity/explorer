import { useContext } from "react";
import aptoContext from "./context";
export { default as AptosProvider } from "./Provider";

const useAptos = () => useContext(aptoContext);

export default useAptos;
