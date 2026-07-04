const SHEETS = {
  dailyLogs: "DailyLogs",
  bloodReports: "BloodReports",
  todos: "TodoList"
};

const HEADERS = {
  DailyLogs: ["date", "weight", "bpSystolic", "bpDiastolic", "notes"],
  BloodReports: ["testDate", "CRP", "eGFR", "Albumin", "WBC", "RBC", "HGB", "HCT", "PLT", "Blast", "Stab", "Seg", "MatureNeutrophils"],
  TodoList: ["taskId", "createdAt", "content", "status"]
};

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};

    if (action === "getDashboardData") {
      return jsonResponse({ ok: true, data: getDashboardData() });
    }
    if (action === "createDailyLog") {
      appendRecord(SHEETS.dailyLogs, HEADERS.DailyLogs, payload);
      return jsonResponse({ ok: true });
    }
    if (action === "createBloodReport") {
      appendRecord(SHEETS.bloodReports, HEADERS.BloodReports, payload);
      return jsonResponse({ ok: true });
    }
    if (action === "createTodo") {
      appendRecord(SHEETS.todos, HEADERS.TodoList, {
        taskId: `task_${Utilities.getUuid()}`,
        createdAt: new Date(),
        content: payload.content || "",
        status: payload.status === "done" ? "done" : "undone"
      });
      return jsonResponse({ ok: true });
    }
    if (action === "updateTodoStatus") {
      updateTodoStatus(payload.taskId, payload.status);
      return jsonResponse({ ok: true });
    }
    if (action === "chatWithGemini") {
      return jsonResponse({ ok: true, data: { reply: "Gemini 代理尚未設定。請在 Apps Script 中加入 Gemini API 呼叫邏輯。" } });
    }

    throw new Error("Unknown action");
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function doGet() {
  return jsonResponse({ ok: true, data: getDashboardData() });
}

function getDashboardData() {
  return {
    dailyLogs: readRecords(SHEETS.dailyLogs),
    bloodReports: readRecords(SHEETS.bloodReports),
    todos: readRecords(SHEETS.todos),
    schedule: []
  };
}

function getSpreadsheet() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("Script Property SPREADSHEET_ID is not set");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet(name) {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`Missing sheet: ${name}`);
  }
  return sheet;
}

function readRecords(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(String);
  return values.slice(1).filter((row) => row.some((cell) => cell !== "")).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = normalizeCell(row[index]);
    });
    return record;
  });
}

function appendRecord(sheetName, headers, payload) {
  const sheet = getSheet(sheetName);
  ensureHeaders(sheet, headers);
  sheet.appendRow(headers.map((header) => payload[header] === undefined ? "" : payload[header]));
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
  const isSame = headers.every((header, index) => currentHeaders[index] === header);
  if (!isSame) {
    throw new Error(`Header mismatch in sheet: ${sheet.getName()}`);
  }
}

function updateTodoStatus(taskId, status) {
  const sheet = getSheet(SHEETS.todos);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    throw new Error("TodoList is empty");
  }

  const headers = values[0].map(String);
  const taskIdIndex = headers.indexOf("taskId");
  const statusIndex = headers.indexOf("status");
  if (taskIdIndex < 0 || statusIndex < 0) {
    throw new Error("TodoList headers are invalid");
  }

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][taskIdIndex]) === String(taskId)) {
      sheet.getRange(rowIndex + 1, statusIndex + 1).setValue(status === "done" ? "done" : "undone");
      return;
    }
  }

  throw new Error("Todo not found");
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value === "" ? null : value;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
