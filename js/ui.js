(function () {
  const state = {
    data: {
      dailyLogs: [],
      bloodReports: [],
      todos: [],
      schedule: []
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
    setupChat();
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
      await submitApiAction(HealthApi.ACTIONS.createTodo, { content, status: "undone" }, "待辦已新增");
      input.value = "";
    });

    document.getElementById("bloodToggle").addEventListener("change", (event) => {
      const fields = document.getElementById("bloodFields");
      fields.classList.toggle("hidden", !event.target.checked);
      fields.classList.toggle("grid", event.target.checked);
      event.target.setAttribute("aria-expanded", String(event.target.checked));
    });

    document.getElementById("dailyLogForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = HealthApi.buildDailyLogPayload(event.currentTarget);
      await submitApiAction(HealthApi.ACTIONS.createDailyLog, payload, "每日紀錄已儲存");
      event.currentTarget.reset();
    });

    document.getElementById("bloodReportForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = HealthApi.buildBloodReportPayload(event.currentTarget);
      await submitApiAction(HealthApi.ACTIONS.createBloodReport, payload, "血液報告已儲存");
      event.currentTarget.reset();
      document.getElementById("bloodToggle").checked = false;
      document.getElementById("bloodToggle").dispatchEvent(new Event("change"));
    });
  }

  async function submitApiAction(action, payload, successMessage) {
    if (!HealthApi.hasGasUrl()) {
      showToast("請先在設定頁填入 GAS API URL");
      return;
    }

    try {
      await HealthApi.request(action, payload);
      showToast(successMessage);
      await refreshIfAvailable();
    } catch (error) {
      showToast(error.message || "API 執行失敗");
    }
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
    renderSchedule(data.schedule);
    renderChart();
  }

  function setErrorState(message) {
    setDashboardStatus("error", message || "資料載入失敗");
    renderSummary(state.data);
    renderTodos(state.data.todos);
    renderSchedule(state.data.schedule);
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

    const pressure = latestDailyLog && latestDailyLog.bpSystolic !== null && latestDailyLog.bpDiastolic !== null
      ? `${latestDailyLog.bpSystolic}/${latestDailyLog.bpDiastolic}`
      : "--";
    document.getElementById("latestBloodPressure").textContent = pressure;
    document.getElementById("latestBloodPressureDate").textContent = latestDailyLog && latestDailyLog.date ? latestDailyLog.date : "尚無資料";

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
    document.getElementById("todoCount").textContent = `${openTodos.length} undone`;
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

  function renderSchedule(schedule) {
    const list = document.getElementById("scheduleList");
    const emptyState = document.getElementById("scheduleEmptyState");
    list.innerHTML = "";
    emptyState.classList.toggle("hidden", schedule.length > 0);

    schedule.forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0";
      row.innerHTML = `
        <div>
          <p class="text-sm font-medium text-slate-900">${escapeHtml(item.title || "未命名行程")}</p>
          <p class="text-xs text-slate-500">${escapeHtml(item.date || "")}</p>
        </div>
        <span class="text-xs text-slate-500">${escapeHtml(item.status || "")}</span>
      `;
      list.appendChild(row);
    });
  }

  function renderChart() {
    const select = document.getElementById("metricSelect");
    const hasChart = HealthCharts.renderTrendChart(document.getElementById("trendChart"), state.data, select.value);
    document.getElementById("chartEmptyState").classList.toggle("hidden", hasChart);
    document.getElementById("chartFrame").classList.toggle("hidden", !hasChart);
  }

  function setupChat() {
    const fab = document.getElementById("chatFab");
    const panel = document.getElementById("chatPanel");

    fab.addEventListener("click", () => {
      panel.classList.toggle("hidden");
      panel.classList.toggle("flex");
    });

    document.getElementById("closeChat").addEventListener("click", () => {
      panel.classList.add("hidden");
      panel.classList.remove("flex");
    });

    document.getElementById("chatForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("chatInput");
      const message = input.value.trim();
      if (!message) return;

      appendChatMessage(message, "user");
      input.value = "";

      if (!HealthApi.hasGasUrl()) {
        appendChatMessage("尚未設定 GAS API URL。Gemini 請求需透過後端代理，避免金鑰暴露在公開前端。", "ai");
        return;
      }

      try {
        const result = await HealthApi.request(HealthApi.ACTIONS.chatWithGemini, {
          message,
          context: state.data
        });
        appendChatMessage(result.reply || "目前沒有可顯示的回覆。", "ai");
      } catch (error) {
        appendChatMessage(error.message || "Gemini 代理請求失敗。", "ai");
      }
    });
  }

  function appendChatMessage(message, role) {
    const messages = document.getElementById("chatMessages");
    const bubble = document.createElement("div");
    bubble.className = role === "user" ? "chat-bubble-user" : "chat-bubble-ai";
    bubble.textContent = message;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
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
