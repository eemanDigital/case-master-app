const Task = require("../models/taskModel");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

class TaskService {
  /**
   * Validate task assignment
   */
  async validateAssignment(assignedTo, assignedToClient) {
    if ((!assignedTo || assignedTo.length === 0) && !assignedToClient) {
      throw new AppError(
        "Task must be assigned to at least one staff member or client",
        400
      );
    }

    if (assignedTo && assignedTo.length > 0 && assignedToClient) {
      throw new AppError(
        "Task cannot be assigned to both staff and client",
        400
      );
    }

    // Validate user IDs exist
    if (assignedTo && assignedTo.length > 0) {
      const users = await User.find({ _id: { $in: assignedTo } });
      if (users.length !== assignedTo.length) {
        throw new AppError("One or more assigned users not found", 404);
      }
    }

    if (assignedToClient) {
      const client = await User.findById(assignedToClient);
      if (!client) {
        throw new AppError("Assigned client not found", 404);
      }
    }
  }

  /**
   * Check for overdue tasks and update status
   */
  async updateOverdueTasks() {
    const now = new Date();
    const result = await Task.updateMany(
      {
        dueDate: { $lt: now },
        status: { $in: ["pending", "in-progress"] },
      },
      {
        $set: { status: "overdue" },
      }
    );
    return result;
  }

  /**
   * Get task statistics for a user
   */
  async getUserTaskStats(userId, role) {
    const filter =
      role === "client" ? { assignedToClient: userId } : { assignedTo: userId };

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: "pending" }),
      Task.countDocuments({ ...filter, status: "in-progress" }),
      Task.countDocuments({ ...filter, status: "completed" }),
      Task.countDocuments({ ...filter, status: "overdue" }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Send task reminder notifications
   */
  async sendTaskReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const upcomingTasks = await Task.find({
      dueDate: { $lte: tomorrow },
      status: { $in: ["pending", "in-progress"] },
    });

    // Here you would integrate with your notification service
    return upcomingTasks;
  }
}

module.exports = new TaskService();
