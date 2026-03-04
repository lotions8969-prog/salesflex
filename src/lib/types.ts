export type MetricType = "NUMBER" | "RATING_5" | "TEXT";
export type MetricCategory = "SALES_RESULT" | "BEHAVIOR" | "SKILL";
export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";

export interface MetricDefinition {
  id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  type: MetricType;
  category: MetricCategory;
  displayOrder: number;
  showInRadarChart: boolean;
  showInDashboard: boolean;
  showInProgressBoard: boolean;
  minValue?: number | null;
  maxValue?: number | null;
  targetValue?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetricValue {
  id: string;
  userId: string;
  metricDefinitionId: string;
  metricDefinition?: MetricDefinition;
  numberValue?: number | null;
  ratingValue?: number | null;
  textValue?: string | null;
  period: string;
  note?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
  avatarUrl?: string | null;
  metricValues?: MetricValue[];
}

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  NUMBER: "数値",
  RATING_5: "5段階評価",
  TEXT: "テキスト",
};

export const METRIC_CATEGORY_LABELS: Record<MetricCategory, string> = {
  SALES_RESULT: "営業成果",
  BEHAVIOR: "行動指標",
  SKILL: "スキル評価",
};

export const METRIC_CATEGORY_COLORS: Record<MetricCategory, string> = {
  SALES_RESULT: "bg-blue-100 text-blue-800",
  BEHAVIOR: "bg-green-100 text-green-800",
  SKILL: "bg-purple-100 text-purple-800",
};
