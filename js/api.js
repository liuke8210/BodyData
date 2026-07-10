(function () {
  const { ACTIONS, SETTINGS_KEY } = window.HealthConfig;

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      gasUrl: String(settings.gasUrl || "").trim()
    }));
  }

  function getGasUrl() {
    return String(getSettings().gasUrl || "").trim();
  }

  function hasGasUrl() {
    return Boolean(getGasUrl());
  }

  async function request(action, payload) {
    const gasUrl = getGasUrl();
    if (!gasUrl) {
      throw new Error("尚未設定 GAS API URL");
    }

    const response = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action, payload: payload || {} })
    });

    if (!response.ok) {
      throw new Error(`API 回應失敗：${response.status}`);
    }

    const data = await response.json();
    if (data && data.ok === false) {
      throw new Error(data.error || "API 執行失敗");
    }

    return data && Object.prototype.hasOwnProperty.call(data, "data") ? data.data : data;
  }

  async function getDashboardData() {
    if (!hasGasUrl()) {
      return normalizeDashboardData({});
    }

    const data = await request(ACTIONS.getDashboardData);
    return normalizeDashboardData(data);
  }

  function normalizeDashboardData(data) {
    return {
      dailyLogs: normalizeDailyLogs(data.dailyLogs),
      bloodReports: normalizeBloodReports(data.bloodReports),
      todos: normalizeTodos(data.todos),
      normalRanges: normalizeNormalRanges(data.normalRanges)
    };
  }

  function normalizeDailyLogs(rows) {
    return normalizeArray(rows).map((row) => ({
      date: normalizeString(row.date),
      weight: normalizeNumber(row.weight),
      bpSystolic: normalizeNumber(row.bpSystolic),
      bpDiastolic: normalizeNumber(row.bpDiastolic),
      notes: normalizeString(row.notes)
    })).sort((a, b) => compareDate(a.date, b.date));
  }

  function normalizeBloodReports(rows) {
    return normalizeArray(rows).map((row) => ({
      testDate: normalizeString(row.testDate),
      CRP: normalizeNumber(row.CRP),
      eGFR: normalizeNumber(row.eGFR),
      Albumin: normalizeNumber(row.Albumin),
      WBC: normalizeNumber(row.WBC),
      RBC: normalizeNumber(row.RBC),
      HGB: normalizeNumber(row.HGB),
      HCT: normalizeNumber(row.HCT),
      PLT: normalizeNumber(row.PLT),
      Blast: normalizeNumber(row.Blast),
      Stab: normalizeNumber(row.Stab),
      Seg: normalizeNumber(row.Seg),
      MatureNeutrophils: normalizeNumber(row.MatureNeutrophils)
    })).sort((a, b) => compareDate(a.testDate, b.testDate));
  }

  function normalizeTodos(rows) {
    return normalizeArray(rows).map((row) => ({
      taskId: normalizeString(row.taskId),
      createdAt: normalizeString(row.createdAt),
      content: normalizeString(row.content),
      status: row.status === "done" ? "done" : "undone"
    }));
  }

  function normalizeNormalRanges(rows) {
    const keyAliases = {
      SBP: "bpSystolic",
      DBP: "bpDiastolic",
      "Mature neutrophil": "MatureNeutrophils"
    };

    return normalizeArray(rows).reduce((ranges, row) => {
      const rawKey = normalizeString(row.key);
      const key = keyAliases[rawKey] || rawKey;
      if (!key) {
        return ranges;
      }

      const normalMin = normalizeNumber(row.normalMin);
      const normalMax = normalizeNumber(row.normalMax);
      if (normalMin === null && normalMax === null) {
        return ranges;
      }

      ranges[key] = {
        key,
        label: normalizeString(row.label) || key,
        normalMin,
        normalMax,
        unit: normalizeString(row.unit || row.Unit)
      };
      return ranges;
    }, {});
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeString(value) {
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function normalizeNumber(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function compareDate(a, b) {
    return toDateValue(a) - toDateValue(b);
  }

  function toDateValue(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function buildDailyLogPayload(form) {
    const formData = new FormData(form);
    return {
      date: normalizeString(formData.get("date")),
      weight: normalizeNumber(formData.get("weight")),
      bpSystolic: normalizeNumber(formData.get("bpSystolic")),
      bpDiastolic: normalizeNumber(formData.get("bpDiastolic")),
      notes: normalizeString(formData.get("notes"))
    };
  }

  function buildBloodReportPayload(form) {
    const formData = new FormData(form);
    const payload = {
      testDate: normalizeString(formData.get("testDate"))
    };

    window.HealthConfig.BLOOD_REPORT_FIELDS.forEach((field) => {
      payload[field.key] = normalizeNumber(formData.get(field.key));
    });

    return payload;
  }

  window.HealthApi = {
    ACTIONS,
    getSettings,
    saveSettings,
    hasGasUrl,
    request,
    getDashboardData,
    normalizeDashboardData,
    normalizeNumber,
    buildDailyLogPayload,
    buildBloodReportPayload
  };
})();
