const AUTOMATION_RECIPES = [
  {
    key: "new-client-welcome",
    name: "New Client Welcome Email",
    description: "Automatically send a welcome email when a new client is added to the system",
    icon: "UserAddOutlined",
    category: "client",
    trigger: { event: "client.created" },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "client",
          emailSubject: "Welcome to {{firm_name}}",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to {{firm_name}}!</h1>
              </div>
              <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear {{client_name}},</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Welcome to our legal practice! We're delighted to have you as our client.</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your legal matters are in capable hands. Our team is committed to providing you with the highest quality legal services.</p>
                <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">What happens next?</p>
                  <ul style="color: #374151; padding-left: 20px; margin: 10px 0 0;">
                    <li>You'll receive a confirmation email shortly</li>
                    <li>Your assigned lawyer will contact you within 24-48 hours</li>
                    <li>All your documents will be securely stored in your client portal</li>
                  </ul>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>{{firm_name}} Team</strong></p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
  {
    key: "cac-completion-document-ready",
    name: "CAC Completion Document Ready",
    description: "Notify client when CAC registration is complete and document is ready",
    icon: "CheckCircleOutlined",
    category: "cac",
    trigger: { event: "cac.status_changed", config: { toStatus: "completed" } },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "client",
          emailSubject: "Great News! Your {{entity_name}} Registration is Complete",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Registration Complete!</h1>
              </div>
              <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Dear {{client_name}},</p>
                <p style="color: #374151; font-size: 16px;">We are pleased to inform you that your <strong>{{entity_name}}</strong> registration with RC Number <strong>{{rc_number}}</strong> has been successfully completed!</p>
                <div style="background: #dcfce7; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #166534; margin: 0; font-size: 18px; font-weight: bold;">Your certificate is ready for download</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Log in to your client portal to download your certificate and other documents.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>{{firm_name}} Team</strong></p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
  {
    key: "annual-returns-60-day-reminder",
    name: "Annual Returns 60-Day Client Reminder",
    description: "Email client 60 days before annual returns deadline",
    icon: "CalendarOutlined",
    category: "compliance",
    trigger: { event: "compliance.filing_due", config: { daysBefore: 60 } },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "client",
          emailSubject: "Action Required: {{entity_name}} Annual Returns Due Soon",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Annual Returns Reminder</h1>
              </div>
              <div style="background: #fffbeb; padding: 40px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Dear {{client_name}},</p>
                <p style="color: #374151; font-size: 16px;">This is a friendly reminder that the annual returns for <strong>{{entity_name}}</strong> (RC: {{rc_number}}) are due within 60 days.</p>
                <p style="color: #374151; font-size: 16px;">Please contact our office to schedule the filing and ensure your business remains in good standing with CAC.</p>
                <p style="color: #dc2626; font-size: 14px; margin-top: 20px;">Note: Late filing attracts penalties of ₦5,000 - ₦10,000 per month.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>{{firm_name}} Team</strong></p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
  {
    key: "deadline-missed-supervisor-alert",
    name: "Alert Supervisor on Missed Deadline",
    description: "Automatically alert the partner when any deadline is missed",
    icon: "WarningOutlined",
    category: "deadline",
    trigger: { event: "deadline.missed" },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "supervisor",
          emailSubject: "ALERT: Deadline Missed - {{deadline_title}}",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Deadline Missed Alert</h1>
              </div>
              <div style="background: #fef2f2; padding: 40px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Dear Supervisor,</p>
                <div style="background: white; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Deadline:</strong> {{deadline_title}}</p>
                  <p style="margin: 10px 0 0;"><strong>Due Date:</strong> {{due_date}}</p>
                  <p style="margin: 10px 0 0;"><strong>Days Late:</strong> {{days_late}}</p>
                </div>
                <p style="color: #374151; font-size: 16px;">Please review and take appropriate action.</p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
  {
    key: "inactive-cac-client-alert",
    name: "Alert on CAC Inactive Status",
    description: "Send urgent email when client company goes inactive on CAC",
    icon: "AlertOutlined",
    category: "watchdog",
    trigger: { event: "compliance.status_inactive" },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "assigned_lawyer",
          emailSubject: "URGENT: {{entity_name}} Status Changed to INACTIVE",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">URGENT: CAC Status Change</h1>
              </div>
              <div style="background: #fef2f2; padding: 40px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Dear Lawyer,</p>
                <p style="color: #374151; font-size: 16px;"><strong>{{entity_name}}</strong> (RC: {{rc_number}}) has been marked as <strong>INACTIVE</strong> on the CAC portal.</p>
                <div style="background: white; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #dc2626; margin: 0; font-weight: bold;">This is a revenue opportunity!</p>
                  <p style="margin: 10px 0 0;">Contact the client immediately to discuss status restoration.</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Best regards,<br><strong>{{firm_name}} Watchdog</strong></p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
  {
    key: "payment-confirmed-document-ready",
    name: "Release Document on Payment",
    description: "Notify client that original document is available after payment confirmed",
    icon: "UnlockOutlined",
    category: "payment",
    trigger: { event: "payment.confirmed" },
    conditions: [],
    actions: [
      {
        order: 1,
        type: "send_email",
        config: {
          emailTo: "client",
          emailSubject: "Payment Confirmed - Your Document is Ready",
          emailBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
              </div>
              <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px;">
                <p style="color: #374151; font-size: 16px;">Dear {{client_name}},</p>
                <p style="color: #374151; font-size: 16px;">Thank you for your payment of <strong>₦{{payment_amount}}</strong>.</p>
                <div style="background: #dcfce7; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #166534; margin: 0; font-size: 16px; font-weight: bold;">Your original document is now available for download!</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Log in to your client portal to access your documents.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Best regards,<br><strong>{{firm_name}} Team</strong></p>
              </div>
            </div>
          `,
        },
        delayMinutes: 0,
      },
    ],
  },
];

module.exports = { AUTOMATION_RECIPES };
