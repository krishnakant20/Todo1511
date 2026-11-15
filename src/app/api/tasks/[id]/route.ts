import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { errorResponse, isValidObjectId, validateTaskInput } from "@/lib/http";
import Task from "@/models/Task";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    await connectToDatabase();
    const task = await Task.findById(id).lean();
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error, "Could not load task.");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    }
    const result = validateTaskInput(input as Record<string, unknown>, true);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    await connectToDatabase();
    const task = await Task.findByIdAndUpdate(id, result.update, { new: true, runValidators: true });
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    return errorResponse(error, "Could not update task.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    await connectToDatabase();
    const task = await Task.findByIdAndDelete(id);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Could not delete task.");
  }
}
