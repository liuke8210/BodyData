(function () {
  const DAILY_LOG_FIELDS = ["date", "weight", "bpSystolic", "bpDiastolic", "notes"];
  const BLOOD_REPORT_FIELDS = [
    { label: "炎症 / CRP", key: "CRP" },
    { label: "血液の廃物を排泄する能力 / eGFR", key: "eGFR" },
    { label: "血管保水力 / アルブミン", key: "Albumin" },
    { label: "白血球数 / WBC", key: "WBC" },
    { label: "赤血球数 / RBC", key: "RBC" },
    { label: "血色素・體力與氧氣指標 / HGB", key: "HGB" },
    { label: "血液の濃度 / HCT", key: "HCT" },
    { label: "血小板数 / PLT", key: "PLT" },
    { label: "Blast", key: "Blast" },
    { label: "桿状核球 / Stab / %", key: "Stab" },
    { label: "分節核球 / Seg / %", key: "Seg" },
    { label: "成熟好中球", key: "MatureNeutrophils" }
  ];

  const METRIC_GROUPS = [
    {
      label: "基礎數值",
      metrics: [
        { label: "體重", key: "weight", source: "dailyLogs", dateKey: "date", unit: "kg" },
        { label: "收縮壓", key: "bpSystolic", source: "dailyLogs", dateKey: "date", unit: "mmHg" },
        { label: "舒張壓", key: "bpDiastolic", source: "dailyLogs", dateKey: "date", unit: "mmHg" }
      ]
    },
    {
      label: "血液功能",
      metrics: [
        { label: "WBC", key: "WBC", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "RBC", key: "RBC", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "PLT", key: "PLT", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "HCT", key: "HCT", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "HGB", key: "HGB", source: "bloodReports", dateKey: "testDate", unit: "" }
      ]
    },
    {
      label: "免疫功能",
      metrics: [
        { label: "WBC", key: "WBC", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "Seg", key: "Seg", source: "bloodReports", dateKey: "testDate", unit: "%" },
        { label: "Stab", key: "Stab", source: "bloodReports", dateKey: "testDate", unit: "%" },
        { label: "成熟好中球", key: "MatureNeutrophils", source: "bloodReports", dateKey: "testDate", unit: "" }
      ]
    },
    {
      label: "肝腎功能 / 發炎指標",
      metrics: [
        { label: "CRP", key: "CRP", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "eGFR", key: "eGFR", source: "bloodReports", dateKey: "testDate", unit: "" },
        { label: "Albumin", key: "Albumin", source: "bloodReports", dateKey: "testDate", unit: "" }
      ]
    }
  ];

  const ACTIONS = {
    getDashboardData: "getDashboardData",
    createDailyLog: "createDailyLog",
    createBloodReport: "createBloodReport",
    createTodo: "createTodo",
    updateTodoStatus: "updateTodoStatus",
    chatWithGemini: "chatWithGemini"
  };

  window.HealthConfig = {
    DAILY_LOG_FIELDS,
    BLOOD_REPORT_FIELDS,
    METRIC_GROUPS,
    ACTIONS,
    SETTINGS_KEY: "healthDashboardSettings"
  };
})();
