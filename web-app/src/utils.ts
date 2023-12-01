export const normalizeHexString = (input: string) => {
  let normalized = input.toUpperCase();
  if (normalized.substring(0, 2) === "0X") {
    normalized = normalized.substring(2);
  }
  return normalized;
};
