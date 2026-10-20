import { useEffect, useId, useRef } from "react";
import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { chartColors, chartNumber } from "./chart-data";
import "./DashboardChart.css";

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

export default function DashboardChart({
  title,
  description,
  type = "bar",
  labels = [],
  datasets = [],
  axisLabel = "Count",
  max,
  precision = 0,
  horizontal = false,
  height = 280,
  emptyMessage = "No records are available for this chart.",
}) {
  const canvas = useRef(null);
  const id = useId();
  const isDoughnut = type === "doughnut";
  const hasData =
    labels.length > 0 &&
    datasets.some((series) =>
      series.data.some((value) => {
        const number = chartNumber(value);
        return number !== null && (!isDoughnut || number > 0);
      }),
    );

  useEffect(() => {
    if (!canvas.current || !hasData) return;
    const valueAxis = {
      beginAtZero: true,
      ...(max == null ? {} : { max }),
      ticks: { precision },
      title: { display: true, text: axisLabel },
      grid: { color: "#eee4ee" },
    };
    const categoryAxis = {
      grid: { display: false },
      ticks: {
        autoSkip: false,
        maxRotation: horizontal ? 0 : 35,
        callback(value) {
          const label = String(this.getLabelForValue(value));
          return label.length > 28 ? `${label.slice(0, 26)}…` : label;
        },
      },
    };
    const chart = new Chart(canvas.current, {
      type,
      data: {
        labels: [...labels],
        datasets: datasets.map((series, index) => ({
          borderColor: chartColors[index % chartColors.length],
          backgroundColor: isDoughnut ? chartColors : chartColors[index % chartColors.length],
          borderWidth: isDoughnut ? 2 : type === "line" ? 3 : 0,
          ...(type === "bar" ? { borderRadius: 5, maxBarThickness: 44 } : {}),
          ...(type === "line" ? { pointRadius: 4, pointHoverRadius: 6, spanGaps: false } : {}),
          ...series,
          // Chart.js mutates its data; keep React's props independent.
          data: series.data.map(chartNumber),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? false
          : { duration: 250 },
        color: "#5e4d63",
        font: { family: "'DM Sans', sans-serif" },
        ...(isDoughnut
          ? { cutout: "64%" }
          : {
              indexAxis: horizontal ? "y" : "x",
              scales: horizontal
                ? { x: valueAxis, y: categoryAxis }
                : { x: categoryAxis, y: valueAxis },
            }),
        plugins: {
          legend: {
            display: isDoughnut || datasets.length > 1,
            position: "bottom",
            labels: { usePointStyle: true, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = chartNumber(context.raw);
                return `${context.dataset.label}: ${value == null ? "Unavailable" : value.toLocaleString(undefined, { maximumFractionDigits: precision })}`;
              },
            },
          },
        },
      },
    });
    // Required on unmount, filter changes, and React StrictMode remounts.
    return () => chart.destroy();
  }, [type, labels, datasets, axisLabel, max, precision, horizontal, isDoughnut, hasData]);

  return (
    <figure className="dashboard-chart" aria-labelledby={`${id}-title`}>
      <figcaption id={`${id}-title`} className="dashboard-chart-title">
        {title}
      </figcaption>
      {description && (
        <p id={`${id}-description`} className="dashboard-chart-description">
          {description}
        </p>
      )}
      {hasData ? (
        <div className="dashboard-chart-canvas" style={{ height }}>
          <canvas
            ref={canvas}
            role="img"
            aria-label={title}
            aria-describedby={`${id}-table${description ? ` ${id}-description` : ""}`}
          >
            Chart values are available in the data table below.
          </canvas>
        </div>
      ) : (
        <p className="dashboard-chart-empty" role="status">
          {emptyMessage}
        </p>
      )}
      {labels.length > 0 && (
        <details className="dashboard-chart-data" id={`${id}-table`}>
          <summary>View chart data</summary>
          <div
            className="dashboard-chart-table"
            tabIndex={0}
            role="region"
            aria-label={`${title} data`}
          >
            <table>
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  {datasets.map((series, index) => (
                    <th scope="col" key={index}>
                      {series.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, index) => (
                  <tr key={`${index}-${label}`}>
                    <th scope="row">{label}</th>
                    {datasets.map((series, seriesIndex) => {
                      const value = chartNumber(series.data[index]);
                      return (
                        <td key={seriesIndex}>
                          {value == null
                            ? "Unavailable"
                            : value.toLocaleString(undefined, { maximumFractionDigits: precision })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
