import { NextResponse } from "next/server";

export function errorResponse(error: unknown, fallback: string) {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  const status = message.startsWith("Missing MONGODB_URI") ? 503 : 500;
  return NextResponse.json({ error: status === 503 ? message : fallback }, { status });
}

export function isValidObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

export function validateTaskInput(input: Record<string, unknown>, partial = false) {
  const update: Record<string, unknown> = {};
  if (!partial || "title" in input) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 120) {
      return { error: "Title is required and must be 120 characters or fewer." };
    }
    update.title = input.title.trim();
  }
  if (!partial || "dueAt" in input) {
    const dueAt = new Date(input.dueAt as string);
    if (typeof input.dueAt !== "string" || !input.dueAt || Number.isNaN(dueAt.getTime())) {
      return { error: "A valid date and time are required." };
    }
    update.dueAt = dueAt;
  }
  if ("endAt" in input) {
    const endAt = new Date(input.endAt as string);
    if (typeof input.endAt !== "string" || !input.endAt || Number.isNaN(endAt.getTime())) {
      return { error: "A valid end time is required." };
    }
    if (input.dueAt && endAt <= new Date(input.dueAt as string)) {
      return { error: "End time must be after start time." };
    }
    update.endAt = endAt;
  } else if (!partial || "dueAt" in input) {
    const startAt = update.dueAt as Date;
    update.endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  }
  if ("description" in input) {
    if (typeof input.description !== "string" || input.description.length > 1000) {
      return { error: "Description must be 1000 characters or fewer." };
    }
    update.description = input.description.trim();
  } else if (!partial) {
    update.description = "";
  }
  if ("priority" in input) {
    if (!["low", "medium", "high"].includes(input.priority as string)) {
      return { error: "Priority must be low, medium, or high." };
    }
    update.priority = input.priority;
  } else if (!partial) {
    update.priority = "medium";
  }
  if ("status" in input) {
    if (!["in_progress", "completed"].includes(input.status as string)) {
      return { error: "Status must be in_progress or completed." };
    }
    update.status = input.status;
  }
  if (partial && Object.keys(update).length === 0) return { error: "Provide at least one valid task field to update." };
  return { update };
}
