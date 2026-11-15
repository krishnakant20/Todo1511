import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { errorResponse, validateTaskInput } from "@/lib/http";
import Task from "@/models/Task";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const filter = search ? {
      $or: [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { description: { $regex: escapeRegex(search), $options: "i" } },
      ],
    } : {};
    const tasks = await Task.find(filter).sort({ dueAt: 1 }).lean();
    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse(error, "Could not load tasks.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    }
    const result = validateTaskInput(input as Record<string, unknown>);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    await connectToDatabase();
    const task = await Task.create(result.update);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    return errorResponse(error, "Could not create task.");
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
