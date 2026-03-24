const cron = require('node-cron');
const ClientCompany = require('../models/ClientCompany');
const ComplianceCheck = require('../models/ComplianceCheck');
const Alert = require('../models/Alert');
const User = require('../models/userModel');
const { runFullAudit } = require('./complianceEngine');
const { sendCustomEmail } = require('../utils/email');

const generateAlertMessage = (alertType, company) => {
  const messages = {
    deadline_60_days: `Deadline approaching for ${company.name} (${company.rcNumber})`,
    deadline_30_days: `URGENT: 30-day deadline for ${company.name} (${company.rcNumber})`,
    deadline_7_days: `CRITICAL: 7-day deadline for ${company.name} (${company.rcNumber})`,
    violation_detected: `Compliance violation detected for ${company.name} (${company.rcNumber})`,
    risk_level_changed: `Risk level changed for ${company.name} (${company.rcNumber})`,
    psc_conflict: `PSC conflict for ${company.name} (${company.rcNumber})`,
    company_struck: `Company ${company.name} (${company.rcNumber}) has been struck off`
  };
  return messages[alertType] || 'Compliance alert';
};

const sendAlertEmail = async (user, company, alertType, message) => {
  if (!user.email) return;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0D2137; padding: 20px; color: white;">
        <h2>Compliance Alert</h2>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <p>Dear ${user.firstName},</p>
        <p>${message}</p>
        <p>Please log in to the system to take action.</p>
      </div>
    </div>
  `;
  
  try {
    await sendCustomEmail(
      `Compliance Alert: ${company.name}`,
      user.email,
      process.env.DEFAULT_FROM_EMAIL || 'noreply@lawmaster.com',
      null,
      html
    );
  } catch (error) {
    console.error('Failed to send alert email:', error.message);
  }
};

const dispatchDeadlineAlerts = async (auditResult) => {
  const company = auditResult.company;
  const checks = auditResult.checks;

  const upcomingChecks = checks.filter(c => c.status === 'due_soon' && c.dueDate);
  
  for (const check of upcomingChecks) {
    const daysUntilDue = Math.ceil((new Date(check.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    let alertType;
    
    if (daysUntilDue <= 7) alertType = 'deadline_7_days';
    else if (daysUntilDue <= 30) alertType = 'deadline_30_days';
    else if (daysUntilDue <= 60) alertType = 'deadline_60_days';
    else continue;

    const existingAlert = await Alert.findOne({
      companyId: company._id,
      checkType: check.checkType,
      alertType,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (existingAlert) continue;

    const alert = await Alert.create({
      lawFirmId: company.lawFirmId,
      companyId: company._id,
      recipientId: company.assignedTo,
      alertType,
      checkType: check.checkType,
      message: generateAlertMessage(alertType, company),
      dueDate: check.dueDate
    });

    const user = await User.findById(company.assignedTo);
    if (user) await sendAlertEmail(user, company, alertType, alert.message);
  }
};

const dispatchViolationAlerts = async (auditResult) => {
  const company = auditResult.company;
  const checks = auditResult.checks;

  const violations = checks.filter(c => c.status === 'violation' || c.status === 'overdue');
  
  for (const check of violations) {
    const alertType = check.status === 'violation' ? 'violation_detected' : 'violation_detected';
    
    const existingAlert = await Alert.findOne({
      companyId: company._id,
      checkType: check.checkType,
      alertType,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingAlert) continue;

    const alert = await Alert.create({
      lawFirmId: company.lawFirmId,
      companyId: company._id,
      recipientId: company.assignedTo,
      alertType,
      checkType: check.checkType,
      message: generateAlertMessage(alertType, company),
      dueDate: check.dueDate
    });

    const user = await User.findById(company.assignedTo);
    if (user) await sendAlertEmail(user, company, alertType, alert.message);
  }
};

const runComplianceAuditFn = async () => {
  console.log('[CRON] Running daily compliance audit...');
  
  try {
    const companies = await ClientCompany.find({ 
      isActive: true, 
      isStruck: false 
    }).populate('assignedTo');

    console.log(`[CRON] Auditing ${companies.length} companies...`);

    for (const company of companies) {
      const auditResult = await runFullAudit(company);
      await dispatchDeadlineAlerts(auditResult);
      await dispatchViolationAlerts(auditResult);
      
      console.log(`[CRON] Completed audit for ${company.name}: ${auditResult.riskLevel} risk, ₦${auditResult.totalLiability.toLocaleString()} liability`);
    }

    console.log('[CRON] Daily compliance audit complete');
  } catch (error) {
    console.error('[CRON] Error in compliance audit:', error.message);
  }
};

const initComplianceScheduler = () => {
  console.log('Initializing Compliance Scheduler...');

  cron.schedule('0 7 * * *', runComplianceAuditFn, { timezone: 'Africa/Lagos' });

  console.log('Compliance Scheduler initialized - runs daily at 7:00 AM WAT');
};

module.exports = { initComplianceScheduler, runComplianceAudit: runComplianceAuditFn, dispatchDeadlineAlerts, dispatchViolationAlerts };