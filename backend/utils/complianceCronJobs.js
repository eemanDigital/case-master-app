const cron = require("node-cron");
const ComplianceTracker = require("../models/complianceTrackerModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const { sendCustomEmail } = require("../utils/email");

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return `₦${parseFloat(amount).toLocaleString()}`;
};

const sendComplianceEmail = async (entity, subject, html) => {
  const client = await User.findById(entity.clientId);

  if (!client || !client.email) {
    console.log(`No email found for client ${entity.clientId}`);
    return false;
  }

  try {
    await sendCustomEmail(
      subject,
      client.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      html
    );
    return true;
  } catch (error) {
    console.error(`Failed to send email for entity ${entity._id}:`, error);
    return false;
  }
};

const sendLawyerEmail = async (entity, subject, html) => {
  const assignedLawyer = await User.findById(entity.assignedTo);

  if (!assignedLawyer || !assignedLawyer.email) {
    return false;
  }

  try {
    await sendCustomEmail(
      subject,
      assignedLawyer.email,
      process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
      null,
      html
    );
    return true;
  } catch (error) {
    console.error(`Failed to send email to lawyer ${assignedLawyer._id}:`, error);
    return false;
  }
};

const initComplianceCronJobs = () => {
  console.log("Initializing Compliance Cron Jobs...");

  cron.schedule("0 6 * * *", async () => {
    console.log("[CRON] Running daily penalty recalculation...");

    try {
      const entitiesWithPenalty = await ComplianceTracker.find({
        "penaltyTracking.isPenaltyAccruing": true,
        isDeleted: { $ne: true },
      });

      console.log(`Found ${entitiesWithPenalty.length} entities with accruing penalties`);

      for (const entity of entitiesWithPenalty) {
        const currentPenalty = entity.calculateCurrentPenalty();

        entity.penaltyTracking.currentPenaltyAmount = currentPenalty;
        entity.penaltyTracking.lastCalculatedAt = new Date();

        if (currentPenalty >= 50000 && !entity.isRevenueOpportunity) {
          entity.isRevenueOpportunity = true;
          entity.revenueOpportunityNote = `Penalty has exceeded ₦50,000 threshold - revenue opportunity`;
          entity.revenueOpportunityAmount = Math.ceil(currentPenalty * 0.2) + 25000;
        }

        await entity.save();
      }

      console.log(`Penalty recalculation complete for ${entitiesWithPenalty.length} entities`);
    } catch (error) {
      console.error("[CRON] Error in penalty recalculation:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Running 60-day filing reminder job...");

    try {
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const atRiskEntities = await ComplianceTracker.find({
        firmId: { $exists: true },
        nextFilingDueDate: {
          $lte: sixtyDaysFromNow,
          $gt: new Date(),
        },
        currentComplianceStatus: { $ne: "non-compliant" },
        isDeleted: { $ne: true },
      }).populate("clientId", "firstName lastName email");

      console.log(`Found ${atRiskEntities.length} entities at risk`);

      for (const entity of atRiskEntities) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentReminder = entity.notificationsSent?.find(
          (n) => n.type === "filing-reminder" && n.sentAt > thirtyDaysAgo
        );

        if (recentReminder) {
          continue;
        }

        entity.currentComplianceStatus = "at-risk";

        const client = await User.findById(entity.clientId);
        const penaltyCalc = entity.calculateCurrentPenalty();

        const success = await sendComplianceEmail(
          entity,
          `Action Required: ${entity.entityName} Annual Returns Due ${formatDate(entity.nextFilingDueDate)}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Annual Returns Filing Reminder</h1>
              </div>
              <div style="background: #fffbeb; padding: 30px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px;">Dear ${client?.firstName || "Valued Client"},</p>
                <p style="color: #374151; font-size: 16px;">This is an important reminder that the annual returns for your business are due soon.</p>

                <div style="background: white; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Entity Name:</strong> ${entity.entityName}</p>
                  <p style="margin: 10px 0 0;"><strong>RC/BN Number:</strong> ${entity.rcNumber}</p>
                  <p style="margin: 10px 0 0;"><strong>Entity Type:</strong> ${entity.entityType}</p>
                  <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #dc2626;"><strong>Due Date:</strong> ${formatDate(entity.nextFilingDueDate)}</p>
                </div>

                ${penaltyCalc > 0 ? `
                  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px;">
                    <p style="color: #dc2626; margin: 0;"><strong>⚠️ Important:</strong> Your annual returns are now late.</p>
                    <p style="color: #dc2626; margin: 10px 0 0;">Current penalty accrued: <strong>${formatCurrency(penaltyCalc)}</strong></p>
                    <p style="color: #991b1b; margin: 5px 0 0; font-size: 14px;">Penalty increases by ${formatCurrency(entity.penaltyTracking.monthlyPenaltyRate)} monthly</p>
                  </div>
                ` : ""}

                <p style="color: #374151; font-size: 16px; margin-top: 20px;">Please contact our office immediately to schedule the filing of your annual returns.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated reminder from LawMaster.</p>
              </div>
            </div>
          `
        );

        if (success) {
          entity.notificationsSent.push({
            type: "filing-reminder",
            sentAt: new Date(),
            sentTo: client?.email,
            channel: "email",
            wasOpened: false,
          });
        }

        await entity.save();
      }
    } catch (error) {
      console.error("[CRON] Error in 60-day reminder job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 10 * * *", async () => {
    console.log("[CRON] Running overdue detection and penalty start job...");

    try {
      const now = new Date();

      const overdueEntities = await ComplianceTracker.find({
        nextFilingDueDate: { $lt: now },
        isDeleted: { $ne: true },
      }).populate("clientId", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email");

      console.log(`Found ${overdueEntities.length} overdue entities`);

      for (const entity of overdueEntities) {
        const annualReturn = entity.annualReturns?.find(
          (ar) => ar.status === "pending"
        );

        if (annualReturn) {
          annualReturn.status = "overdue";
        }

        entity.currentComplianceStatus = "non-compliant";
        entity.penaltyTracking.isPenaltyAccruing = true;
        entity.penaltyTracking.penaltyStartDate = entity.nextFilingDueDate;

        const penaltyRate = ComplianceTracker.getPenaltyRate(entity.entityType);
        entity.penaltyTracking.monthlyPenaltyRate = penaltyRate;

        await entity.save();

        const client = await User.findById(entity.clientId);
        const penaltyCalc = entity.calculateCurrentPenalty();

        const success = await sendComplianceEmail(
          entity,
          `Urgent: Late Filing Penalty Now Accruing for ${entity.entityName}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Late Filing Penalty Warning</h1>
              </div>
              <div style="background: #fef2f2; padding: 30px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px;">Dear ${client?.firstName || "Valued Client"},</p>

                <div style="background: white; border: 3px solid #dc2626; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">CURRENT ACCRUED PENALTY</p>
                  <p style="color: #dc2626; font-size: 42px; font-weight: bold; margin: 10px 0;">${formatCurrency(penaltyCalc)}</p>
                  <p style="color: #991b1b; margin: 0;">+ ${formatCurrency(penaltyRate)} per month</p>
                </div>

                <p style="color: #374151; font-size: 16px;">Your annual returns for <strong>${entity.entityName}</strong> (${entity.rcNumber}) were due on <strong>${formatDate(entity.nextFilingDueDate)}</strong> and are now overdue.</p>

                <p style="color: #374151; font-size: 16px; margin-top: 20px;">The penalty will continue to accrue monthly until your returns are filed. Every day you wait costs you approximately <strong>${formatCurrency(penaltyRate / 30)}</strong>.</p>

                <p style="color: #374151; font-size: 16px; margin-top: 20px;"><strong>Recommended Action:</strong></p>
                <ol style="color: #374151; font-size: 14px;">
                  <li>Contact our office immediately</li>
                  <li>Provide any required documents</li>
                  <li>Arrange for payment of filing fee and any accrued penalty</li>
                </ol>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This is an automated message from LawMaster.</p>
              </div>
            </div>
          `
        );

        if (success) {
          entity.notificationsSent.push({
            type: "penalty-warning",
            sentAt: new Date(),
            sentTo: client?.email,
            channel: "email",
            wasOpened: false,
          });
        }

        if (entity.assignedTo) {
          await sendLawyerEmail(
            entity,
            `Client Penalty Started: ${entity.entityName}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2>Client Penalty Started</h2>
                <p>A client's annual returns have become overdue and a late filing penalty is now accruing.</p>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
                  <p><strong>Entity:</strong> ${entity.entityName}</p>
                  <p><strong>RC/BN:</strong> ${entity.rcNumber}</p>
                  <p><strong>Due Date:</strong> ${formatDate(entity.nextFilingDueDate)}</p>
                  <p><strong>Current Penalty:</strong> ${formatCurrency(penaltyCalc)}</p>
                </div>
                <p>Please reach out to the client to discuss filing options.</p>
              </div>
            `
          );
        }

        await entity.save();
      }
    } catch (error) {
      console.error("[CRON] Error in overdue detection job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 7 1 * *", async () => {
    console.log("[CRON] Running revenue opportunity email job...");

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const revenueOpportunities = await ComplianceTracker.find({
        isRevenueOpportunity: true,
        isDeleted: { $ne: true },
      }).populate("clientId", "firstName lastName email");

      console.log(`Found ${revenueOpportunities.length} revenue opportunities`);

      for (const entity of revenueOpportunities) {
        const recentEmail = entity.notificationsSent?.find(
          (n) => n.type === "revenue-opportunity" && n.sentAt > thirtyDaysAgo
        );

        if (recentEmail) {
          continue;
        }

        const client = await User.findById(entity.clientId);
        const penaltyCalc = entity.calculateCurrentPenalty();
        const monthlyRate = entity.penaltyTracking.monthlyPenaltyRate || 0;

        await sendComplianceEmail(
          entity,
          `Your Outstanding Penalty is Now ${formatCurrency(penaltyCalc)} - Act Now`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Don't Let Penalties Keep Growing</h1>
              </div>
              <div style="background: #f5f3ff; padding: 30px; border: 1px solid #ddd6fe; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #374151; font-size: 16px;">Dear ${client?.firstName || "Valued Client"},</p>

                <div style="background: white; border: 2px solid #7c3aed; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #6b7280; margin: 0;">YOUR OUTSTANDING PENALTY</p>
                  <p style="color: #7c3aed; font-size: 48px; font-weight: bold; margin: 10px 0;">${formatCurrency(penaltyCalc)}</p>
                  <p style="color: #5b21b6; margin: 0;">↑ ${formatCurrency(monthlyRate)} per month</p>
                </div>

                <p style="color: #374151; font-size: 16px;">Every day you wait costs you approximately <strong>${formatCurrency(monthlyRate / 30)}</strong> in additional penalties.</p>

                <div style="background: #dcfce7; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #166534; margin: 0; font-weight: bold;">Here's How We Can Help:</p>
                  <p style="color: #166534; margin: 10px 0 0;">Let us handle your annual returns filing for a fixed service fee of approximately <strong>${formatCurrency(entity.revenueOpportunityAmount || 25000)}</strong>.</p>
                  <p style="color: #166534; margin: 10px 0 0;">This includes preparing all documents and filing with CAC.</p>
                </div>

                <p style="color: #374151; font-size: 16px; margin-top: 20px;"><strong>Why Act Now?</strong></p>
                <ul style="color: #374151; font-size: 14px;">
                  <li>Stop the penalty from growing daily</li>
                  <li>Avoid potential CAC enforcement action</li>
                  <li>Restore your company's good standing</li>
                  <li>Peace of mind with professional handling</li>
                </ul>

                <p style="text-align: center; margin-top: 30px;">
                  <a href="#" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Contact Us Today</a>
                </p>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This offer is valid for a limited time. Don't let this opportunity pass.</p>
              </div>
            </div>
          `
        );

        entity.notificationsSent.push({
          type: "revenue-opportunity",
          sentAt: new Date(),
          sentTo: client?.email,
          channel: "email",
          wasOpened: false,
        });

        await entity.save();
      }
    } catch (error) {
      console.error("[CRON] Error in revenue opportunity job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  cron.schedule("0 8 * * 1", async () => {
    console.log("[CRON] Running weekly compliance digest to lawyers...");

    try {
      const lawyers = await User.find({
        role: "lawyer",
        isActive: true,
      }).select("_id firmId firstName lastName email");

      const firmIds = [...new Set(lawyers.map((l) => l.firmId.toString()))];

      for (const firm of firmIds) {
        const firmLawyers = lawyers.filter(
          (l) => l.firmId.toString() === firm
        );

        const [compliant, atRisk, nonCompliant] = await Promise.all([
          ComplianceTracker.countDocuments({
            firmId: firm,
            currentComplianceStatus: "compliant",
            isDeleted: { $ne: true },
          }),
          ComplianceTracker.countDocuments({
            firmId: firm,
            currentComplianceStatus: "at-risk",
            isDeleted: { $ne: true },
          }),
          ComplianceTracker.countDocuments({
            firmId: firm,
            currentComplianceStatus: "non-compliant",
            isDeleted: { $ne: true },
          }),
        ]);

        const firmData = await Firm.findById(firm);

        for (const lawyer of firmLawyers) {
          if (!lawyer.email) continue;

          await sendCustomEmail(
            `Weekly Compliance Digest - ${firmData?.name || "Your Firm"}`,
            lawyer.email,
            process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
            null,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">Weekly Compliance Digest</h1>
                  <p style="color: white; margin: 10px 0 0;">${new Date().toLocaleDateString("en-NG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p>Dear ${lawyer.firstName},</p>
                  <p>Here's your weekly compliance summary:</p>

                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
                    <div style="background: #dcfce7; padding: 20px; border-radius: 8px; text-align: center;">
                      <p style="color: #166534; font-size: 32px; font-weight: bold; margin: 0;">${compliant}</p>
                      <p style="color: #166534; margin: 5px 0 0; font-size: 12px;">COMPLIANT</p>
                    </div>
                    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                      <p style="color: #92400e; font-size: 32px; font-weight: bold; margin: 0;">${atRisk}</p>
                      <p style="color: #92400e; margin: 5px 0 0; font-size: 12px;">AT RISK</p>
                    </div>
                    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
                      <p style="color: #991b1b; font-size: 32px; font-weight: bold; margin: 0;">${nonCompliant}</p>
                      <p style="color: #991b1b; margin: 5px 0 0; font-size: 12px;">NON-COMPLIANT</p>
                    </div>
                  </div>

                  ${nonCompliant > 0 ? `
                    <p style="color: #dc2626; font-weight: bold;">Action Required: ${nonCompliant} client(s) need immediate attention.</p>
                  ` : ""}

                  <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Log in to LawMaster to view detailed compliance records and take action.</p>
                </div>
              </div>
            `
          );
        }
      }
    } catch (error) {
      console.error("[CRON] Error in weekly digest job:", error);
    }
  }, {
    timezone: "Africa/Lagos",
  });

  console.log("Compliance Cron Jobs initialized successfully");
};

module.exports = { initComplianceCronJobs };
