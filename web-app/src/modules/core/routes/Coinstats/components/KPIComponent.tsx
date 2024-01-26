import { FC } from "react";

interface Props {
  title: string;
  unit?: string;
  value: string;
}

const KPIComponent: FC<Props> = ({ title, value, unit = "" }) => (
  <div className="kpi-container">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">
      {unit}
      {value}
    </div>
  </div>
);

export default KPIComponent;
