import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await prisma.metricDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metric = await prisma.metricDefinition.create({
      data: {
        name: body.name,
        description: body.description || null,
        unit: body.unit || null,
        type: body.type,
        category: body.category,
        displayOrder: body.displayOrder || 0,
        showInRadarChart: body.showInRadarChart ?? false,
        showInDashboard: body.showInDashboard ?? true,
        showInProgressBoard: body.showInProgressBoard ?? false,
        minValue: body.minValue ? parseFloat(body.minValue) : null,
        maxValue: body.maxValue ? parseFloat(body.maxValue) : null,
        targetValue: body.targetValue ? parseFloat(body.targetValue) : null,
      },
    });
    return NextResponse.json(metric, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create metric" },
      { status: 500 }
    );
  }
}
