(function () {
  const state = {
    data: {
      dailyLogs: [],
      bloodReports: [],
      todos: [],
      normalRanges: {}
    },
    onRefresh: null
  };

  function initUi(options) {
    state.onRefresh = options.onRefresh;
    document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("zh-Hant", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short"
    }).format(new Date());

    HealthCharts.populateMetricSelect(document.getElementById("metricSelect"));
    renderBloodFields();
    setupNavigation();
    setupSettings();
    setupForms();
  }

  function setupNavigation() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });
  }

  function showView(viewName) {
    document.querySelectorAll(".view").forEach((view) => view.classList.add("hidden"));
    document.getElementById(`${viewName}View`).classList.remove("hidden");

    document.querySelectorAll(".nav-link, .mobile-nav").forEach((button) => {
      const isActive = button.dataset.view === viewName;
      button.classList.toggle("active", isActive);
      button.classList.toggle("text-slate-500", !isActive);
    });
  }

  function setupSettings() {
    document.getElementById("gasUrl").value = HealthApi.getSettings().gasUrl || "";
    document.getElementById("saveSettings").addEventListener("click", async () => {
      HealthApi.saveSettings({
        gasUrl: document.getElementById("gasUrl").value
      });
      showToast("設定已儲存");
      await refreshIfAvailable();
    });
  }

  function setupForms() {
    document.getElementById("metricSelect").addEventListener("change", () => renderChart());

    document.getElementById("quickTodoForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("quickTodo");
      const content = input.value.trim();
      if (!content) return;
      const didSave = await submitApiAction(HealthApi.ACTIONS.createTodo, { content, status: "undone" }, "待辦已新增", event.submitter);
      if (didSave) {
        input.value = "";
      }
    });

    document.getElementById("deleteDoneTodos").addEventListener("click", async (event) => {
      const doneCount = state.data.todos.filter((todo) => todo.status === "done").length;
      if (!doneCount) return;
      await submitApiAction(HealthApi.ACTIONS.deleteCompletedTodos, {}, `已刪除 ${doneCount} 個已完成任務`, event.currentTarget);
    });

    document.getElementById("dailyLogForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = HealthApi.buildDailyLogPayload(event.currentTarget);
      const didConfirm = await confirmPayload("確認每日基本紀錄", buildDailyLogConfirmationRows(payload));
      if (!didConfirm) return;
      const didSave = await submitApiAction(HealthApi.ACTIONS.createDailyLog, payload, "每日紀錄已新增到 Google Sheet", event.submitter);
      if (didSave) {
        event.currentTarget.reset();
      }
    });

    document.getElementById("bloodReportForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = HealthApi.buildBloodReportPayload(event.currentTarget);
      const didConfirm = await confirmPayload("確認專業血液報告", buildBloodReportConfirmationRows(payload));
      if (!didConfirm) return;
      const didSave = await submitApiAction(HealthApi.ACTIONS.createBloodReport, payload, "血液報告已新增到 Google Sheet", event.submitter);
      if (didSave) {
        event.currentTarget.reset();
      }
    });
  }

  function buildDailyLogConfirmationRows(payload) {
    return [
      { label: "日期", value: payload.date },
      { label: "體重", value: payload.weight, unit: "kg" },
      { label: "收縮壓", value: payload.bpSystolic, unit: "mmHg" },
      { label: "舒張壓", value: payload.bpDiastolic, unit: "mmHg" },
      { label: "備註", value: payload.notes }
    ];
  }

  function buildBloodReportConfirmationRows(payload) {
    const rows = [
      { label: "檢驗日期", value: payload.testDate }
    ];

    window.HealthConfig.BLOOD_REPORT_FIELDS.forEach((field) => {
      rows.push({ label: field.label, value: payload[field.key] });
    });

    return rows;
  }

  function confirmPayload(title, rows) {
    return new Promise((resolve) => {
      const dialog = document.getElementById("confirmDialog");
      const titleElement = document.getElementById("confirmDialogTitle");
      const content = document.getElementById("confirmDialogContent");
      const cancelButton = document.getElementById("cancelConfirmDialog");
      const acceptButton = document.getElementById("acceptConfirmDialog");

      titleElement.textContent = title;
      content.innerHTML = rows.map((row) => {
        const value = formatConfirmationValue(row.value, row.unit);
        return `
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
            <span class="text-slate-500">${escapeHtml(row.label)}</span>
            <span class="max-w-[60%] text-right font-medium text-slate-900">${escapeHtml(value)}</span>
          </div>
        `;
      }).join("");

      const cleanup = (result) => {
        dialog.classList.add("hidden");
        dialog.classList.remove("flex");
        cancelButton.removeEventListener("click", onCancel);
        acceptButton.removeEventListener("click", onAccept);
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };

      const onCancel = () => cleanup(false);
      const onAccept = () => cleanup(true);
      const onKeydown = (event) => {
        if (event.key === "Escape") {
          cleanup(false);
        }
      };

      cancelButton.addEventListener("click", onCancel);
      acceptButton.addEventListener("click", onAccept);
      document.addEventListener("keydown", onKeydown);
      dialog.classList.remove("hidden");
      dialog.classList.add("flex");
      acceptButton.focus();
    });
  }

  function formatConfirmationValue(value, unit) {
    if (value === null || value === undefined || value === "") {
      return "未填寫";
    }
    return unit ? `${value} ${unit}` : String(value);
  }

  async function submitApiAction(action, payload, successMessage, submitButton) {
    if (!HealthApi.hasGasUrl()) {
      showToast("請先在設定頁填入 GAS API URL");
      return false;
    }

    if (submitButton && submitButton.disabled) {
      return false;
    }

    setSubmitButtonLoading(submitButton, true);
    try {
      await HealthApi.request(action, payload);
      showToast(successMessage);
      await refreshIfAvailable();
      return true;
    } catch (error) {
      showToast(error.message || "API 執行失敗");
      return false;
    } finally {
      setSubmitButtonLoading(submitButton, false);
    }
  }

  function setSubmitButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "儲存中...";
      button.disabled = true;
      button.classList.add("cursor-not-allowed", "opacity-70");
      return;
    }

    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("cursor-not-allowed", "opacity-70");
    delete button.dataset.originalText;
  }

  async function refreshIfAvailable() {
    if (typeof state.onRefresh === "function") {
      await state.onRefresh();
    }
  }

  function renderBloodFields() {
    const fields = document.getElementById("bloodFields");
    const dateField = `
      <label class="block">
        <span class="text-sm font-medium text-slate-500">檢驗日期</span>
        <input class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[16px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" name="testDate" type="date">
      </label>
    `;
    const metricFields = window.HealthConfig.BLOOD_REPORT_FIELDS.map((field) => `
      <label class="block">
        <span class="text-sm font-medium text-slate-500">${escapeHtml(field.label)}</span>
        <input class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[16px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" name="${field.key}" type="number" step="0.01">
      </label>
    `).join("");
    fields.innerHTML = dateField + metricFields;
  }

  function setLoadingState() {
    setDashboardStatus("loading", "資料載入中...");
  }

  function setDashboardData(data) {
    state.data = data;
    if (!HealthApi.hasGasUrl()) {
      setDashboardStatus("info", "尚未設定 GAS API URL，目前顯示空狀態。");
    } else {
      hideDashboardStatus();
    }
    renderSummary(data);
    renderTodos(data.todos);
    renderChart();
  }

  function setErrorState(message) {
    setDashboardStatus("error", message || "資料載入失敗");
    renderSummary(state.data);
    renderTodos(state.data.todos);
    renderChart();
  }

  function setDashboardStatus(type, message) {
    const status = document.getElementById("dashboardStatus");
    status.className = "rounded-md border px-4 py-3 text-sm";
    status.classList.toggle("hidden", false);
    status.textContent = message;

    if (type === "error") {
      status.classList.add("border-rose-200", "bg-rose-50", "text-rose-700");
      return;
    }
    status.classList.add("border-slate-200", "bg-white", "text-slate-600");
  }

  function hideDashboardStatus() {
    document.getElementById("dashboardStatus").classList.add("hidden");
  }

  function renderSummary(data) {
    const latestDailyLog = getLatestRow(data.dailyLogs, "date");
    const latestBloodReport = getLatestRow(data.bloodReports, "testDate");

    document.getElementById("latestWeight").textContent = formatNullableNumber(latestDailyLog && latestDailyLog.weight);
    document.getElementById("latestWeightDate").textContent = latestDailyLog && latestDailyLog.date ? latestDailyLog.date : "尚無資料";

    document.getElementById("latestBpSystolic").textContent = formatNullableNumber(latestDailyLog && latestDailyLog.bpSystolic);
    document.getElementById("latestBpSystolicDate").textContent = latestDailyLog && latestDailyLog.date ? latestDailyLog.date : "尚無資料";
    document.getElementById("latestBpDiastolic").textContent = formatNullableNumber(latestDailyLog && latestDailyLog.bpDiastolic);
    document.getElementById("latestBpDiastolicDate").textContent = latestDailyLog && latestDailyLog.date ? latestDailyLog.date : "尚無資料";

    const blast = latestBloodReport ? latestBloodReport.Blast : null;
    const blastElement = document.getElementById("latestBlast");
    blastElement.textContent = formatNullableNumber(blast);
    blastElement.classList.toggle("font-bold", Number(blast) > 0);
    blastElement.classList.toggle("text-rose-500", Number(blast) > 0);
    document.getElementById("latestBlastDate").textContent = latestBloodReport && latestBloodReport.testDate ? latestBloodReport.testDate : "尚無資料";
  }

  function renderTodos(todos) {
    const list = document.getElementById("todoList");
    const emptyState = document.getElementById("todoEmptyState");
    const openTodos = todos.filter((todo) => todo.status !== "done");
    const doneTodos = todos.filter((todo) => todo.status === "done");
    document.getElementById("todoCount").textContent = `${openTodos.length} undone`;
    document.getElementById("deleteDoneTodos").disabled = doneTodos.length === 0;
    list.innerHTML = "";
    emptyState.classList.toggle("hidden", todos.length > 0);

    todos.forEach((todo) => {
      const item = document.createElement("li");
      item.className = "flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2";
      item.innerHTML = `
        <input class="h-4 w-4 rounded border-slate-200 text-blue-600 focus:ring-blue-600" type="checkbox" ${todo.status === "done" ? "checked" : ""} aria-label="更新待辦狀態">
        <span class="min-w-0 flex-1 text-sm ${todo.status === "done" ? "text-slate-500 line-through" : "text-slate-900"}">${escapeHtml(todo.content)}</span>
      `;
      item.querySelector("input").addEventListener("change", async (event) => {
        await submitApiAction(HealthApi.ACTIONS.updateTodoStatus, {
          taskId: todo.taskId,
          status: event.target.checked ? "done" : "undone"
        }, "待辦狀態已更新");
      });
      list.appendChild(item);
    });
  }

  function renderChart() {
    const select = document.getElementById("metricSelect");
    const hasChart = HealthCharts.renderTrendChart(document.getElementById("trendChart"), state.data, select.value);
    document.getElementById("chartEmptyState").classList.toggle("hidden", hasChart);
    document.getElementById("chartFrame").classList.toggle("hidden", !hasChart);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed left-1/2 top-5 z-40 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  function getLatestRow(rows, dateKey) {
    return rows.length ? rows[rows.length - 1] : null;
  }

  function formatNullableNumber(value) {
    return value === null || value === undefined || value === "" ? "--" : String(value);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.HealthUi = {
    initUi,
    setLoadingState,
    setDashboardData,
    setErrorState
  };
})();
