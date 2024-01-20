import { Component, ReactNode, createRef } from "react";
import {
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeriesOptions,
  LineStyleOptions,
  SeriesOptionsCommon,
  Time,
  WhitespaceData,
  createChart,
} from "lightweight-charts";
import _ from "lodash";

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  data?: {
    time: Time;
    value: number;
  }[];
};

const lineOptions = {
  color: '#e8595c'
};

class Chart extends Component<Props> {
  private readonly resizeObserver: ResizeObserver;

  private readonly container = createRef<HTMLDivElement>();

  private readonly chartContainer = createRef<HTMLDivElement>();

  private chart?: IChartApi;

  private lineSeries?: ISeriesApi<
    "Line",
    Time,
    LineData<Time> | WhitespaceData<Time>,
    LineSeriesOptions,
    DeepPartial<LineStyleOptions & SeriesOptionsCommon>
  >;

  private onResize = _.debounce(() => {
    if (!this.chart) {
      return;
    }

    const el = this.container.current;
    if (!el) {
      return;
    }

    const chartContainer = this.chartContainer.current;
    if (!chartContainer) {
      return;
    }

    const rect = el.getBoundingClientRect();
    this.chart.resize(rect.width, rect.height);
  }, 100);

  public constructor(props: Props) {
    super(props);

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
  }

  public render(): ReactNode {
    const { data, ...props } = this.props;

    return (
      <div {...props} ref={this.container}>
        <div ref={this.chartContainer} />
      </div>
    );
  }

  public componentDidMount(): void {
    const rect = this.container.current!.getBoundingClientRect();
    const chart = createChart(this.chartContainer.current!, {
      width: rect.width,
      height: rect.height,
      localization: {
        priceFormatter: (price: number): string => {
          return price.toLocaleString();
        },
      },
      rightPriceScale: {

        scaleMargins: {
          bottom: 0,
          top: 0.1
        }
      }
    });

    if (this.props.data) {
      const lineSeries = chart.addLineSeries(lineOptions);
      lineSeries.setData(this.props.data);
      this.lineSeries = lineSeries;
    }

    this.chart = chart;

    this.resizeObserver.observe(this.container.current!);
  }

  public componentWillUnmount(): void {
    this.resizeObserver.unobserve(this.container.current!);

    if (this.chart) {
      this.chart.remove();
      this.chart = undefined;
    }
  }

  public componentDidUpdate(prevProps: Readonly<Props>): void {
    if (!this.props.data) {
      if (this.lineSeries) {
        this.chart?.removeSeries(this.lineSeries);
        this.lineSeries = undefined;
      }
    } else if (this.props.data !== prevProps.data) {
      if (this.lineSeries) {
        this.lineSeries.setData(this.props.data);
      } else {
        const lineSeries = this.chart!.addLineSeries(lineOptions);
        lineSeries.setData(this.props.data);
        this.lineSeries = lineSeries;
      }
    }
  }
}

export default Chart;
