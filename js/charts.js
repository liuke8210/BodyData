(function () {
  let trendChart = null;

  const normalRangePlugin = {
    id: "normalRangeBackground",
    beforeDatasetsDraw(chart, args, options) {
      const range = options.range;
      if (!range || (range.normalMin === null && range.normalMax === null)) {
        return;
      }

      const yScale = chart.scales.y;
      const { ctx, chartArea } = chart;
      const topValue = range.normalMax === null ? yScale.max : range.normalMax;
      const bottomValue = range.normalMin === null ? yScale.min : range.normalMin;
      const top = clamp(yScale.getPixelForValue(topValue), chartArea.top, chartArea.bottom);
      const bottom = clamp(yScale.getPixelForValue(bottomValue), chartArea.top, chartArea.bottom);
      const y = Math.min(top, bottom);
      const height = Math.max(Math.abs(bottom - top), 4);

      ctx.save();
      ctx.fillStyle = "rgba(20, 184, 166, 0.10)";
      ctx.fillRect(chartArea.left, y, chartArea.right - chartArea.left, height);
      ctx.restore();
    }
  };

  if (window.Chart) {
    Chart.register(normalRangePlugin);
  }

  function populateMetricSelect(select) {
    select.innerHTML = "";
    window.HealthConfig.METRIC_GROUPS.forEach((group) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;
      group.metrics.forEach((metric) => {
        const option = document.createElement("option");
        option.value = `${metric.source}:${metric.key}`;
        option.textContent = metric.label;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });
  }

  function getMetricByValue(value) {
    const metrics = window.HealthConfig.METRIC_GROUPS.flatMap((group) => group.metrics);
    return metrics.find((metric) => `${metric.source}:${metric.key}` === value) || metrics[0];
  }

  function renderTrendChart(canvas, data, selectedValue) {
    const metric = getMetricByValue(selectedValue);
    const rows = data[metric.source] || [];
    const normalRange = data.normalRanges ? data.normalRanges[metric.key] : null;
    const points = rows
      .filter((row) => row[metric.key] !== null && row[metric.key] !== undefined && row[metric.dateKey])
      .map((row) => ({
        label: formatDateLabel(row[metric.dateKey]),
        value: row[metric.key]
      }));

    destroyTrendChart();

    if (!points.length) {
      return false;
    }

    trendChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            label: metric.unit ? `${metric.label} (${metric.unit})` : metric.label,
            data: points.map((point) => point.value),
            borderColor: "#2563eb",
            backgroundColor: "#2563eb",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#2563eb",
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            displayColors: false
          },
          normalRangeBackground: {
            range: normalRange
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: "#64748b"
            }
          },
        y: {
          suggestedMin: getSuggestedScaleBound(points, normalRange, "min"),
          suggestedMax: getSuggestedScaleBound(points, normalRange, "max"),
          border: {
            display: false
          },
            grid: {
              color: "#e2e8f0"
            },
            ticks: {
              color: "#64748b"
            }
          }
        }
      }
    });

    return true;
  }

  function destroyTrendChart() {
    if (trendChart) {
      trendChart.destroy();
      trendChart = null;
    }
  }

  function formatDateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat("zh-Hant", {
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function getSuggestedScaleBound(points, range, type) {
    const values = points.map((point) => point.value);
    if (range) {
      if (range.normalMin !== null) values.push(range.normalMin);
      if (range.normalMax !== null) values.push(range.normalMax);
    }
    if (!values.length) {
      return undefined;
    }

    const value = type === "min" ? Math.min(...values) : Math.max(...values);
    const padding = Math.max(Math.abs(value) * 0.05, 1);
    return type === "min" ? value - padding : value + padding;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  window.HealthCharts = {
    populateMetricSelect,
    renderTrendChart,
    destroyTrendChart
  };
})();
