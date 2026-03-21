const cron = require("node-cron");
const Deadline = require("../models/deadlineModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const { sendCustomEmail } = require("../utils/email");
const { dispatch } = require("./automationEngine");

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const sendDeadlineEmail = async (deadline, subject, body) => {
  const assignedUser = await User.findById(deadline.assignedTo);

  if (!assignedUser || !assignedUser.email) {
    console.log(`No email found for user ${deadline.assignedTo}`);
    return false;
  }

  try {
    await sendCustomEmail(
      subject,
      assignedUser.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      body
    );
    return true;
  } catch (error) {
    console.error(`Failed to send email for deadline ${deadline._id}:`, error);
    return false;
  }
};

const sendSupervisorAlert = async (deadline, message) => {
  if (!deadline.supervisor) return false;

  const supervisor = await User.findById(deadline.supervisor);
  if (!supervisor || !supervisor.email) return false;

  try {
    await sendCustomEmail(
      `Escalation: ${deadline.title}`,
      supervisor.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Deadline Escalation Alert</h2>
          </div>
          <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 8px 8px;">
            ${message}
          </div>
        </div>
      `
    );
    return true;
  } catch (error) {
    console.error("Failed to send supervisor alert:", error);
    return false;
  }
};

const sendMonthlyReport = async () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const firms = await Firm.find({ isActive: true });

  for (const firm of firms) {
    const report = await Deadline.aggregate([
      {
        $match: {
          firmId: firm._id,
          status: "completed",
          completedAt: { $gte: lastMonth, $lte: endOfLastMonth },
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          onTime: { $sum: { $cond: ["$performance.wasOnTime", 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ["$performance.wasOnTime", false] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          email: "$user.email",
          total: 1,
          onTime: 1,
          missed: 1,
          rate: {
            $multiply: [
              { $divide: ["$onTime", { $max: ["$total", 1] }] },
              100,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const admins = await User.find({
      firmId: firm._id,
      role: { $in: ["admin", "super-admin"] },
      isActive: true,
    });

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    for (const admin of admins) {
      if (!admin.email) continue;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Monthly Deadline Performance Report</h1>
            <p style="color: white; margin: 10px 0 0;">${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h3>${firm.name} - Performance Summary</h3>
            ${report.length === 0
              ? "<p>No deadlines were completed during this period.</p>"
              : `<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr style="background: #10b981; color: white;">
                    <th style="padding: 10px; text-align: left;">Lawyer</th>
                    <th style="padding: 10px; text-align: center;">Total</th>
                    <th style="padding: 10px; text-align: center;">On Time</th>
                    <th style="padding: 10px; text-align: center;">Missed</th>
                    <th style="padding: 10px; text-align: center;">Rate</th>
                  </tr>
                  ${report.map(r => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 10px;">${r.name || "Unknown"}</td>
                      <td style="padding: 10px; text-align: center;">${r.total}</td>
                      <td style="padding: 10px; text-align: center;">${r.onTime}</td>
                      <td style="padding: 10px; text-align: center; color: ${r.missed > 0 ? '#dc2626' : 'inherit'};">${r.missed}</td>
                      <td style="padding: 10px; text-align: center; font-weight: bold;">${r.rate.toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </table>`
            }
          </div>
        </div>
      `;

      try {
        await sendCustomEmail(
          `LawMaster Monthly Deadline Report - ${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
          admin.email,
          process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
          null,
          html
        );
      } catch (error) {
        console.error(`Failed to send monthly report to ${admin.email}:`, error);
      }
    }
  }
};

const initDeadlineCronJobs = () => {
  console.log("Initializing Deadline Cron Jobs...");

  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running 7-day deadline reminder job...");

    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const startOfWindow = new Date(sevenDaysFromNow);
      startOfWindow.setHours(0, 0, 0, 0);
      const endOfWindow = new Date(sevenDaysFromNow);
      endOfWindow.setHours(23, 59, 59, 999);

      const deadlines = await Deadline.find({
        dueDate: { $gte: startOfWindow, $lte: endOfWindow },
        status: { $in: ["pending", "in-progress"] },
        "escalation.sevenDayReminderSent": false,
        isDeleted: { $ne: true },
      }).populate("assignedTo", "firstName lastName email");

      console.log(`Found ${deadlines.length} deadlines due in 7 days`);

      for (const deadline of deadlines) {
        if (!deadline.assignedTo?.email) continue;

        const success = await sendDeadlineEmail(
          deadline,
          `⚠️ Deadline in 7 Days: ${deadline.title}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2>Deadline Reminder</h2>
              <p>Dear ${deadline.assignedTo.firstName},</p>
              <p>This is a reminder that the following deadline is due in <strong>7 days</strong>:</p>
              <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>${deadline.title}</strong></p>
                <p style="margin: 10px 0 0;">Due: ${formatDate(deadline.dueDate)}</p>
                ${deadline.category ? `<p style="margin: 5px 0 0;">Category: ${deadline.category}</p>` : ""}
                ${deadline.priority === "high" || deadline.priority === "critical" ? `<p style="color: #dc2626; margin: 5px 0 0;">Priority: ${deadline.priority.toUpperCase()}</p>` : ""}
              </div>
              <p>Please take action to ensure this deadline is met.</p>
            </div>
          `
        );

        if (success) {
          deadline.escalation.sevenDayReminderSent = true;
          deadline.escalation.sevenDayReminderSentAt = new Date();
          deadline.notificationLog.push({
            type: "7-day",
            sentAt: new Date(),
            sentTo: [deadline.assignedTo._id],
            channel: "email",
            success: true,
          });
          await deadline.save();
        }
      }
    } catch (error) {
      console.error("[CRON] Error in 7-day reminder job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Running 24-hour deadline escalation job...");

    try {
      const twentyFourHoursFromNow = new Date();
      twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

      const deadlines = await Deadline.find({
        dueDate: { $lte: twentyFourHoursFromNow },
        status: { $nin: ["completed", "cancelled"] },
        "escalation.oneDayReminderSent": false,
        isDeleted: { $ne: true },
      }).populate("assignedTo", "firstName lastName email")
        .populate("supervisor", "firstName lastName email");

      console.log(`Found ${deadlines.length} deadlines due in 24 hours`);

      for (const deadline of deadlines) {
        if (!deadline.assignedTo?.email) continue;

        const urgentBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">URGENT: Deadline Due in 24 Hours</h2>
            </div>
            <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Dear ${deadline.assignedTo.firstName},</p>
              <p style="font-size: 18px; font-weight: bold;">The following deadline is due in less than 24 hours:</p>
              <div style="background: white; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 20px; font-weight: bold;">${deadline.title}</p>
                <p style="margin: 10px 0 0;">Due: ${formatDate(deadline.dueDate)}</p>
                ${deadline.category ? `<p style="margin: 5px 0 0;">Category: ${deadline.category}</p>` : ""}
              </div>
              <p>Please take immediate action.</p>
            </div>
          </div>
        `;

        const success = await sendDeadlineEmail(
          deadline,
          `URGENT: ${deadline.title} due in 24 hours`,
          urgentBody
        );

        if (success) {
          deadline.escalation.oneDayReminderSent = true;
          deadline.escalation.oneDayReminderSentAt = new Date();
          deadline.notificationLog.push({
            type: "24-hour",
            sentAt: new Date(),
            sentTo: [deadline.assignedTo._id],
            channel: "email",
            success: true,
          });
        }

        if (deadline.supervisor && !deadline.escalation.supervisorAlertSent) {
          const supervisorAlert = `
            <p>Warning: <strong>${deadline.assignedTo.firstName} ${deadline.assignedTo.lastName}</strong> has an unresolved deadline that is due in less than 24 hours.</p>
            <div style="background: white; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>${deadline.title}</strong></p>
              <p style="margin: 10px 0 0;">Due: ${formatDate(deadline.dueDate)}</p>
              <p style="margin: 5px 0 0;">Assigned to: ${deadline.assignedTo.firstName} ${deadline.assignedTo.lastName}</p>
            </div>
            <p>Please follow up with the assigned lawyer immediately.</p>
          `;

          const alertSuccess = await sendSupervisorAlert(deadline, supervisorAlert);

          if (alertSuccess) {
            deadline.escalation.supervisorAlertSent = true;
            deadline.escalation.supervisorAlertSentAt = new Date();
            deadline.escalation.isEscalated = true;
            deadline.escalation.escalatedAt = new Date();
            deadline.escalation.escalationReason = "24-hour escalation";
            deadline.notificationLog.push({
              type: "escalation",
              sentAt: new Date(),
              sentTo: [deadline.supervisor._id],
              channel: "email",
              success: true,
            });
          }
        }

        await deadline.save();
      }
    } catch (error) {
      console.error("[CRON] Error in 24-hour escalation job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Running overdue detection job...");

    try {
      const now = new Date();

      const overdueDeadlines = await Deadline.find({
        dueDate: { $lt: now },
        status: { $in: ["pending", "in-progress"] },
        "escalation.overdueAlertSent": false,
        isDeleted: { $ne: true },
      }).populate("supervisor", "firstName lastName email");

      console.log(`Found ${overdueDeadlines.length} overdue deadlines`);

      for (const deadline of overdueDeadlines) {
        deadline.status = "missed";
        deadline.escalation.overdueAlertSent = true;
        deadline.performance = {
          wasOnTime: false,
          daysLate: Math.ceil((now - new Date(deadline.dueDate)) / (1000 * 60 * 60 * 24)),
        };

        if (deadline.supervisor) {
          await sendSupervisorAlert(
            deadline,
            `
              <p>The following deadline has become <strong>OVERDUE</strong>:</p>
              <div style="background: white; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>${deadline.title}</strong></p>
                <p style="margin: 10px 0 0;">Was due: ${formatDate(deadline.dueDate)}</p>
                <p style="margin: 5px 0 0; color: #dc2626;">Days late: ${deadline.performance.daysLate}</p>
              </div>
              <p>Please investigate and take corrective action.</p>
            `
          );

          deadline.notificationLog.push({
            type: "overdue",
            sentAt: new Date(),
            sentTo: [deadline.supervisor._id],
            channel: "email",
            success: true,
          });
        }

        await deadline.save();
      }
    } catch (error) {
      console.error("[CRON] Error in overdue detection job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 7 1 * *", async () => {
    console.log("[CRON] Running monthly performance report job...");

    try {
      await sendMonthlyReport();
      console.log("[CRON] Monthly performance reports sent");
    } catch (error) {
      console.error("[CRON] Error in monthly report job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running recurring deadline generator...");

    try {
      const now = new Date();
      const recurringDeadlines = await Deadline.find({
        isRecurring: true,
        "recurrence.nextOccurrence": { $lte: now },
        status: { $nin: ["cancelled"] },
        isDeleted: { $ne: true },
      });

      console.log(`Found ${recurringDeadlines.length} recurring deadlines to generate`);

      for (const parent of recurringDeadlines) {
        if (parent.recurrence.endDate && new Date(parent.recurrence.endDate) < now) {
          continue;
        }

        const newDeadline = new Deadline({
          firmId: parent.firmId,
          title: parent.title,
          description: parent.description,
          linkedEntityType: parent.linkedEntityType,
          linkedEntityId: parent.linkedEntityId,
          assignedTo: parent.assignedTo,
          supervisor: parent.supervisor,
          createdBy: parent.createdBy,
          dueDate: parent.recurrence.nextOccurrence,
          timezone: parent.timezone,
          category: parent.category,
          priority: parent.priority,
          tags: parent.tags,
          isRecurring: parent.isRecurring,
          recurrence: {
            ...parent.recurrence,
            parentDeadlineId: parent._id,
          },
        });
        newDeadline.deadlineNumber = await Deadline.generateDeadlineNumber(parent.firmId);

        let nextDate = new Date(parent.recurrence.nextOccurrence);
        const { frequency, interval = 1 } = parent.recurrence;

        switch (frequency) {
          case "daily": nextDate.setDate(nextDate.getDate() + interval); break;
          case "weekly": nextDate.setDate(nextDate.getDate() + 7 * interval); break;
          case "monthly": nextDate.setMonth(nextDate.getMonth() + interval); break;
          case "quarterly": nextDate.setMonth(nextDate.getMonth() + 3 * interval); break;
          case "annually": nextDate.setFullYear(nextDate.getFullYear() + interval); break;
        }

        if (!parent.recurrence.endDate || nextDate <= new Date(parent.recurrence.endDate)) {
          parent.recurrence.nextOccurrence = nextDate;
          await parent.save();
        }

        await newDeadline.save();
        console.log(`Created recurring deadline: ${newDeadline.deadlineNumber}`);
      }
    } catch (error) {
      console.error("[CRON] Error in recurring deadline generator:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 0 * * *", async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    try {
      const missedDeadlines = await Deadline.find({
        dueDate: { $lt: now },
        status: { $nin: ["completed", "cancelled"] },
        "automationFlags.missedAlertSent": { $ne: true },
      }).populate([
        { path: "assignedTo", select: "firstName lastName email" },
        { path: "supervisor", select: "firstName lastName email" },
      ]);

      for (const deadline of missedDeadlines) {
        await dispatch("deadline.missed", deadline.toObject(), deadline.firmId);
        deadline.automationFlags = deadline.automationFlags || {};
        deadline.automationFlags.missedAlertSent = true;
        await deadline.save();
        console.log(`[CRON] Triggered deadline.missed automation for ${deadline.deadlineNumber}`);
      }
    } catch (error) {
      console.error("[CRON] Error checking missed deadlines:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  console.log("Deadline Cron Jobs initialized successfully");
};

module.exports = { initDeadlineCronJobs };
