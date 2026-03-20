const cron = require("node-cron");
const ComplianceTracker = require("../models/complianceTrackerModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const { sendCustomEmail } = require("../utils/email");
const { checkCacStatus } = require("./cacWatchdog");

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sendUrgentAlert = async (entity, previousStatus, newStatus, firm) => {
  const assignedLawyer = await User.findById(entity.assignedTo);
  const client = await User.findById(entity.clientId);

  if (!assignedLawyer || !assignedLawyer.email) {
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">URGENT: CAC Status Change</h1>
      </div>
      <div style="background: #fef2f2; padding: 30px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; font-size: 16px;">Dear ${assignedLawyer.firstName},</p>
        <p style="color: #374151; font-size: 16px;">The CAC portal status for one of your clients has changed and requires <strong>immediate attention</strong>.</p>

        <div style="background: white; border: 3px solid #dc2626; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Entity Name:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${entity.entityName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">RC/BN Number:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">${entity.rcNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Previous Status:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #059669;">${previousStatus || "Unknown"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Current Status:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #dc2626; font-size: 20px;">${newStatus}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Client:</td>
              <td style="padding: 8px 0; color: #1f2937;">${client?.firstName || ""} ${client?.lastName || ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Detected:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formatDate(new Date())}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #92400e;">Recommended Immediate Actions:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #92400e;">
            <li>Contact the client immediately to discuss the status change</li>
            <li>Assess implications for the client's business operations</li>
            <li>Discuss options for status restoration (if applicable)</li>
            <li>Document all communications in the client file</li>
            <li>Prepare a remediation plan for the client</li>
          </ol>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">${firm?.name || "LawMaster"}</p>
      </div>
    </div>
  `;

  try {
    await sendCustomEmail(
      `URGENT: ${entity.entityName} is now ${newStatus} on CAC portal`,
      assignedLawyer.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      html
    );
    return true;
  } catch (error) {
    console.error("Failed to send urgent alert:", error);
    return false;
  }
};

const notifyAdmins = async (entity, firm) => {
  const admins = await User.find({
    firmId: entity.firmId,
    role: { $in: ["admin", "super-admin"] },
    isActive: true,
  }).select("email firstName");

  for (const admin of admins) {
    if (!admin.email) continue;

    try {
      await sendCustomEmail(
        `CAC Status Alert: ${entity.entityName}`,
        admin.email,
        process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
        null,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>CAC Status Change Alert</h2>
            <p>The entity <strong>${entity.entityName}</strong> (${entity.rcNumber}) has changed status on the CAC portal.</p>
            <p>New status: <strong>${entity.cacPortalStatus.portalStatus}</strong></p>
            <p>This has been flagged as a revenue opportunity and assigned to ${entity.assignedTo?.firstName || "the lawyer"}.</p>
          </div>
        `
      );
    } catch (error) {
      console.error(`Failed to notify admin ${admin.email}:`, error);
    }
  }
};

const initWatchdogCronJobs = () => {
  console.log("Initializing Watchdog Cron Jobs...");

  cron.schedule("0 2 1 * *", async () => {
    console.log("[CRON] Running monthly CAC status check...");

    try {
      const entities = await ComplianceTracker.find({
        "cacPortalStatus.rcNumber": { $exists: true, $ne: null },
        isDeleted: { $ne: true },
      }).select("_id rcNumber entityType entityName firmId clientId assignedTo cacPortalStatus");

      console.log(`Found ${entities.length} entities to check`);

      const batchSize = 10;
      let statusChanges = 0;

      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} entities)`);

        for (const entity of batch) {
          try {
            const result = await checkCacStatus(entity.rcNumber, entity.entityType);

            const previousStatus = entity.cacPortalStatus?.portalStatus;
            const newStatus = result.success ? result.status : previousStatus;

            entity.cacPortalStatus = {
              ...entity.cacPortalStatus,
              lastChecked: new Date(),
              previousPortalStatus: previousStatus,
              portalStatus: newStatus,
              watchdogNotes: result.error || undefined,
            };

            if (result.success && newStatus !== previousStatus) {
              console.log(`Status change detected for ${entity.entityName}: ${previousStatus} -> ${newStatus}`);

              entity.cacPortalStatus.statusChangedAt = new Date();
              entity.cacPortalStatus.requiresAttention = true;

              if (["INACTIVE", "STRUCK-OFF", "WOUND-UP"].includes(newStatus)) {
                entity.isRevenueOpportunity = true;
                entity.revenueOpportunityNote = `CAC status changed to ${newStatus} - urgent client contact needed`;
                entity.revenueOpportunityAmount = 50000;

                const firm = await Firm.findById(entity.firmId);
                await sendUrgentAlert(entity, previousStatus, newStatus, firm);
                await notifyAdmins(entity, firm);
              }

              statusChanges++;
            }

            await entity.save();
          } catch (error) {
            console.error(`Error checking entity ${entity._id}:`, error);
          }

          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        console.log(`Processed ${Math.min(i + batchSize, entities.length)}/${entities.length} entities`);
      }

      console.log(`[CRON] Watchdog check complete: ${entities.length} entities checked, ${statusChanges} status changes detected`);
    } catch (error) {
      console.error("[CRON] Error in monthly CAC status check:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("30 7 * * 1", async () => {
    console.log("[CRON] Running weekly watchdog status report...");

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [totalChecked, statusChangesThisMonth, alertsRequiringAttention, revenueOpportunities] = await Promise.all([
        ComplianceTracker.countDocuments({
          "cacPortalStatus.lastChecked": { $gte: startOfMonth },
          isDeleted: { $ne: true },
        }),
        ComplianceTracker.countDocuments({
          "cacPortalStatus.statusChangedAt": { $gte: startOfMonth },
          isDeleted: { $ne: true },
        }),
        ComplianceTracker.countDocuments({
          "cacPortalStatus.requiresAttention": true,
          isDeleted: { $ne: true },
        }),
        ComplianceTracker.aggregate([
          {
            $match: {
              isRevenueOpportunity: true,
              isDeleted: { $ne: true },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$revenueOpportunityAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const firms = await Firm.find({ isActive: true });

      for (const firm of firms) {
        const admins = await User.find({
          firmId: firm._id,
          role: { $in: ["admin", "super-admin"] },
          isActive: true,
        }).select("email firstName");

        const firmEntities = await ComplianceTracker.find({
          firmId: firm._id,
          "cacPortalStatus.requiresAttention": true,
          isDeleted: { $ne: true },
        }).select("entityName rcNumber cacPortalStatus");

        for (const admin of admins) {
          if (!admin.email) continue;

          try {
            await sendCustomEmail(
              `Weekly Watchdog Report - ${firm.name}`,
              admin.email,
              process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
              null,
              `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0;">Weekly CAC Watchdog Report</h1>
                    <p style="color: white; margin: 10px 0 0;">${formatDate(new Date())}</p>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h3>${firm.name} - Summary</h3>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
                      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                        <p style="font-size: 28px; font-weight: bold; color: #3b82f6; margin: 0;">${totalChecked}</p>
                        <p style="color: #6b7280; margin: 5px 0 0; font-size: 12px;">ENTITIES CHECKED</p>
                      </div>
                      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
                        <p style="font-size: 28px; font-weight: bold; color: #f59e0b; margin: 0;">${statusChangesThisMonth}</p>
                        <p style="color: #6b7280; margin: 5px 0 0; font-size: 12px;">STATUS CHANGES</p>
                      </div>
                    </div>

                    ${firmEntities.length > 0 ? `
                      <h4 style="color: #dc2626;">Entities Requiring Attention (${firmEntities.length})</h4>
                      <ul style="padding-left: 20px;">
                        ${firmEntities.slice(0, 5).map(e => `
                          <li><strong>${e.entityName}</strong> (${e.rcNumber}) - ${e.cacPortalStatus.portalStatus}</li>
                        `).join("")}
                        ${firmEntities.length > 5 ? `<li>...and ${firmEntities.length - 5} more</li>` : ""}
                      </ul>
                    ` : "<p>No entities currently require attention.</p>"}

                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Generated by LawMaster Watchdog</p>
                  </div>
                </div>
              `
            );
          } catch (error) {
            console.error(`Failed to send weekly report to ${admin.email}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("[CRON] Error in weekly watchdog report:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  console.log("Watchdog Cron Jobs initialized successfully");
};

module.exports = { initWatchdogCronJobs };
