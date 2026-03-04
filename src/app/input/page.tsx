"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MetricDefinition,
  MetricCategory,
  METRIC_CATEGORY_LABELS,
  METRIC_CATEGORY_COLORS,
} from "@/lib/types";

// デモ用のユーザー・期間データ（実際はDBから取得）
const DEMO_USERS = [
  { id: "user1", name: "田中 健太" },
  { id: "user2", name: "佐藤 美咲" },
  { id: "user3", name: "鈴木 大輝" },
];

function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-gray-500 ml-2 self-center">{value} / 5</span>
      )}
    </div>
  );
}

export default function InputPage() {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const { register, handleSubmit, getValues } = useForm<{
    userId: string;
    period: string;
    [key: string]: string;
  }>({
    defaultValues: {
      userId: DEMO_USERS[0].id,
      period: getCurrentPeriod(),
    },
  });

  function getCurrentPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  async function onSubmit() {
    const data = getValues();
    setSaving(true);

    const values = metrics.map((metric) => {
      if (metric.type === "NUMBER") {
        return {
          metricDefinitionId: metric.id,
          numberValue: data[`metric_${metric.id}`]
            ? parseFloat(data[`metric_${metric.id}`])
            : undefined,
        };
      } else if (metric.type === "RATING_5") {
        return {
          metricDefinitionId: metric.id,
          ratingValue: ratings[metric.id] || undefined,
        };
      } else {
        return {
          metricDefinitionId: metric.id,
          textValue: data[`metric_${metric.id}`] || undefined,
        };
      }
    });

    await fetch("/api/metric-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        period: data.period,
        values,
      }),
    });

    setSaving(false);
    setSavedMessage("保存しました！");
    setTimeout(() => setSavedMessage(""), 3000);
  }

  const grouped = metrics.reduce<Record<MetricCategory, MetricDefinition[]>>(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<MetricCategory, MetricDefinition[]>
  );

  const categoryOrder: MetricCategory[] = ["SALES_RESULT", "BEHAVIOR", "SKILL"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">データ入力</h1>
        <p className="text-sm text-gray-500 mt-1">
          定義された指標に基づいて、実績データを入力します
        </p>
      </div>

      {metrics.length === 0 && !loading && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">指標が設定されていません</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              まず「指標設定」ページで追いたい指標を追加してください。
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 対象者・期間選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">対象者・期間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>対象メンバー</Label>
                <Select {...register("userId")}>
                  {DEMO_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>期間（YYYY-MM）</Label>
                <Input {...register("period")} placeholder="2024-01" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 動的入力フォーム */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">指標を読み込み中...</div>
        ) : (
          categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <Card key={cat}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{METRIC_CATEGORY_LABELS[cat]}</CardTitle>
                    <Badge className={METRIC_CATEGORY_COLORS[cat]}>
                      {items.length}項目
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {items.map((metric) => (
                      <div key={metric.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{metric.name}</Label>
                          {metric.unit && (
                            <span className="text-xs text-gray-400">({metric.unit})</span>
                          )}
                          {metric.targetValue && (
                            <span className="text-xs text-blue-500">
                              目標: {metric.targetValue}
                            </span>
                          )}
                        </div>
                        {metric.description && (
                          <p className="text-xs text-gray-400">{metric.description}</p>
                        )}

                        {metric.type === "NUMBER" && (
                          <Input
                            type="number"
                            step="0.1"
                            min={metric.minValue ?? undefined}
                            max={metric.maxValue ?? undefined}
                            placeholder={`数値を入力${metric.unit ? ` (${metric.unit})` : ""}`}
                            {...register(`metric_${metric.id}`)}
                          />
                        )}

                        {metric.type === "RATING_5" && (
                          <RatingInput
                            value={ratings[metric.id] || 0}
                            onChange={(v) =>
                              setRatings((prev) => ({ ...prev, [metric.id]: v }))
                            }
                          />
                        )}

                        {metric.type === "TEXT" && (
                          <textarea
                            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] resize-y"
                            placeholder="コメントや定性評価を入力..."
                            {...register(`metric_${metric.id}`)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {metrics.length > 0 && (
          <div className="flex items-center justify-between">
            {savedMessage && (
              <span className="text-green-600 text-sm font-medium">{savedMessage}</span>
            )}
            <div className="ml-auto">
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "データを保存"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
