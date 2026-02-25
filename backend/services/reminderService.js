const Task = require("../models/taskModel");
const User = require("../models/userModel");

class ReminderService {
  constructor() {
    this.isRunning = false;
    this.processingInterval = null;
  }

  /**
   * Start the reminder checking service
   * @param {number} intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
   */
  start(intervalMs = 60000) {
    if (this.isRunning) {
      console.log("Reminder service already running");
      return;
    }

    console.log("Starting reminder service...");
    this.isRunning = true;

    this.processingInterval = setInterval(async () => {
      try {
        await this.processDueReminders();
      } catch (error) {
        console.error("Error processing reminders:", error);
      }
    }, intervalMs);

    // Also run immediately on startup
    this.processDueReminders().catch(console.error);
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log("Stopping reminder service...");
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Process all due reminders
   */
  async processDueReminders() {
    const now = new Date();

    // Find all tasks with pending reminders that are due
    const tasks = await Task.find({
      "reminders.isSent": false,
      "reminders.scheduledFor": { $lte: now },
      isDeleted: { $ne: true },
    }).populate("reminders.sender", "firstName lastName email");

    for (const task of tasks) {
      for (const reminder of task.reminders) {
        if (!reminder.isSent && new Date(reminder.scheduledFor) <= now) {
          await this.sendReminder(task, reminder);
        }
      }
    }
  }

  /**
   * Send a single reminder notification
   */
  async sendReminder(task, reminder) {
    try {
      // Get all assignees of the task
      const assigneeIds = task.assignees.map((a) => a.user);
      const assignees = await User.find({ _id: { $in: assigneeIds } });

      // Get task creator
      const creator = await User.findById(task.createdBy);

      // Prepare notification data
      const notificationData = {
        taskId: task._id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        reminderMessage: reminder.message,
        scheduledFor: reminder.scheduledFor,
        sender: reminder.sender,
        recipients: [...assignees, creator].filter(
          (u, i, arr) => arr.findIndex((x) => x._id.toString() === u._id.toString()) === i
        ),
      };

      // Send notifications (email/in-app)
      await this.sendNotifications(notificationData);

      // Mark reminder as sent
      reminder.isSent = true;
      reminder.sentAt = new Date();
      await task.save();

      console.log(`Reminder sent for task: ${task.title}`);
    } catch (error) {
      console.error(`Failed to send reminder for task ${task._id}:`, error);
    }
  }

  /**
   * Send notifications to recipients
   */
  async sendNotifications(data) {
    const { taskId, taskTitle, dueDate, reminderMessage, sender, recipients } = data;

    for (const recipient of recipients) {
      if (!recipient.email) continue;

      try {
        // TODO: Integrate with your actual email/notification service
        // This is a placeholder for the notification logic
        const notification = {
          type: "task_reminder",
          title: `Task Reminder: ${taskTitle}`,
          message: reminderMessage,
          sender: sender?._id || sender,
          recipient: recipient._id,
          taskId,
          dueDate,
          metadata: {
            scheduledFor: new Date(),
          },
        };

        // You can save to notification collection or send directly
        // await Notification.create(notification);

        // Log for debugging
        console.log(`Would send reminder email to ${recipient.email}:`, {
          subject: `Reminder: ${taskTitle}`,
          body: reminderMessage,
        });

        // Example: Send email using your email service
        // await sendEmail({
        //   to: recipient.email,
        //   subject: `Task Reminder: ${taskTitle}`,
        //   template: 'taskReminder',
        //   context: {
        //     recipientName: `${recipient.firstName} ${recipient.lastName}`,
        //     taskTitle,
        //     dueDate,
        //     message: reminderMessage,
        //     senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'System',
        //     taskUrl: `/dashboard/tasks/${taskId}`,
        //   },
        // });
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.email}:`, error);
      }
    }
  }

  /**
   * Get upcoming reminders for a task
   */
  async getUpcomingReminders(taskId) {
    const task = await Task.findById(taskId).populate(
      "reminders.sender",
      "firstName lastName email"
    );

    if (!task) {
      return [];
    }

    return task.reminders
      .filter((r) => !r.isSent)
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  }

  /**
   * Get sent reminders for a task
   */
  async getSentReminders(taskId) {
    const task = await Task.findById(taskId).populate(
      "reminders.sender",
      "firstName lastName email"
    );

    if (!task) {
      return [];
    }

    return task.reminders
      .filter((r) => r.isSent)
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }

  /**
   * Cancel a pending reminder
   */
  async cancelReminder(taskId, reminderId) {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    const reminder = task.reminders.id(reminderId);

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    if (reminder.isSent) {
      throw new Error("Cannot cancel a reminder that has already been sent");
    }

    task.reminders.pull({ _id: reminderId });
    await task.save();

    return true;
  }
}

module.exports = new ReminderService();
