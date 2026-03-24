const cron = require('node-cron');
const { ClientCompany, ComplianceCheck, Alert, User } = require('../models/cacCompliance');
const cacComplianceEngine = require('./cacComplianceEngine');
const complianceRules = require('../config/complianceRules');

let isRunning = false;

const runDailyAudit = async () => {
  if (isRunning) {
    console.log('CAC Compliance: Previous audit still running, skipping...');
    return;
  }

  isRunning = true;
  console.log('CAC Compliance: Starting daily audit at', new Date().toISOString());

  try {
    const companies = await ClientCompany.find({ isActive: true });

    for (const company of companies) {
      try {
        await cacComplianceEngine.runFullAudit(company);
      } catch (error) {
        console.error(`CAC Compliance: Error auditing company ${company._id}:`, error.message);
      }
    }

    console.log(`CAC Compliance: Daily audit completed for ${companies.length} companies`);
  } catch (error) {
    console.error('CAC Compliance: Error in daily audit:', error);
  } finally {
    isRunning = false;
  }
};

const generateAlerts = async () => {
  console.log('CAC Compliance: Generating alerts at', new Date().toISOString());

  try {
    const checks = await ComplianceCheck.find({
      status: { $in: ['due_soon', 'overdue', 'violation'] }
    }).populate('companyId', 'name lawFirmId assignedTo');

    const firmUsers = await User.find({
      firmId: { $in: [...new Set(checks.map(c => c.companyId?.lawFirmId).filter(Boolean))] },
      userType: { $in: ['staff', 'lawyer'] },
      isActive: true
    });

    const usersByFirm = {};
    firmUsers.forEach(u => {
      if (!usersByFirm[u.firmId]) {
        usersByFirm[u.firmId] = [];
      }
      usersByFirm[u.firmId].push(u._id);
    });

    for (const check of checks) {
      if (!check.companyId || !check.companyId.lawFirmId) continue;

      const firmId = check.companyId.lawFirmId;
      const users = usersByFirm[firmId] || [];
      const assignedUser = check.companyId.assignedTo;

      let alertType = null;
      let message = '';

      if (check.status === 'violation') {
        alertType = 'violation_detected';
        message = `${check.companyId.name} has a ${check.checkTypeLabel} violation. Estimated penalty: ₦${(check.estimatedPenalty?.totalLiability || 0).toLocaleString()}`;
      } else if (check.status === 'overdue') {
        alertType = 'violation_detected';
        message = `${check.companyId.name}: ${check.checkTypeLabel} is ${check.daysOverdue} days overdue.`;
      } else if (check.dueDate) {
        const daysUntil = cacComplianceEngine.getDaysUntil(check.dueDate);
        
        if (daysUntil <= 7 && daysUntil >= 0) {
          alertType = 'deadline_7_days';
          message = `${check.companyId.name}: ${check.checkTypeLabel} due in ${daysUntil} day(s).`;
        } else if (daysUntil <= 30 && daysUntil > 7) {
          alertType = 'deadline_30_days';
          message = `${check.companyId.name}: ${check.checkTypeLabel} due in ${daysUntil} day(s).`;
        } else if (daysUntil <= 60 && daysUntil > 30) {
          alertType = 'deadline_60_days';
          message = `${check.companyId.name}: ${check.checkTypeLabel} due in ${daysUntil} day(s).`;
        }
      }

      if (alertType) {
        for (const userId of users) {
          const existingAlert = await Alert.findOne({
            recipientId: userId,
            companyId: check.companyId._id,
            checkType: check.checkType,
            alertType,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          });

          if (!existingAlert) {
            await Alert.create({
              lawFirmId: firmId,
              companyId: check.companyId._id,
              recipientId: userId,
              alertType,
              checkType: check.checkType,
              message,
              dueDate: check.dueDate
            });
          }
        }
      }
    }

    console.log('CAC Compliance: Alerts generated');
  } catch (error) {
    console.error('CAC Compliance: Error generating alerts:', error);
  }
};

const start = () => {
  console.log('CAC Compliance Scheduler: Starting...');

  cron.schedule('0 7 * * *', () => {
    runDailyAudit();
  }, {
    timezone: 'Africa/Lagos'
  });

  cron.schedule('30 7 * * *', () => {
    generateAlerts();
  }, {
    timezone: 'Africa/Lagos'
  });

  console.log('CAC Compliance Scheduler: Scheduled daily at 7:00 AM WAT');
};

const runNow = async () => {
  await runDailyAudit();
  await generateAlerts();
};

module.exports = {
  start,
  runNow,
  runDailyAudit,
  generateAlerts
};
