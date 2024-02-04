import { FC } from 'react';
import './Coinstats.css';

import KPIComponent from './components/KPIComponent';
import ChartComponent from './ChartComponent';

interface Props {
  title?: string;
  data: {
    kpis?: any[];
    chartRows?: {
      title: string;
      type: string;
      data: any;
    }[][];
  };
}

const Section: FC<Props> = ({ title, data }) => {
  const formatValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      // Format the value as a string combining nominal and percentage
      const formattedValue = `${value.nominal.toLocaleString()} (${value.percentage.toFixed(4)}%)`;
      return formattedValue;
    }
    // Format the value directly if it's not an object
    return value.toLocaleString();
  };

  return (
    <div className="">
      {title && (
        <h2 className="mt-3 mb-5 text-xl font-semibold leading-6 text-gray-900">
          {title}
        </h2>
      )}
      {data.kpis && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-2">
          {data.kpis.map((kpi, index) => (
            <KPIComponent
              key={index}
              title={kpi.title}
              value={formatValue(kpi.value)}
              unit={kpi.unit}
            />
          ))}
        </div>
      )}
      {data.chartRows &&
        data.chartRows.map((row, rowIndex) => (
          <div key={rowIndex} className="charts-row">
            {row.map((chart, chartIndex) => (
              <ChartComponent
                key={chartIndex}
                type={chart.type}
                data={chart.data}
                title={chart.title}
              />
            ))}
          </div>
        ))}
    </div>
  );
};

export default Section;