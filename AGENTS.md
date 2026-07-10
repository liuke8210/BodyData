# AGENTS.md

## 偏好回覆方式

- 請使用繁體中文回答，並少使用表情符號。
- 回答問題直接回答重點，省略客套話。
- 當使用者詢問是否有更好建議時，請列出不同角度方案讓使用者選擇。

## 專案目的

本專案是個人健康數據看板，目標是建立專業、低噪聲、資料導向的 UI，並適合部署於 GitHub Pages。

## 技術架構

- 前端：靜態單頁應用程式，部署於 GitHub Pages。
- API 層：Google Apps Script Web App。
- 資料庫：Google Sheets。
- 圖表：Chart.js CDN。
- 樣式：Tailwind CSS。
- 互動邏輯：Vanilla JavaScript。

## 不可違反的規則

1. HTML、CSS、JavaScript 必須分開管理。
2. 不得將所有程式碼集中寫在單一 HTML 檔案內。
3. 除非使用者明確要求，不得引入 React、Vue、Next.js 或其他前端框架。
4. 前端互動邏輯使用 Vanilla JavaScript。
5. 版面與樣式以 Tailwind CSS 為主。
6. 圖表必須使用 Chart.js。
7. 不得新增不必要的第三方依賴。
8. 不得使用設計系統以外的花俏顏色。
9. 所有輸入元件字體大小必須至少為 `text-[16px]`。
10. 不得硬寫 API Key、Token、Spreadsheet ID 或任何私密資訊。
11. JavaScript 函式命名必須清楚，並盡量模組化。
12. UI 必須 Mobile-First，再使用 `md:`、`lg:` 等響應式 class 補上桌面規則。
13. 本系統只負責記錄與視覺化健康數值，不得做醫療診斷、治療建議或醫療結論判斷。

## 檔案結構

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── api.js
│   ├── charts.js
│   ├── ui.js
│   └── config.js
├── gas/
│   └── Code.gs
├── docs/
│   └── sheet-schema.md
└── AGENTS.md
```

## 檔案責任

- `index.html`：只負責頁面結構，不放大量樣式與邏輯。
- `css/style.css`：放置 Tailwind 不容易乾淨表達的客製 CSS。
- `js/app.js`：應用程式初始化、頁面層級流程控制。
- `js/api.js`：Google Apps Script API 呼叫、設定與資料正規化。
- `js/charts.js`：Chart.js 圖表建立、更新、銷毀邏輯。
- `js/ui.js`：DOM 渲染、導覽、表單、彈窗、展開收合與提示訊息。
- `js/config.js`：常數、欄位定義、圖表指標群組、UI 顯示文字。
- `gas/Code.gs`：Google Apps Script API 端點邏輯。
- `docs/sheet-schema.md`：Google Sheets 資料表結構說明。

## 版面要求

- 桌面版使用固定左側側邊欄，寬度 `w-56`，只放首頁 / 紀錄 / 設定。
- 手機版使用固定底部導覽，主內容需保留 bottom padding。
- Dashboard 摘要卡桌面版 grid 比例為 `15fr 15fr 15fr 55fr`。
- 摘要卡依序顯示最新體重、最新血壓、最新 Blast、新增待辦。
- `Blast > 0` 時必須顯示為 `font-bold text-rose-500`。
- 手機版 Dashboard 順序為任務清單、歷史趨勢圖。
- 身體素質紀錄頁使用每日基本紀錄與可收合的專業血液報告雙卡片。
- 血液報告展開後欄位使用 `grid-cols-2 md:grid-cols-3`。

## 資料表

### DailyLogs

| 欄位名稱 | Key |
|---|---|
| 日期 | `date` |
| 體重 | `weight` |
| 血壓_收縮 | `bpSystolic` |
| 血壓_舒張 | `bpDiastolic` |
| 備註 | `notes` |

### BloodReports

| 欄位名稱 | Key |
|---|---|
| 檢驗日期 | `testDate` |
| CRP | `CRP` |
| eGFR | `eGFR` |
| 白蛋白 | `Albumin` |
| WBC | `WBC` |
| RBC | `RBC` |
| HGB | `HGB` |
| HCT | `HCT` |
| PLT | `PLT` |
| Blast | `Blast` |
| Stab | `Stab` |
| Seg | `Seg` |
| 成熟好中球 | `MatureNeutrophils` |

### TodoList

| 欄位名稱 | Key |
|---|---|
| 任務ID | `taskId` |
| 建立日期 | `createdAt` |
| 任務內容 | `content` |
| 狀態 | `status` |

## 資料處理規則

- 所有 API response 在渲染前都要先正規化。
- 日期型資料用於圖表時，需由舊到新排序。
- Dashboard 摘要卡使用最新一筆資料。
- 缺少的數值應視為 `null`，不得自動當成 `0`。
- 不得從數值推論醫療意義。
- 圖表指標名稱、key、群組必須集中於 `js/config.js`。
- Chart.js 在同一 canvas 重新建立圖表前必須先銷毀既有 chart instance。

## 驗收檢查

- HTML、CSS、JavaScript 已分開。
- 手機版與桌面版導覽行為正確。
- 手機版底部導覽不會遮住主要內容。
- 所有輸入元件使用 `text-[16px]` 或更大字體。
- Dashboard 摘要卡符合指定桌面版與手機版排列。
- 最新 Blast 數值大於 `0` 時會顯示為粗體紅色。
- 手機版 Dashboard 先顯示任務與行程，再顯示圖表。
- 圖表指標選單使用 `config.js` 中的群組定義。
- Google Sheets schema 與文件一致。
- 未提交任何 API Key、Token、Spreadsheet ID 或私密資訊。
