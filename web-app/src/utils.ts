export const normalizeHexString = (str: string): string => {
  let cleanStr = str;

  // strip 0x prefix
  if (
    cleanStr.length >= 2 &&
    cleanStr[0] === "0" &&
    (cleanStr[1] === "x" || cleanStr[1] === "X")
  ) {
    cleanStr = cleanStr.substring(2);
  }

  if ((cleanStr.length & 1) === 1) { // even length
    cleanStr = `0${cleanStr}`;
  }

  return cleanStr.toUpperCase();
};

export const normalizeAddress = (address: string): string => {
  let addr = normalizeHexString(address);

  if (addr.length > 64) {
    throw new Error("Invalid address length");
  }

  if (addr.length <= 32) {
    addr = addr.padStart(32, "0");
  } else if (addr.length < 64) {
    addr = addr.padStart(64, "0");
  }

  return addr;
};
