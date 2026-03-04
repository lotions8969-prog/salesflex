import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const period = searchParams.get("period");

  try {
    const values = await prisma.metricValue.findMany({
      where: {
        ...(userId && { userId }),
        ...(period && { period }),
      },
      include: { metricDefinition: true },
    });
    return NextResponse.json(values);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metric values" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, period, values } = body as {
      userId: string;
      period: string;
      values: Array<{
        metricDefinitionId: string;
        numberValue?: number;
        ratingValue?: number;
        textValue?: string;
        note?: string;
      }>;
    };

    const upserts = values.map((v) =>
      prisma.metricValue.upsert({
        where: {
          userId_metricDefinitionId_period: {
            userId,
            metricDefinitionId: v.metricDefinitionId,
            period,
          },
        },
        create: {
          userId,
          metricDefinitionId: v.metricDefinitionId,
          period,
          numberValue: v.numberValue ?? null,
          ratingValue: v.ratingValue ?? null,
          textValue: v.textValue ?? null,
          note: v.note ?? null,
        },
        update: {
          numberValue: v.numberValue ?? null,
          ratingValue: v.ratingValue ?? null,
          textValue: v.textValue ?? null,
          note: v.note ?? null,
        },
      })
    );

    const results = await prisma.$transaction(upserts);
    return NextResponse.json(results, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save metric values" },
      { status: 500 }
    );
  }
}
