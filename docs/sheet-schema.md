# Google Sheets 資料表結構

本專案使用 Google Apps Script Web App 作為 GitHub Pages 前端與 Google Sheets 之間的 API 層。

## DailyLogs

| 欄位名稱 | Key | 說明 |
|---|---|---|
| 日期 | `date` | 紀錄日期 |
| 體重 | `weight` | 數值 |
| 血壓_收縮 | `bpSystolic` | 數值 |
| 血壓_舒張 | `bpDiastolic` | 數值 |
| 備註 | `notes` | 文字 |

## BloodReports

| 欄位名稱 | Key | 說明 |
|---|---|---|
| 檢驗日期 | `testDate` | 血液檢查日期 |
| CRP | `CRP` | 數值 |
| eGFR | `eGFR` | 數值 |
| 白蛋白 | `Albumin` | 數值 |
| WBC | `WBC` | 數值 |
| RBC | `RBC` | 數值 |
| HGB | `HGB` | 數值 |
| HCT | `HCT` | 數值 |
| PLT | `PLT` | 數值 |
| Blast | `Blast` | 數值 |
| Stab | `Stab` | 數值或百分比 |
| Seg | `Seg` | 數值或百分比 |
| 成熟好中球 | `MatureNeutrophils` | 數值 |

## TodoList

| 欄位名稱 | Key | 說明 |
|---|---|---|
| 任務ID | `taskId` | 唯一 ID |
| 建立日期 | `createdAt` | 日期或日期時間 |
| 任務內容 | `content` | 文字 |
| 狀態 | `status` | `done` 或 `undone` |

## Dashboard Response

```json
{
  "dailyLogs": [],
  "bloodReports": [],
  "todos": [],
  "schedule": []
}
```
