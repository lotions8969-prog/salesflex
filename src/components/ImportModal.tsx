"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  parseFile,
  ParseResult,
  guessColumns,
  aggregateByOwnerAndPeriod,
  AggregatedOwner,
  extractPeriod,
} from "@/lib/importParser";
import { listMetrics, upsertValues } from "@/lib/localStore";
import { MetricDefinition } from "@/lib/types";

const DEMO_USERS = [
  { id: "user1", name: "田中 健太" },
  { id: "user2", name: "佐藤 美咲" },
  { id: "user3", name: "鈴木 大輝" },
];

interface Props {
  onClose: () => void;
  onImported: () => void;
}

type Step = "upload" | "mapping" | "preview" | "done";

export default function ImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // マッピング設定
  const [ownerCol, setOwnerCol] = useState<number>(-1);
  const [amountCol, setAmountCol] = useState<number>(-1);
  const [dateCol, setDateCol] = useState<number>(-1);
  const [nameCol, setNameCol] = useState<number>(-1);
  const [filterPeriod, setFilterPeriod] = useState<string>("");

  // 集計結果
  const [aggregated, setAggregated] = useState<AggregatedOwner[]>([]);
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);

  // ユーザー紐付け（担当者名 → ユーザーID）
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});

  // 指標マッピング（集計項目 → MetricDefinition）
  const [amountMetricId, setAmountMetricId] = useState<string>("");
  const [countMetricId, setCountMetricId] = useState<string>("");

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    setFileName(file.name);
    try {
      const result = await parseFile(file);
      setParsed(result);

      // 列を自動推定
      const guessed = guessColumns(result.headers, result.rawRows);
      setOwnerCol(guessed.ownerCol ?? -1);
      setAmountCol(guessed.amountCol ?? -1);
      setDateCol(guessed.dateCol ?? -1);
      setNameCol(guessed.nameCol ?? -1);

      // 期間候補を自動設定（最頻値）
      if (guessed.dateCol != null) {
        const periods: Record<string, number> = {};
        for (const row of result.rawRows) {
          const p = extractPeriod(row[guessed.dateCol] || "");
          if (p) periods[p] = (periods[p] || 0) + 1;
        }
        const sorted = Object.entries(periods).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) setFilterPeriod(sorted[0][0]);
      }

      setStep("mapping");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ファイルの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function goToPreview() {
    if (!parsed) return;
    if (ownerCol < 0 || amountCol < 0 || dateCol < 0) {
      setError("担当者・金額・日付の列を選択してください");
      return;
    }
    setError(null);

    const agg = aggregateByOwnerAndPeriod(
      parsed.rawRows,
      ownerCol,
      amountCol,
      dateCol,
      nameCol,
      filterPeriod || undefined
    );
    setAggregated(agg);

    // ユーザーマップ初期化
    const initMap: Record<string, string> = {};
    const uniqueOwners = [...new Set(agg.map((a) => a.ownerName))];
    uniqueOwners.forEach((name) => {
      // 自動マッチング（姓が一致など）
      const found = DEMO_USERS.find(
        (u) =>
          u.name.includes(name.split(/\s/)[0]) ||
          name.includes(u.name.split(/\s/)[0])
      );
      initMap[name] = found?.id || "";
    });
    setOwnerMap(initMap);

    // 指標リスト
    const m = listMetrics();
    setMetrics(m);
    const numMetrics = m.filter((x) => x.type === "NUMBER");
    // 自動選択: "売上" or "月間売上"
    const salesMetric = numMetrics.find((x) => x.name.includes("売上"));
    setAmountMetricId(salesMetric?.id || numMetrics[0]?.id || "");
    const countMetric = numMetrics.find((x) => x.name.includes("商談") || x.name.includes("件数") || x.name.includes("訪問"));
    setCountMetricId(countMetric?.id || "");

    setStep("preview");
  }

  function doImport() {
    for (const agg of aggregated) {
      const userId = ownerMap[agg.ownerName];
      if (!userId) continue;
      const inputs: Parameters<typeof upsertValues>[2] = [];
      if (amountMetricId) {
        const amountInMan = Math.round(agg.totalAmount / 10000); // 万円換算
        inputs.push({ metricDefinitionId: amountMetricId, numberValue: amountInMan });
      }
      if (countMetricId) {
        inputs.push({ metricDefinitionId: countMetricId, numberValue: agg.dealCount });
      }
      if (inputs.length > 0) {
        upsertValues(userId, agg.period, inputs);
      }
    }
    setStep("done");
    onImported();
  }

  // 列セレクター
  const ColSelect = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <Select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="text-sm"
      >
        <option value={-1}>-- 選択してください --</option>
        {parsed?.headers.map((h, i) => (
          <option key={i} value={i}>
            {i + 1}列目: {h}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">CSVファイルをインポート</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b text-xs">
          {[
            { key: "upload", label: "アップロード" },
            { key: "mapping", label: "列マッピング" },
            { key: "preview", label: "プレビュー" },
            { key: "done", label: "完了" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.key
                    ? "bg-blue-600 text-white"
                    : ["upload", "mapping", "preview", "done"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {["upload", "mapping", "preview", "done"].indexOf(step) > i ? (
                  <Check className="h-3 w-3" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={
                  step === s.key ? "font-semibold text-blue-700" : "text-gray-500"
                }
              >
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Step 1: アップロード */}
          {step === "upload" && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {loading ? (
                <RefreshCw className="h-10 w-10 mx-auto text-blue-500 animate-spin mb-3" />
              ) : (
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              )}
              <p className="font-medium text-gray-700">
                {loading ? "解析中..." : "ファイルをドラッグ＆ドロップ"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                またはクリックして選択 (.xls / .xlsx / .csv)
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Salesforceのレポートエクスポート形式に対応しています
              </p>
            </div>
          )}

          {/* Step 2: 列マッピング */}
          {step === "mapping" && parsed && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                <FileSpreadsheet className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-blue-800 font-medium">{fileName}</span>
                <Badge variant="secondary">{parsed.rawRows.length}件のデータ</Badge>
              </div>

              {/* プレビューテーブル */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">先頭3行のプレビュー</p>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="text-xs w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {parsed.headers.map((h, i) => (
                          <th key={i} className="px-2 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap border-r last:border-r-0">
                            <span className="text-gray-400 mr-1">{i + 1}.</span>{h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rawRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-t">
                          {row.map((cell, ci) => (
                            <td key={ci} className={`px-2 py-1.5 border-r last:border-r-0 whitespace-nowrap max-w-[120px] truncate ${
                              ci === ownerCol ? "bg-purple-50" :
                              ci === amountCol ? "bg-green-50" :
                              ci === dateCol ? "bg-blue-50" : ""
                            }`}>
                              {cell || <span className="text-gray-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ColSelect label="👤 担当者名の列 *" value={ownerCol} onChange={setOwnerCol} />
                <ColSelect label="💰 金額の列 *" value={amountCol} onChange={setAmountCol} />
                <ColSelect label="📅 完了日の列 *" value={dateCol} onChange={setDateCol} />
                <ColSelect label="📋 商談名の列（任意）" value={nameCol} onChange={setNameCol} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  📆 集計する期間（YYYY-MM）
                </label>
                <input
                  type="text"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  placeholder="空欄=全期間"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400">
                  空欄にすると全期間を集計します。例: 2025-02
                </p>
              </div>
            </div>
          )}

          {/* Step 3: プレビュー */}
          {step === "preview" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                集計結果を確認し、メンバーと指標を紐づけてください。
              </p>

              {/* 指標マッピング */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">インポート先の指標</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">💰 金額合計 → 指標</label>
                      <Select
                        value={amountMetricId}
                        onChange={(e) => setAmountMetricId(e.target.value)}
                      >
                        <option value="">インポートしない</option>
                        {metrics.filter((m) => m.type === "NUMBER").map((m) => (
                          <option key={m.id} value={m.id}>{m.name}{m.unit ? `（${m.unit}）` : ""}</option>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-400">単位：万円に自動変換</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">📊 件数 → 指標</label>
                      <Select
                        value={countMetricId}
                        onChange={(e) => setCountMetricId(e.target.value)}
                      >
                        <option value="">インポートしない</option>
                        {metrics.filter((m) => m.type === "NUMBER").map((m) => (
                          <option key={m.id} value={m.id}>{m.name}{m.unit ? `（${m.unit}）` : ""}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 担当者ごとの集計 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  集計結果 — {aggregated.length}名分
                </p>
                {aggregated.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    該当するデータがありません。列マッピングや期間を確認してください。
                  </p>
                ) : (
                  aggregated.map((agg) => (
                    <div
                      key={`${agg.ownerName}__${agg.period}`}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-medium text-gray-900">{agg.ownerName}</p>
                          <div className="flex gap-2 mt-0.5">
                            <Badge variant="secondary">{agg.period}</Badge>
                            <Badge variant="outline">{agg.dealCount}件</Badge>
                            <Badge className="bg-green-100 text-green-800">
                              {(agg.totalAmount / 10000).toFixed(0)}万円
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">→ メンバー:</span>
                          <Select
                            value={ownerMap[agg.ownerName] || ""}
                            onChange={(e) =>
                              setOwnerMap((prev) => ({
                                ...prev,
                                [agg.ownerName]: e.target.value,
                              }))
                            }
                            className="text-sm w-36"
                          >
                            <option value="">スキップ</option>
                            {DEMO_USERS.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      {/* 案件明細（折りたたみ） */}
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">
                          案件一覧を見る（{agg.deals.length}件）
                        </summary>
                        <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-100">
                          {agg.deals.map((d, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="truncate max-w-[60%]">{d.name}</span>
                              <span className="text-gray-700 font-medium">
                                {(d.amount / 10000).toFixed(0)}万円
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 4: 完了 */}
          {step === "done" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">インポート完了！</h3>
              <p className="text-sm text-gray-500">
                データが保存されました。ダッシュボードで確認できます。
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <Button
            variant="ghost"
            onClick={() => {
              if (step === "upload") onClose();
              else if (step === "mapping") setStep("upload");
              else if (step === "preview") setStep("mapping");
              else onClose();
            }}
          >
            {step === "done" ? "閉じる" : <><ChevronLeft className="h-4 w-4 mr-1" />戻る</>}
          </Button>

          {step === "mapping" && (
            <Button onClick={goToPreview} className="flex items-center gap-1">
              プレビューへ <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === "preview" && (
            <Button
              onClick={doImport}
              disabled={aggregated.length === 0 || Object.values(ownerMap).every((v) => !v)}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              インポートを実行
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
