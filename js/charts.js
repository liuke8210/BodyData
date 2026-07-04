(function () {
  let trendChart = null;

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
            backgroundColor: "rgba(37, 99, 235, 0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#2563eb",
            fill: true,
            tension: 0.32
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

  window.HealthCharts = {
    populateMetricSelect,
    renderTrendChart,
    destroyTrendChart
  };
})();
