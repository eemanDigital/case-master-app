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

  if (!assignedLawyer || !assignedLawyer.email) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px;
           text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">
          URGENT: CAC Status Change
        </h1>
      </div>
      <div style="background: #fef2f2; padding: 30px; border: 1px solid #fecaca;
           border-top: none; border-radius: 0 0 10px 10px;">
        <p style="color: #374151; font-size: 16px;">Dear ${assignedLawyer.firstName},</p>
        <p style="color: #374151; font-size: 16px;">
          The CAC portal status for one of your clients has changed and requires
          <strong>immediate attention</strong>.
        </p>
        <div style="background: white; border: 3px solid #dc2626; border-radius: 12px;
             padding: 25px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Entity Name:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">
                ${entity.entityName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">RC/BN Number:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1f2937;">
                ${entity.rcNumber}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Previous Status:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #059669;">
                ${previousStatus || "Unknown"}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Current Status:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #dc2626; font-size: 20px;">
                ${newStatus}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Client:</td>
              <td style="padding: 8px 0; color: #1f2937;">
                ${client?.firstName || ""} ${client?.lastName || ""}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Detected:</td>
              <td style="padding: 8px 0; color: #1f2937;">${formatDate(new Date())}</td>
            </tr>
          </table>
        </div>
        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 20px;
             border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #92400e;">Recommended Immediate Actions:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #92400e;">
            <li>Contact the client immediately to discuss the status change</li>
            <li>Assess implications for the client's business operations</li>
            <li>Discuss options for status restoration (if applicable)</li>
            <li>Document all communications in the client file</li>
            <li>Prepare a remediation plan for the client</li>
          </ol>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          ${firm?.name || "LawMaster"}
        </p>
      </div>
    </div>
  `;

  try {
    await sendCustomEmail(
      `🚨 URGENT: ${entity.entityName} is now ${newStatus} on CAC portal`,
      assignedLawyer.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      html,
    );
    return true;
  } catch (error) {
    console.error("Failed to send urgent alert:", error);
    return false;
  }
};

const notifyFirmAdmins = async (entity, firm) => {
  const admins = await User.find({
    firmId: entity.firmId,
    role: { $in: ["admin", "super-admin"] },
    isActive: true,
    isDeleted: { $ne: true },
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
            <p>
              The entity <strong>${entity.entityName}</strong> (${entity.rcNumber})
              has changed status on the CAC portal.
            </p>
            <p>New status: <strong>${entity.cacPortalStatus.portalStatus}</strong></p>
            <p>
              This has been flagged as a revenue opportunity and the assigned
              lawyer has been notified.
            </p>
          </div>
        `,
      );
    } catch (error) {
      console.error(`Failed to notify admin ${admin.email}:`, error);
    }
  }
};

const initWatchdogCronJobs = () => {
  console.log("Initializing Watchdog Cron Jobs...");

  // ── JOB 1: Monthly CAC Status Check (1st of each month at 2:00 AM) ────────
  cron.schedule(
    "0 2 1 * *",
    async () => {
      console.log("[CRON] Running monthly CAC status check...");

      try {
        // ✅ FIXED: query top-level rcNumber, not cacPortalStatus.rcNumber
        const entities = await ComplianceTracker.find({
          rcNumber: { $exists: true, $ne: null, $ne: "" },
          isDeleted: { $ne: true },
        }).select(
          "_id rcNumber entityType entityName firmId clientId assignedTo cacPortalStatus isRevenueOpportunity",
        );

        console.log(`Found ${entities.length} entities to check`);

        const BATCH_SIZE = 10;
        const DELAY_MS = 3000;
        let statusChanges = 0;
        let errors = 0;

        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
          const batch = entities.slice(i, i + BATCH_SIZE);
          console.log(
            `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(entities.length / BATCH_SIZE)}`,
          );

          for (const entity of batch) {
            try {
              const result = await checkCacStatus(
                entity.rcNumber,
                entity.entityType,
              );

              // ✅ FIXED: capture previousStatus BEFORE any mutation
              const previousStatus = entity.cacPortalStatus?.portalStatus;
              const newStatus = result.success ? result.status : previousStatus;
              const statusChanged =
                result.success && newStatus && newStatus !== previousStatus;

              // Build the update object
              const updateData = {
                "cacPortalStatus.lastChecked": new Date(),
                "cacPortalStatus.watchdogNotes": result.error || undefined,
              };

              if (result.success) {
                updateData["cacPortalStatus.portalStatus"] = newStatus;
              }

              if (statusChanged) {
                console.log(
                  `Status change: ${entity.entityName} — ${previousStatus} → ${newStatus}`,
                );

                const badStatuses = ["INACTIVE", "STRUCK-OFF", "WOUND-UP", "DISSOLVED", "SUSPENDED"];
                const goodStatuses = ["ACTIVE", "REGISTERED", "COMPLIANT"];

                const isBadStatus = badStatuses.includes(newStatus);
                const isGoodStatus = goodStatuses.includes(newStatus);

                updateData["cacPortalStatus.previousPortalStatus"] = previousStatus;
                updateData["cacPortalStatus.statusChangedAt"] = new Date();
                updateData["cacPortalStatus.requiresAttention"] = isBadStatus;

                if (isBadStatus) {
                  updateData.isRevenueOpportunity = true;
                  updateData.revenueOpportunityNote = `CAC status changed to ${newStatus} — urgent client contact needed`;
                  updateData.revenueOpportunityAmount = 50000;

                  const firm = await Firm.findById(entity.firmId);
                  entity.cacPortalStatus = {
                    ...entity.cacPortalStatus,
                    portalStatus: newStatus,
                  };

                  await sendUrgentAlert(entity, previousStatus, newStatus, firm);
                  await notifyFirmAdmins(entity, firm);
                } else if (isGoodStatus) {
                  updateData.isRevenueOpportunity = false;
                  updateData.revenueOpportunityNote = undefined;
                }

                statusChanges++;
              }

              if (!statusChanged && ["ACTIVE", "REGISTERED", "COMPLIANT"].includes(newStatus)) {
                updateData["cacPortalStatus.requiresAttention"] = false;
              }

              // ✅ Use findByIdAndUpdate instead of entity.save()
              // to avoid race conditions with other processes
              await ComplianceTracker.findByIdAndUpdate(
                entity._id,
                { $set: updateData },
                { runValidators: false },
              );
            } catch (error) {
              errors++;
              console.error(
                `Error checking entity ${entity.entityName} (${entity.rcNumber}):`,
                error.message,
              );
              // ✅ Never crash the loop — continue to next entity
            }

            // ✅ 3-second delay between checks to respect CAC portal
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
          }

          console.log(
            `Processed ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length} entities`,
          );
        }

        console.log(
          `[CRON] Watchdog complete: ${entities.length} checked, ` +
            `${statusChanges} changes, ${errors} errors`,
        );
      } catch (error) {
        console.error("[CRON] Fatal error in monthly CAC status check:", error);
      }
    },
    { timezone: "Africa/Lagos" },
  );

  // ── JOB 2: Weekly Status Report to Admins (Monday 7:30 AM) ───────────────
  cron.schedule(
    "30 7 * * 1",
    async () => {
      console.log("[CRON] Running weekly watchdog status report...");

      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // ✅ FIXED: get all active firms and query per-firm stats
        const firms = await Firm.find({ isActive: true });

        for (const firm of firms) {
          try {
            // ✅ FIXED: all queries scoped to this firm's ID
            const [
              totalMonitored,
              statusChangesThisMonth,
              alertsRequiringAttention,
              firmEntities,
            ] = await Promise.all([
              ComplianceTracker.countDocuments({
                firmId: firm._id,
                rcNumber: { $exists: true, $ne: null, $ne: "" },
                isDeleted: { $ne: true },
              }),
              ComplianceTracker.countDocuments({
                firmId: firm._id,
                "cacPortalStatus.statusChangedAt": { $gte: startOfMonth },
                isDeleted: { $ne: true },
              }),
              ComplianceTracker.countDocuments({
                firmId: firm._id,
                "cacPortalStatus.requiresAttention": true,
                isDeleted: { $ne: true },
              }),
              ComplianceTracker.find({
                firmId: firm._id,
                "cacPortalStatus.requiresAttention": true,
                isDeleted: { $ne: true },
              })
                .select("entityName rcNumber cacPortalStatus")
                .limit(10)
                .lean(),
            ]);

            // Skip firms with nothing to report
            if (totalMonitored === 0) continue;

            const admins = await User.find({
              firmId: firm._id,
              role: { $in: ["admin", "super-admin"] },
              isActive: true,
              isDeleted: { $ne: true },
            }).select("email firstName");

            for (const admin of admins) {
              if (!admin.email) continue;

              try {
                await sendCustomEmail(
                  `Weekly CAC Watchdog Report — ${firm.name}`,
                  admin.email,
                  process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
                  null,
                  `
                    <div style="font-family: Arial, sans-serif; max-width: 600px;">
                      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                           padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Weekly CAC Watchdog Report</h1>
                        <p style="color: #bfdbfe; margin: 8px 0 0;">${formatDate(new Date())}</p>
                      </div>
                      <div style="background: #f9fafb; padding: 30px;
                           border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #1f2937;">${firm.name} — Summary</h3>

                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                          <tr>
                            <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;
                                 border-radius: 8px; text-align: center; width: 33%;">
                              <p style="font-size: 28px; font-weight: bold; color: #3b82f6; margin: 0;">
                                ${totalMonitored}
                              </p>
                              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">
                                ENTITIES MONITORED
                              </p>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;
                                 border-radius: 8px; text-align: center; width: 33%;">
                              <p style="font-size: 28px; font-weight: bold; color: #f59e0b; margin: 0;">
                                ${statusChangesThisMonth}
                              </p>
                              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">
                                STATUS CHANGES THIS MONTH
                              </p>
                            </td>
                            <td style="width: 2%;"></td>
                            <td style="padding: 12px; background: white; border: 1px solid #e5e7eb;
                                 border-radius: 8px; text-align: center; width: 33%;">
                              <p style="font-size: 28px; font-weight: bold; color: #dc2626; margin: 0;">
                                ${alertsRequiringAttention}
                              </p>
                              <p style="color: #6b7280; margin: 4px 0 0; font-size: 12px;">
                                REQUIRE ATTENTION
                              </p>
                            </td>
                          </tr>
                        </table>

                        ${
                          firmEntities.length > 0
                            ? `
                          <div style="background: #fef2f2; border: 1px solid #fecaca;
                               border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h4 style="color: #dc2626; margin: 0 0 12px;">
                              Entities Requiring Attention (${alertsRequiringAttention})
                            </h4>
                            <ul style="padding-left: 20px; margin: 0; color: #374151;">
                              ${firmEntities
                                .map(
                                  (e) => `
                                <li style="padding: 4px 0;">
                                  <strong>${e.entityName}</strong> (${e.rcNumber})
                                  — <span style="color: #dc2626;">${e.cacPortalStatus.portalStatus}</span>
                                </li>
                              `,
                                )
                                .join("")}
                              ${alertsRequiringAttention > 10 ? `<li>...and ${alertsRequiringAttention - 10} more</li>` : ""}
                            </ul>
                          </div>
                        `
                            : `
                          <div style="background: #ecfdf5; border: 1px solid #a7f3d0;
                               border-radius: 8px; padding: 20px; text-align: center;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">
                              ✅ All entities are in good standing. No alerts this week.
                            </p>
                          </div>
                        `
                        }

                        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;
                             border-top: 1px solid #e5e7eb; padding-top: 16px;">
                          Generated by LawMaster CAC Watchdog •
                          ${formatDate(new Date())}
                        </p>
                      </div>
                    </div>
                  `,
                );
              } catch (emailError) {
                console.error(
                  `Failed to send weekly report to ${admin.email}:`,
                  emailError.message,
                );
              }
            }
          } catch (firmError) {
            console.error(
              `Error processing weekly report for firm ${firm._id}:`,
              firmError.message,
            );
            // ✅ Never crash — continue to next firm
          }
        }

        console.log("[CRON] Weekly watchdog report complete");
      } catch (error) {
        console.error("[CRON] Fatal error in weekly watchdog report:", error);
      }
    },
    { timezone: "Africa/Lagos" },
  );

  console.log("✅ Watchdog Cron Jobs initialized successfully");
};

module.exports = { initWatchdogCronJobs };
