import { FC } from 'react';

import BarChart from './components/BarChart';
import BarChartLockedConcentration from './components/BarChartLockedConcentration';
import BarChartSupplyConcentration from './components/BarChartSupplyConcentration';
import PieChart from './components/PieChart';
import LineAndBarChart from './components/LineAndBarChart';
import LineAndAreaChart from './components/LineAndAreaChart';
import LineChart from './components/LineChart';
import StackedBarChart from './components/StackedBarChart';
import StackedAreaChart from './components/StackedAreaChart';

interface Props {
  title: string;
  type: string;
  data: any;
}

const ChartComponent: FC<Props> = ({ type, data, title }) => {
  const chart = (() => {
    switch (type) {
      case 'BarChart':
        return <BarChart data={data} title={title} />;
      case 'PieChart':
        return <PieChart data={data} title={title} />;
      case 'LineChart':
        return <LineChart data={data} title={title} />;
      case 'LineAndBarChart':
        return <LineAndBarChart data={data} title={title} />;
      case 'LineAndAreaChart':
        return <LineAndAreaChart data={data} title={title} />;
      case 'StackedBarChart':
        return <StackedBarChart data={data} title={title} />;
      case 'StackedAreaChart':
        return <StackedAreaChart data={data} categories={data.categories} />;
      case 'BarChartSupplyConcentration':
        return <BarChartSupplyConcentration data={data} title={title} />;
      case 'BarChartLockedConcentration':
        return <BarChartLockedConcentration data={data} title={title} />;
      default:
        return null;
    }
  })();

  return chart;
};

export default ChartComponent;
