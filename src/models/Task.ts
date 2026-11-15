import { model, models, Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    dueAt: { type: Date, required: true },
    endAt: { type: Date },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  },
  { timestamps: true },
);

taskSchema.index({ dueAt: 1 });
taskSchema.index({ title: "text", description: "text" });

const Task = models.Task || model("Task", taskSchema);

if (!Task.schema.path("endAt")) {
  Task.schema.add({ endAt: { type: Date } });
}

export default Task;
