"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit2, Trash2, BarChart2, Eye, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MetricDefinition,
  MetricType,
  MetricCategory,
  METRIC_TYPE_LABELS,
  METRIC_CATEGORY_LABELS,
  METRIC_CATEGORY_COLORS,
} from "@/lib/types";

interface FormData {
  name: string;
  description: string;
  unit: string;
  type: MetricType;
  category: MetricCategory;
  showInRadarChart: boolean;
  showInDashboard: boolean;
  showInProgressBoard: boolean;
  minValue: string;
  maxValue: string;
  targetValue: string;
}

export default function SettingsPage() {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: {
      type: "NUMBER",
      category: "SALES_RESULT",
      showInRadarChart: false,
      showInDashboard: true,
      showInProgressBoard: false,
    },
  });

  const watchedType = watch("type");

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    const res = await fetch("/api/metrics");
    const data = await res.json();
    setMetrics(data);
    setLoading(false);
  }

  async function onSubmit(data: FormData) {
    const url = editingId ? `/api/metrics/${editingId}` : "/api/metrics";
    const method = editingId ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    reset();
    setShowForm(false);
    setEditingId(null);
    fetchMetrics();
  }

  function startEdit(metric: MetricDefinition) {
    setEditingId(metric.id);
    reset({
      name: metric.name,
      description: metric.description || "",
      unit: metric.unit || "",
      type: metric.type,
      category: metric.category,
      showInRadarChart: metric.showInRadarChart,
      showInDashboard: metric.showInDashboard,
      showInProgressBoard: metric.showInProgressBoard,
      minValue: metric.minValue?.toString() || "",
      maxValue: metric.maxValue?.toString() || "",
      targetValue: metric.targetValue?.toString() || "",
    });
    setShowForm(true);
  }

  async function deleteMetric(id: string) {
    if (!confirm("この指標を無効化しますか？")) return;
    await fetch(`/api/metrics/${id}`, { method: "DELETE" });
    fetchMetrics();
  }

  const grouped = metrics.reduce<Record<MetricCategory, MetricDefinition[]>>(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<MetricCategory, MetricDefinition[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">指標設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            追いたいKPIやスキル項目を自由に追加・編集できます
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset({
              type: "NUMBER",
              category: "SALES_RESULT",
              showInRadarChart: false,
              showInDashboard: true,
              showInProgressBoard: false,
            });
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新しい指標を追加
        </Button>
      </div>

      {/* フォーム */}
      {showForm && (
        <Card className="border-blue-200 shadow-md">
          <CardHeader>
            <CardTitle>{editingId ? "指標を編集" : "新しい指標を追加"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>指標名 *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="例: 商談化率、ヒアリング力"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>単位</Label>
                  <Input
                    {...register("unit")}
                    placeholder="例: %, 件, 万円"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>説明</Label>
                <Input
                  {...register("description")}
                  placeholder="この指標の説明（任意）"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>データ型 *</Label>
                  <Select {...register("type")}>
                    <option value="NUMBER">数値</option>
                    <option value="RATING_5">5段階評価</option>
                    <option value="TEXT">テキスト</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>カテゴリ *</Label>
                  <Select {...register("category")}>
                    <option value="SALES_RESULT">営業成果</option>
                    <option value="BEHAVIOR">行動指標</option>
                    <option value="SKILL">スキル評価</option>
                  </Select>
                </div>
              </div>

              {watchedType === "NUMBER" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>最小値</Label>
                    <Input {...register("minValue")} type="number" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>最大値</Label>
                    <Input {...register("maxValue")} type="number" placeholder="100" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>目標値</Label>
                    <Input {...register("targetValue")} type="number" placeholder="80" />
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700">表示設定</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("showInRadarChart")}
                      className="rounded"
                    />
                    <BarChart2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">レーダーチャートに表示</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("showInDashboard")}
                      className="rounded"
                    />
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">ダッシュボードに表示</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("showInProgressBoard")}
                      className="rounded"
                    />
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">進捗ボードに表示</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingId ? "更新する" : "追加する"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 指標一覧 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : (
        <div className="space-y-6">
          {(["SALES_RESULT", "BEHAVIOR", "SKILL"] as MetricCategory[]).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {METRIC_CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid gap-3">
                  {items.map((metric) => (
                    <Card key={metric.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{metric.name}</span>
                              {metric.unit && (
                                <span className="text-xs text-gray-400">({metric.unit})</span>
                              )}
                              <Badge className={METRIC_CATEGORY_COLORS[metric.category]}>
                                {METRIC_CATEGORY_LABELS[metric.category]}
                              </Badge>
                              <Badge variant="outline">
                                {METRIC_TYPE_LABELS[metric.type]}
                              </Badge>
                            </div>
                            {metric.description && (
                              <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {metric.showInRadarChart && (
                                <span className="text-xs flex items-center gap-1 text-purple-600">
                                  <BarChart2 className="h-3 w-3" />レーダー
                                </span>
                              )}
                              {metric.showInDashboard && (
                                <span className="text-xs flex items-center gap-1 text-blue-600">
                                  <Eye className="h-3 w-3" />ダッシュボード
                                </span>
                              )}
                              {metric.showInProgressBoard && (
                                <span className="text-xs flex items-center gap-1 text-green-600">
                                  <TrendingUp className="h-3 w-3" />進捗ボード
                                </span>
                              )}
                              {metric.targetValue && (
                                <span className="text-xs text-gray-400">
                                  目標: {metric.targetValue}{metric.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(metric)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMetric(metric.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {metrics.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>まだ指標が登録されていません</p>
              <p className="text-sm mt-1">「新しい指標を追加」から始めましょう</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
