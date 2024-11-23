export const FamilyIcon: React.FC<{ family: string }> = ({ family }) => {
  const bgColor = family && family.length > 8 ? `#${family.slice(2, 8)}` : `#f87171`;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full ml-2"
      style={{ backgroundColor: bgColor }}
    ></span>
  );
};
