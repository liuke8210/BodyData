(function () {
  async function init() {
    HealthUi.initUi({
      onRefresh: loadDashboardData
    });
    await loadDashboardData();
  }

  async function loadDashboardData() {
    HealthUi.setLoadingState();
    try {
      const data = await HealthApi.getDashboardData();
      HealthUi.setDashboardData(data);
    } catch (error) {
      HealthUi.setErrorState(error.message || "資料載入失敗");
    }
  }

  init();
})();
