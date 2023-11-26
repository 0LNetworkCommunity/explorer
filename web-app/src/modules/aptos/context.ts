import { createContext } from "react";
import { AptosClient } from "aptos";

const aptoContext = createContext<AptosClient>(null as never);

export default aptoContext;
