const Task = require("../models/taskModel");
const User = require("../models/userModel");
const { CalendarEvent, EVENT_TYPES } = require("../models/calenderEventModel");
const Notice = require("../models/notificationModel");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");

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
          await this.sendTaskReminder(task, reminder);
        }
      }
    }

    // Process calendar event reminders
    await this.processCalendarEventReminders();
  }

  /**
   * Process calendar event reminders
   */
  async processCalendarEventReminders() {
    const now = new Date();
    const futureWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

    const events = await CalendarEvent.find({
      status: { $in: ["scheduled", "confirmed"] },
      isDeleted: { $ne: true },
      startDateTime: { $gte: now, $lte: futureWindow },
    })
      .populate("organizer", "firstName lastName email")
      .populate("participants.user", "firstName lastName email")
      .populate("matter", "matterName caseNumber");

    for (const event of events) {
      await this.processEventReminders(event);
    }
  }

  /**
   * Process reminders for a single calendar event
   */
  async processEventReminders(event) {
    const now = new Date();
    const eventStart = new Date(event.startDateTime);

    const reminderConfig = this.getReminderConfig(event.eventType);

    for (const config of reminderConfig) {
      const reminderTime = new Date(
        eventStart.getTime() - config.minutesBefore * 60 * 1000,
      );
      const shouldSend =
        now >= reminderTime && now < reminderTime.getTime() + 60000;

      if (shouldSend) {
        const reminderKey = `reminder_${config.minutesBefore}_${config.type}`;
        const lastSent = event.lastReminderSent?.[reminderKey];

        if (!lastSent || now.getTime() - new Date(lastSent).getTime() > 60000) {
          await this.sendEventReminder(event, config);

          if (!event.lastReminderSent) {
            event.lastReminderSent = {};
          }
          event.lastReminderSent[reminderKey] = now;
          await event.save();
        }
      }
    }
  }

  /**
   * Get reminder configuration based on event type
   */
  getReminderConfig(eventType) {
    const defaultConfig = [
      { minutesBefore: 1440, type: "email", label: "24 hours" }, // 24 hours
      { minutesBefore: 60, type: "in_app", label: "1 hour" }, // 1 hour
    ];

    const configs = {
      [EVENT_TYPES.HEARING]: [
        { minutesBefore: 2880, type: "email", label: "48 hours" }, // 48 hours
        { minutesBefore: 1440, type: "email", label: "24 hours" },
        { minutesBefore: 60, type: "in_app", label: "1 hour" },
      ],
      [EVENT_TYPES.MENTION]: [
        { minutesBefore: 1440, type: "email", label: "24 hours" },
        { minutesBefore: 60, type: "in_app", label: "1 hour" },
      ],
      [EVENT_TYPES.FILING_DEADLINE]: [
        { minutesBefore: 2880, type: "email", label: "48 hours" },
        { minutesBefore: 1440, type: "email", label: "24 hours" },
        { minutesBefore: 60, type: "in_app", label: "1 hour" },
      ],
      [EVENT_TYPES.CLIENT_MEETING]: [
        { minutesBefore: 1440, type: "email", label: "24 hours" },
        { minutesBefore: 60, type: "email", label: "1 hour" },
      ],
      [EVENT_TYPES.INTERNAL_MEETING]: [
        { minutesBefore: 60, type: "in_app", label: "1 hour" },
      ],
    };

    return configs[eventType] || defaultConfig;
  }

  /**
   * Send reminder for calendar event
   */
  async sendEventReminder(event, config) {
    const firm = await Firm.findById(event.firmId);
    const senderEmail =
      firm?.email || process.env.EMAIL_FROM || "noreply@LawMaster.com";

    const recipients = this.getEventRecipients(event);

    const eventDetails = this.formatEventDetails(event);

    for (const recipient of recipients) {
      if (!recipient.email) continue;

      if (config.type === "email") {
        await this.sendEventEmailReminder(
          recipient,
          event,
          config,
          eventDetails,
          senderEmail,
        );
      }

      if (config.type === "in_app") {
        await this.sendInAppNotification(
          recipient,
          event,
          config,
          eventDetails,
        );
      }
    }
  }

  /**
   * Get all recipients for an event reminder
   */
  getEventRecipients(event) {
    const recipients = new Map();

    if (event.organizer) {
      recipients.set(event.organizer._id.toString(), event.organizer);
    }

    if (event.participants) {
      for (const p of event.participants) {
        if (p.user && p.responseStatus !== "declined") {
          recipients.set(p.user._id.toString(), p.user);
        }
      }
    }

    return Array.from(recipients.values());
  }

  /**
   * Format event details for email
   */
  formatEventDetails(event) {
    const eventDate = new Date(event.startDateTime).toLocaleDateString(
      "en-NG",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
    const eventTime = new Date(event.startDateTime).toLocaleTimeString(
      "en-NG",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    const endTime = new Date(event.endDateTime).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let location = "Not specified";
    if (event.location) {
      if (event.location.virtualMeetingLink) {
        location = `Virtual Meeting: ${event.location.virtualMeetingLink}`;
      } else if (event.location.courtName) {
        location = `${event.location.courtName}${event.location.courtRoom ? `, Room ${event.location.courtRoom}` : ""}`;
      } else if (event.location.address) {
        location = event.location.address;
      }
    }

    return {
      title: event.title,
      eventType: event.eventType,
      eventDate,
      eventTime,
      endTime,
      location,
      matter: event.matter
        ? `${event.matter.matterName} (${event.matter.caseNumber})`
        : "Not linked to a matter",
      description: event.description || "No description provided",
      suitNumber: event.hearingMetadata?.suitNumber,
      judge: event.hearingMetadata?.judge,
    };
  }

  /**
   * Send email reminder for calendar event
   */
  async sendEventEmailReminder(
    recipient,
    event,
    config,
    eventDetails,
    senderEmail,
  ) {
    const subjectPrefix =
      event.eventType === EVENT_TYPES.HEARING
        ? "🔨 Court Hearing Reminder"
        : event.eventType === EVENT_TYPES.FILING_DEADLINE
          ? "⚠️ Deadline Reminder"
          : "📅 Event Reminder";

    const subject = `${subjectPrefix}: ${event.title} - ${config.label}`;

    const htmlContent = this.generateEventEmailHtml(
      recipient,
      event,
      config,
      eventDetails,
    );

    try {
      await sendCustomEmail(
        subject,
        recipient.email,
        senderEmail,
        senderEmail,
        htmlContent,
      );
      console.log(
        `📧 Email reminder sent to ${recipient.email} for event: ${event.title}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to send email to ${recipient.email}:`,
        error.message,
      );
    }
  }

  /**
   * Generate HTML for event reminder email
   */
  generateEventEmailHtml(recipient, event, config, eventDetails) {
    const isHearing = event.eventType === EVENT_TYPES.HEARING;
    const isDeadline =
      event.eventType === EVENT_TYPES.FILING_DEADLINE ||
      event.eventType === EVENT_TYPES.STATUTORY_DEADLINE;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isHearing ? "#d32f2f" : isDeadline ? "#f57c00" : "#1976d2"}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 10px; }
          .urgent { background: #ffebee; border-left: 4px solid #d32f2f; padding: 10px; margin: 15px 0; }
          .footer { background: #eee; padding: 15px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">${isHearing ? "🔨 Court Hearing" : isDeadline ? "⚠️ Important Deadline" : "📅 Event Reminder"}</h2>
            <p style="margin: 5px 0 0 0;">${config.label} remaining</p>
          </div>
          <div class="content">
            <h3 style="margin-top: 0;">${eventDetails.title}</h3>
            
            ${isDeadline ? '<div class="urgent"><strong>⚠️ IMPORTANT:</strong> This is a deadline that should not be missed!</div>' : ""}
            
            <div class="detail-row">
              <span class="label">📅 Date:</span>
              <span class="value">${eventDetails.eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">⏰ Time:</span>
              <span class="value">${eventDetails.eventTime} - ${eventDetails.endTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">📍 Location:</span>
              <span class="value">${eventDetails.location}</span>
            </div>
            ${
              eventDetails.matter !== "Not linked to a matter"
                ? `
            <div class="detail-row">
              <span class="label">📁 Matter:</span>
              <span class="value">${eventDetails.matter}</span>
            </div>
            `
                : ""
            }
            ${
              eventDetails.suitNumber
                ? `
            <div class="detail-row">
              <span class="label">🏛️ Suit Number:</span>
              <span class="value">${eventDetails.suitNumber}</span>
            </div>
            `
                : ""
            }
            ${
              eventDetails.judge
                ? `
            <div class="detail-row">
              <span class="label">⚖️ Judge:</span>
              <span class="value">${eventDetails.judge}</span>
            </div>
            `
                : ""
            }
            ${
              eventDetails.description
                ? `
            <div class="detail-row">
              <span class="label">📝 Description:</span>
              <p class="value">${eventDetails.description}</p>
            </div>
            `
                : ""
            }
          </div>
          <div class="footer">
            <p>Hello ${recipient.firstName}, this is a reminder for your upcoming ${isHearing ? "court hearing" : "event"}.</p>
            <p>© ${new Date().getFullYear()} LawMaster - Law Firm Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send in-app notification for calendar event
   */
  async sendInAppNotification(recipient, event, config, eventDetails) {
    const isHearing = event.eventType === EVENT_TYPES.HEARING;
    const isDeadline = event.eventType === EVENT_TYPES.FILING_DEADLINE;

    const message = isHearing
      ? `🔨 Court Hearing in ${config.label}: ${event.title}${event.hearingMetadata?.suitNumber ? ` (${event.hearingMetadata.suitNumber})` : ""}`
      : isDeadline
        ? `⚠️ Deadline in ${config.label}: ${event.title}`
        : `📅 ${event.title} in ${config.label}`;

    try {
      const notification = await Notice.create({
        sender: event.organizer._id,
        recipient: [recipient._id],
        message: message,
        timestamp: new Date(),
        status: "unread",
        relatedEvent: event._id,
      });

      console.log(
        `🔔 In-app notification sent to ${recipient.email} for event: ${event.title}`,
      );
    } catch (error) {
      console.error(`❌ Failed to create in-app notification:`, error.message);
    }
  }

  /**
   * Send a single task reminder notification
   */
  async sendTaskReminder(task, reminder) {
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
          (u, i, arr) =>
            arr.findIndex((x) => x._id.toString() === u._id.toString()) === i,
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
    const { taskId, taskTitle, dueDate, reminderMessage, sender, recipients } =
      data;

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
        console.error(
          `Failed to send notification to ${recipient.email}:`,
          error,
        );
      }
    }
  }

  /**
   * Get upcoming reminders for a task
   */
  async getUpcomingReminders(taskId) {
    const task = await Task.findById(taskId).populate(
      "reminders.sender",
      "firstName lastName email",
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
      "firstName lastName email",
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
