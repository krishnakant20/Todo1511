import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    return errorResponse(error, "Health check failed. Verify the MongoDB connection.");
  }
}
