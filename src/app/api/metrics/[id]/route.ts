import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const metric = await prisma.metricDefinition.update({
      where: { id },
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
    return NextResponse.json(metric);
  } catch {
    return NextResponse.json(
      { error: "Failed to update metric" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.metricDefinition.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete metric" },
      { status: 500 }
    );
  }
}
