"use client";

export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  rawRows: string[][];
}

// ===== HTML-table XLS (Salesforce export) =====
function parseHtmlXls(content: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"));

  if (rows.length === 0) throw new Error("テーブルが見つかりません");

  // ヘッダー行
  const headerCells = Array.from(rows[0].querySelectorAll("th, td"));
  const headers = headerCells.map((th, i) => {
    const text = th.textContent?.trim() || "";
    // 文字化けしている場合はカラム番号で代替
    return text && !/^\?+$/.test(text) ? text : `列${i + 1}`;
  });

  // データ行
  const rawRows: string[][] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll("td"));
    if (cells.length === 0) continue;
    rawRows.push(cells.map((td) => td.textContent?.trim() || ""));
  }

  const parsedRows = rawRows.map((cells) => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? "";
    });
    return obj;
  });

  return { headers, rows: parsedRows, rawRows };
}

// ===== CSV =====
function parseCsv(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) throw new Error("データが空です");

  function parseRow(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === "," && !inQuote) {
        result.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseRow(lines[0]);
  const rawRows = lines.slice(1).map(parseRow);
  const parsedRows = rawRows.map((cells) => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return obj;
  });

  return { headers, rows: parsedRows, rawRows };
}

// ===== XLSX (binary) =====
async function parseXlsx(buffer: ArrayBuffer): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];
  if (rawData.length === 0) throw new Error("データが空です");

  const headers = (rawData[0] || []).map((h, i) => {
    const text = String(h || "").trim();
    return text && !/^\?+$/.test(text) ? text : `列${i + 1}`;
  });
  const rawRows = rawData.slice(1).map((row) => row.map((c) => String(c ?? "")));
  const parsedRows = rawRows.map((cells) => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = cells[i] ?? ""; });
    return obj;
  });

  return { headers, rows: parsedRows, rawRows };
}

// ===== メインエントリ =====
export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return parseCsv(text);
  }

  if (name.endsWith(".xlsx")) {
    const buf = await file.arrayBuffer();
    return parseXlsx(buf);
  }

  // .xls → まずHTMLとして試みる（Salesforceエクスポート形式）
  if (name.endsWith(".xls")) {
    try {
      // 複数エンコーディングを試す
      for (const enc of ["utf-8", "shift-jis", "iso-8859-1"] as const) {
        try {
          const text = await file.text();
          if (text.includes("<table") || text.includes("<TABLE")) {
            return parseHtmlXls(text);
          }
        } catch {}
      }
      // バイナリXLSとして処理
      const buf = await file.arrayBuffer();
      return parseXlsx(buf);
    } catch (e) {
      const text = await file.text();
      if (text.includes("<table") || text.includes("<TABLE")) {
        return parseHtmlXls(text);
      }
      throw e;
    }
  }

  throw new Error("対応していないファイル形式です（.xls / .xlsx / .csv）");
}

// ===== 日付から期間（YYYY-MM）を抽出 =====
export function extractPeriod(dateStr: string): string | null {
  if (!dateStr) return null;
  // YYYY/MM/DD or YYYY-MM-DD or MM/DD/YYYY
  const m1 = dateStr.match(/^(\d{4})[\/\-](\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}`;
  const m2 = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, "0")}`;
  return null;
}

// ===== 金額文字列を数値に変換 =====
export function parseAmount(str: string): number {
  if (!str) return 0;
  return parseFloat(str.replace(/[¥,\s円]/g, "")) || 0;
}

// ===== 列の自動推定 =====
export function guessColumns(headers: string[], rawRows: string[][]): {
  ownerCol: number | null;
  amountCol: number | null;
  dateCol: number | null;
  nameCol: number | null;
} {
  const ownerKeywords = ["owner", "担当", "オーナー", "営業", "所有者", "担当者"];
  const amountKeywords = ["amount", "金額", "売上", "受注", "price", "revenue", "金額"];
  const dateKeywords = ["close", "完了", "終了", "date", "日付", "締め", "クローズ"];
  const nameKeywords = ["name", "商談", "opportunity", "件名", "名前", "案件"];

  function findCol(keywords: string[]): number | null {
    for (const kw of keywords) {
      const idx = headers.findIndex((h) =>
        h.toLowerCase().includes(kw.toLowerCase())
      );
      if (idx >= 0) return idx;
    }
    return null;
  }

  let ownerCol = findCol(ownerKeywords);
  let amountCol = findCol(amountKeywords);
  let dateCol = findCol(dateKeywords);
  let nameCol = findCol(nameKeywords);

  // ヘッダーが文字化けしている場合、内容で推定
  if (rawRows.length > 0) {
    const sample = rawRows.slice(0, Math.min(5, rawRows.length));

    if (amountCol === null) {
      // 大きな数値が入っているカラムを探す
      for (let c = 0; c < headers.length; c++) {
        const nums = sample.map((r) => parseAmount(r[c])).filter((n) => n > 10000);
        if (nums.length >= 2) { amountCol = c; break; }
      }
    }

    if (dateCol === null) {
      // YYYY/MM/DD 形式の日付が入っているカラムを探す
      for (let c = 0; c < headers.length; c++) {
        const dates = sample.map((r) => r[c]).filter((v) => /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(v));
        if (dates.length >= 2) { dateCol = c; break; }
      }
    }

    if (ownerCol === null) {
      // アルファベットの人名っぽい値（スペースを含む英字）を探す
      for (let c = 0; c < headers.length; c++) {
        const names = sample.map((r) => r[c]).filter((v) => /^[A-Za-z\u3040-\u9fff]+ [A-Za-z\u3040-\u9fff]+$/.test(v));
        if (names.length >= 2) { ownerCol = c; break; }
      }
    }
  }

  return { ownerCol, amountCol, dateCol, nameCol };
}

// ===== インポートデータを集計 =====
export interface AggregatedOwner {
  ownerName: string;
  period: string;
  totalAmount: number;
  dealCount: number;
  deals: Array<{ name: string; amount: number; date: string }>;
}

export function aggregateByOwnerAndPeriod(
  rawRows: string[][],
  ownerCol: number,
  amountCol: number,
  dateCol: number,
  nameCol: number | null,
  filterPeriod?: string
): AggregatedOwner[] {
  const map = new Map<string, AggregatedOwner>();

  for (const row of rawRows) {
    const owner = row[ownerCol]?.trim();
    const amountStr = row[amountCol]?.trim();
    const dateStr = row[dateCol]?.trim();
    if (!owner || !dateStr) continue;

    const period = extractPeriod(dateStr);
    if (!period) continue;
    if (filterPeriod && period !== filterPeriod) continue;

    const amount = parseAmount(amountStr);
    const dealName = nameCol != null ? (row[nameCol]?.trim() || "—") : "—";
    const key = `${owner}__${period}`;

    if (!map.has(key)) {
      map.set(key, { ownerName: owner, period, totalAmount: 0, dealCount: 0, deals: [] });
    }
    const entry = map.get(key)!;
    entry.totalAmount += amount;
    entry.dealCount += 1;
    entry.deals.push({ name: dealName, amount, date: dateStr });
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}
