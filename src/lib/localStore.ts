"use client";

import { MetricDefinition, MetricType, MetricCategory, MetricValue } from "./types";

// ===== MetricDefinitions =====

function getMetrics(): MetricDefinition[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("sf_metrics") ?? "[]");
  } catch {
    return [];
  }
}

function saveMetrics(metrics: MetricDefinition[]) {
  localStorage.setItem("sf_metrics", JSON.stringify(metrics));
}

export function listMetrics(): MetricDefinition[] {
  return getMetrics().filter((m) => m.isActive);
}

export function createMetric(data: Omit<MetricDefinition, "id" | "createdAt" | "updatedAt" | "isActive">): MetricDefinition {
  const metrics = getMetrics();
  const now = new Date().toISOString();
  const metric: MetricDefinition = {
    ...data,
    id: crypto.randomUUID(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  saveMetrics([...metrics, metric]);
  return metric;
}

export function updateMetric(id: string, data: Partial<MetricDefinition>): MetricDefinition {
  const metrics = getMetrics();
  const idx = metrics.findIndex((m) => m.id === id);
  if (idx === -1) throw new Error("Metric not found");
  const updated = { ...metrics[idx], ...data, updatedAt: new Date().toISOString() };
  metrics[idx] = updated;
  saveMetrics(metrics);
  return updated;
}

export function deleteMetric(id: string) {
  updateMetric(id, { isActive: false });
}

// ===== MetricValues =====

function getValues(): MetricValue[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("sf_values") ?? "[]");
  } catch {
    return [];
  }
}

function saveValues(values: MetricValue[]) {
  localStorage.setItem("sf_values", JSON.stringify(values));
}

export function listValues(userId?: string, period?: string): MetricValue[] {
  let values = getValues();
  if (userId) values = values.filter((v) => v.userId === userId);
  if (period) values = values.filter((v) => v.period === period);
  return values;
}

export function upsertValues(
  userId: string,
  period: string,
  inputs: Array<{
    metricDefinitionId: string;
    numberValue?: number;
    ratingValue?: number;
    textValue?: string;
    note?: string;
  }>
) {
  const all = getValues();
  for (const inp of inputs) {
    const key = `${userId}__${inp.metricDefinitionId}__${period}`;
    const existing = all.findIndex(
      (v) => v.userId === userId && v.metricDefinitionId === inp.metricDefinitionId && v.period === period
    );
    const entry: MetricValue = {
      id: existing >= 0 ? all[existing].id : crypto.randomUUID(),
      userId,
      metricDefinitionId: inp.metricDefinitionId,
      period,
      numberValue: inp.numberValue ?? null,
      ratingValue: inp.ratingValue ?? null,
      textValue: inp.textValue ?? null,
      note: inp.note ?? null,
    };
    void key;
    if (existing >= 0) {
      all[existing] = entry;
    } else {
      all.push(entry);
    }
  }
  saveValues(all);
}

// ===== Seed demo data =====

export function seedDemoDataIfEmpty() {
  const existing = listMetrics();
  if (existing.length > 0) return;

  const demoMetrics: Array<Omit<MetricDefinition, "id" | "createdAt" | "updatedAt" | "isActive">> = [
    {
      name: "月間売上",
      description: "月次の売上実績",
      unit: "万円",
      type: "NUMBER" as MetricType,
      category: "SALES_RESULT" as MetricCategory,
      displayOrder: 1,
      showInRadarChart: false,
      showInDashboard: true,
      showInProgressBoard: true,
      minValue: 0,
      maxValue: 500,
      targetValue: 300,
    },
    {
      name: "商談化率",
      description: "リードから商談に進んだ割合",
      unit: "%",
      type: "NUMBER" as MetricType,
      category: "SALES_RESULT" as MetricCategory,
      displayOrder: 2,
      showInRadarChart: false,
      showInDashboard: true,
      showInProgressBoard: true,
      minValue: 0,
      maxValue: 100,
      targetValue: 40,
    },
    {
      name: "月間訪問数",
      description: "顧客への訪問・オンライン商談件数",
      unit: "件",
      type: "NUMBER" as MetricType,
      category: "BEHAVIOR" as MetricCategory,
      displayOrder: 3,
      showInRadarChart: false,
      showInDashboard: true,
      showInProgressBoard: true,
      minValue: 0,
      maxValue: 50,
      targetValue: 30,
    },
    {
      name: "ヒアリング力",
      description: "顧客ニーズを引き出す力",
      unit: null,
      type: "RATING_5" as MetricType,
      category: "SKILL" as MetricCategory,
      displayOrder: 4,
      showInRadarChart: true,
      showInDashboard: true,
      showInProgressBoard: false,
      minValue: null,
      maxValue: null,
      targetValue: null,
    },
    {
      name: "提案力",
      description: "課題に対する提案の質",
      unit: null,
      type: "RATING_5" as MetricType,
      category: "SKILL" as MetricCategory,
      displayOrder: 5,
      showInRadarChart: true,
      showInDashboard: true,
      showInProgressBoard: false,
      minValue: null,
      maxValue: null,
      targetValue: null,
    },
    {
      name: "クロージング力",
      description: "契約に持ち込む交渉力",
      unit: null,
      type: "RATING_5" as MetricType,
      category: "SKILL" as MetricCategory,
      displayOrder: 6,
      showInRadarChart: true,
      showInDashboard: true,
      showInProgressBoard: false,
      minValue: null,
      maxValue: null,
      targetValue: null,
    },
    {
      name: "関係構築力",
      description: "長期的な顧客関係を育む力",
      unit: null,
      type: "RATING_5" as MetricType,
      category: "SKILL" as MetricCategory,
      displayOrder: 7,
      showInRadarChart: true,
      showInDashboard: true,
      showInProgressBoard: false,
      minValue: null,
      maxValue: null,
      targetValue: null,
    },
    {
      name: "自己管理力",
      description: "タスク・スケジュール管理の徹底度",
      unit: null,
      type: "RATING_5" as MetricType,
      category: "SKILL" as MetricCategory,
      displayOrder: 8,
      showInRadarChart: true,
      showInDashboard: true,
      showInProgressBoard: false,
      minValue: null,
      maxValue: null,
      targetValue: null,
    },
  ];

  const savedMetrics = demoMetrics.map((m) => createMetric(m));

  // デモ値を入れる
  const DEMO_USERS = ["user1", "user2", "user3"];
  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const demoValues: Record<string, Array<{ numberValue?: number; ratingValue?: number }>> = {
    user1: [
      { numberValue: 245 },
      { numberValue: 38 },
      { numberValue: 28 },
      { ratingValue: 4 },
      { ratingValue: 4 },
      { ratingValue: 3 },
      { ratingValue: 5 },
      { ratingValue: 4 },
    ],
    user2: [
      { numberValue: 180 },
      { numberValue: 52 },
      { numberValue: 22 },
      { ratingValue: 5 },
      { ratingValue: 3 },
      { ratingValue: 4 },
      { ratingValue: 4 },
      { ratingValue: 3 },
    ],
    user3: [
      { numberValue: 320 },
      { numberValue: 29 },
      { numberValue: 35 },
      { ratingValue: 3 },
      { ratingValue: 5 },
      { ratingValue: 5 },
      { ratingValue: 3 },
      { ratingValue: 5 },
    ],
  };

  for (const userId of DEMO_USERS) {
    const inputs = savedMetrics.map((m, i) => ({
      metricDefinitionId: m.id,
      ...demoValues[userId][i],
    }));
    upsertValues(userId, period, inputs);
  }
}
