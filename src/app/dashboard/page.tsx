"use client";

import { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricDefinition, MetricValue } from "@/lib/types";
import { listMetrics, listValues, seedDemoDataIfEmpty } from "@/lib/localStore";
import { USERS } from "@/lib/users";

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ProgressBar({ value, max, target }: { value: number; max: number; target?: number }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const targetPct = target ? Math.min((target / Math.max(max, 1)) * 100, 100) : null;

  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
      <div
        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
      {targetPct !== null && (
        <div
          className="absolute top-[-2px] h-[calc(100%+4px)] w-0.5 bg-orange-400"
          style={{ left: `${targetPct}%` }}
          title={`目標: ${target}`}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [metricValues, setMetricValues] = useState<MetricValue[]>([]);
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const period = getCurrentPeriod();

  useEffect(() => {
    seedDemoDataIfEmpty();
    setMetrics(listMetrics());
  }, []);

  useEffect(() => {
    setMetricValues(listValues(selectedUser.id, period));
  }, [selectedUser.id, period]);

  const getVal = (metricId: string) =>
    metricValues.find((v) => v.metricDefinitionId === metricId);

  // レーダーチャート用（RATING_5 + showInRadarChart）
  const radarMetrics = metrics.filter((m) => m.type === "RATING_5" && m.showInRadarChart);
  const radarData = radarMetrics.map((m) => ({
    subject: m.name,
    value: getVal(m.id)?.ratingValue ?? 0,
    fullMark: 5,
  }));

  // 進捗ボード用（NUMBER + showInProgressBoard）
  const progressMetrics = metrics.filter((m) => m.type === "NUMBER" && m.showInProgressBoard);

  // KPIサマリー用（NUMBER + showInDashboard）
  const kpiMetrics = metrics.filter((m) => m.type === "NUMBER" && m.showInDashboard);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">{period} の実績</p>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedUser.id === user.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>指標が設定されていません</p>
          <p className="text-sm mt-1">「指標設定」から指標を追加してください</p>
        </div>
      ) : (
        <>
          {/* KPIサマリーカード */}
          {kpiMetrics.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpiMetrics.slice(0, 4).map((metric) => {
                const val = getVal(metric.id);
                const numVal = val?.numberValue ?? null;
                const achievement =
                  metric.targetValue != null && numVal != null
                    ? Math.round((numVal / metric.targetValue) * 100)
                    : null;

                return (
                  <Card key={metric.id}>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 truncate">{metric.name}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {numVal != null ? numVal : "—"}
                        {numVal != null && metric.unit && (
                          <span className="text-sm font-normal text-gray-400 ml-1">{metric.unit}</span>
                        )}
                      </p>
                      {achievement != null && (
                        <div className="flex items-center gap-1 mt-1">
                          <Target className="h-3 w-3 text-orange-400" />
                          <span
                            className={`text-xs font-medium ${
                              achievement >= 100 ? "text-green-600" : "text-orange-500"
                            }`}
                          >
                            達成率 {achievement}%
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* レーダーチャート */}
            {radarMetrics.length >= 3 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">スキルレーダー</CardTitle>
                    <Badge variant="secondary">{selectedUser.name}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    指標設定で「レーダーチャートに表示」をONにした5段階評価項目が自動で表示
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                      />
                      <Radar
                        name={selectedUser.name}
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Tooltip
                        formatter={(v: number | string | undefined) => [
                          `${v ?? 0} / 5`,
                          "評価",
                        ]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center p-8">
                <div className="text-center text-gray-400">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">レーダーチャートを表示するには</p>
                  <p className="text-xs mt-0.5">5段階評価の指標を3つ以上追加し</p>
                  <p className="text-xs">「レーダーチャートに表示」をONにしてください</p>
                </div>
              </Card>
            )}

            {/* 進捗管理ボード */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-base">進捗管理ボード</CardTitle>
                </div>
                <p className="text-xs text-gray-400">
                  指標設定で「進捗ボードに表示」がONの数値指標が自動で表示
                </p>
              </CardHeader>
              <CardContent>
                {progressMetrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <p>表示する指標がありません</p>
                    <p className="text-xs mt-1">指標設定で「進捗ボードに表示」をONにしてください</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {progressMetrics.map((metric) => {
                      const val = getVal(metric.id);
                      const numVal = val?.numberValue ?? 0;
                      const maxVal = metric.maxValue ?? metric.targetValue ?? 100;
                      const achievement =
                        metric.targetValue != null
                          ? Math.round((numVal / metric.targetValue) * 100)
                          : null;

                      return (
                        <div key={metric.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{metric.name}</span>
                            <div className="flex items-center gap-2">
                              {achievement != null && (
                                <span
                                  className={`text-xs font-semibold ${
                                    achievement >= 100 ? "text-green-600" : "text-orange-500"
                                  }`}
                                >
                                  {achievement}%
                                </span>
                              )}
                              <span className="text-gray-500">
                                <span className="font-semibold text-gray-900">{numVal}</span>
                                {metric.unit && <span className="ml-0.5 text-xs">{metric.unit}</span>}
                                {metric.targetValue != null && (
                                  <span className="text-gray-400 text-xs"> / 目標 {metric.targetValue}</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <ProgressBar
                            value={numVal}
                            max={maxVal}
                            target={metric.targetValue ?? undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
