const complianceRules = require('../config/complianceRules');

const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString('en-NG');
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getLawFirmInfo = (firmId) => {
  return {
    name: 'Your Law Firm',
    address: 'Legal Chambers, Lagos, Nigeria',
    email: 'info@lawfirm.com',
    phone: '+234 XXX XXX XXXX'
  };
};

const letterHead = (lawFirm) => `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px;">${lawFirm.name}</h1>
    <p style="margin: 5px 0;">${lawFirm.address}</p>
    <p style="margin: 5px 0;">Email: ${lawFirm.email} | Tel: ${lawFirm.phone}</p>
  </div>
`;

const letterFooter = `
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
    <p style="font-size: 10px; color: #666; font-style: italic;">
      This advisory is issued for compliance guidance purposes only. It does not constitute
      legal advice specific to your circumstances. Please contact the firm directly for full
      legal representation and guidance.
    </p>
  </div>
</div>
`;

/**
 * Annual Return Overdue Letter
 * Updated with new penalty structure (effective 31 Oct 2024)
 */
exports.annualReturnOverdue = (company, check, lawFirm, customNote) => {
  const firm = getLawFirmInfo(lawFirm);
  const today = formatDate(new Date());
  
  let obligation = '';
  if (!company.firstAnnualReturnFiled) {
    const firstDue = new Date(company.incorporationDate);
    firstDue.setMonth(firstDue.getMonth() + 18);
    obligation = `Your first annual return was due by ${formatDate(firstDue)}, being 18 months from your incorporation date of ${formatDate(company.incorporationDate)}.`;
  } else {
    obligation = `Your annual return was due by ${formatDate(check?.dueDate)}, being 42 days after your last Annual General Meeting.`;
  }

  const daysOverdue = check?.daysOverdue || 0;
  const filingFee = check?.estimatedPenalty?.filingFee || 0;
  const dailyPenalty = check?.estimatedPenalty?.dailyPenalty || 0;
  const oneOffPenalty = check?.estimatedPenalty?.oneOffPenalty || 0;
  const annualReturnPenalty = check?.estimatedPenalty?.annualReturnPenalty || 0;
  const totalLiability = check?.estimatedPenalty?.totalLiability || 0;
  const dailyRate = complianceRules.annualReturns.dailyPenaltyPerDay[company.type] || 100;
  const hasOfficers = check?.estimatedPenalty?.hasOfficerLiability || false;
  const officerCount = check?.estimatedPenalty?.officerCount || 0;

  // Share capital fee info for companies
  let shareCapitalInfo = '';
  if (company.shareCapital) {
    shareCapitalInfo = `<p><strong>Share Capital:</strong> ${formatCurrency(company.shareCapital)}</p>`;
  }

  return `
    ${letterHead(firm)}
    <p style="margin-top: 30px;"><strong>Date:</strong> ${today}</p>
    
    <p><strong>Re: ${company.name} (RC No: ${company.rcNumber})</strong></p>
    
    <p>Dear Sir/Madam,</p>
    
    <h3 style="margin-top: 20px;">1. OBLIGATION</h3>
    <p>
      Under Section 417(1) of CAMA 2020, every company is required to file its annual
      returns with the Corporate Affairs Commission. ${obligation}
    </p>
    
    <h3 style="margin-top: 20px;">2. CURRENT STATUS</h3>
    <p>As of today, <strong>${daysOverdue} days</strong> have elapsed since the filing deadline.</p>
    ${shareCapitalInfo}
    
    <h3 style="margin-top: 20px;">3. FILING FEE (EFFECTIVE 31 OCTOBER 2024)</h3>
    <p>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Base Filing Fee</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(company.type === 'business_name' ? 5000 : 10000)}</td>
        </tr>
        ${company.type !== 'business_name' ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Share Capital Fee</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(filingFee - 10000)}</td>
        </tr>
        ` : ''}
        <tr style="font-weight: bold; background: #f5f5f5;">
          <td style="padding: 8px; border: 1px solid #ddd;">Total Filing Fee</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(filingFee)}</td>
        </tr>
      </table>
    </p>
    
    <h3 style="margin-top: 20px;">4. PENALTY EXPOSURE</h3>
    <p>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Daily Default Penalty (${daysOverdue} days × ${formatCurrency(dailyRate)}/day)</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(dailyPenalty)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">One-Off Penalty</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(oneOffPenalty)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Annual Return Default Penalty (Section 417/421)</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(annualReturnPenalty)}</td>
        </tr>
        ${hasOfficers ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Per-Officer Penalty (${officerCount} officers × ${formatCurrency(annualReturnPenalty)})</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(annualReturnPenalty * officerCount)}</td>
        </tr>
        ` : ''}
        <tr style="font-weight: bold; background: #fff3cd;">
          <td style="padding: 8px; border: 1px solid #ddd;">TOTAL ESTIMATED LIABILITY</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c00;">${formatCurrency(totalLiability)}</td>
        </tr>
      </table>
    </p>
    
    <h3 style="margin-top: 20px;">5. IMPORTANT NOTICE</h3>
    <p>
      Please note that daily default penalties are accruing at ${formatCurrency(dailyRate)} per day.
      ${hasOfficers ? `Each director/officer is individually liable for penalties.` : ''}
      CAC now operates an automated enforcement system. Companies with 10 or more
      consecutive years of non-filing are liable to be struck off the register under
      Section 692, CAMA 2020.
    </p>
    
    <h3 style="margin-top: 20px;">6. RECOMMENDED ACTION</h3>
    <p>
      We strongly advise that you instruct us to file all outstanding annual returns
      immediately. Please contact our office within 5 working days.
    </p>
    
    ${customNote ? `<p><strong>Additional Note:</strong> ${customNote}</p>` : ''}
    
    <p style="margin-top: 40px;">Yours faithfully,</p>
    <p><strong>[Authorized Signatory]</strong></p>
    <p>${firm.name}</p>
    ${letterFooter}
  `;
};

/**
 * PSC Violation Letter
 */
exports.pscViolation = (company, check, lawFirm, customNote) => {
  const firm = getLawFirmInfo(lawFirm);
  const today = formatDate(new Date());
  
  const pscDue = new Date(company.incorporationDate);
  pscDue.setDate(pscDue.getDate() + 30);

  const violation = company.pscFiled && company.pscHasConflict 
    ? `CAC has flagged a conflict in your PSC information as at ${formatDate(company.pscFiledDate)}.`
    : `PSC particulars have not been filed. The filing deadline was ${formatDate(pscDue)}.`;

  const daysOverdue = check?.daysOverdue || 0;
  const totalLiability = check?.estimatedPenalty?.totalLiability || 0;
  const consequences = complianceRules.psc.consequences;

  return `
    ${letterHead(firm)}
    <p style="margin-top: 30px;"><strong>Date:</strong> ${today}</p>
    
    <p><strong>Re: ${company.name} (RC No: ${company.rcNumber})</strong></p>
    
    <p>Dear Sir/Madam,</p>
    
    <p style="color: #c00; font-weight: bold; font-size: 18px;">
      THIS NOTICE REQUIRES YOUR IMMEDIATE ATTENTION.
    </p>
    
    <h3 style="margin-top: 20px;">1. OBLIGATION</h3>
    <p>
      Under Sections 119 and 791 of CAMA 2020 and the PSC Regulations 2022, every
      company must file particulars of its People with Significant Control (persons
      holding 5% or more of shares, voting rights, or the ability to appoint or remove
      directors) within 30 days of incorporation.
    </p>
    
    <h3 style="margin-top: 20px;">2. VIOLATION</h3>
    <p>${violation}</p>
    
    <h3 style="margin-top: 20px;">3. CONSEQUENCES CURRENTLY IN EFFECT</h3>
    <ul>
      ${consequences.map(c => `<li>${c}</li>`).join('')}
    </ul>
    
    <h3 style="margin-top: 20px;">4. PENALTY EXPOSURE</h3>
    <p>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Daily penalty per party</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(complianceRules.psc.dailyPenaltyPerOfficer)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Number of parties</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${check?.estimatedPenalty?.officerCount || 1}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Days overdue</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${daysOverdue}</td>
        </tr>
        <tr style="font-weight: bold; background: #fff3cd;">
          <td style="padding: 8px; border: 1px solid #ddd;">Estimated total liability</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c00;">${formatCurrency(totalLiability)}</td>
        </tr>
      </table>
    </p>
    
    ${customNote ? `<p><strong>Additional Note:</strong> ${customNote}</p>` : ''}
    
    <p style="margin-top: 40px;">
      This is a critical matter. Please contact us <strong>immediately</strong>.
    </p>
    
    <p style="margin-top: 40px;">Yours faithfully,</p>
    <p><strong>[Authorized Signatory]</strong></p>
    <p>${firm.name}</p>
    ${letterFooter}
  `;
};

/**
 * AGM Non-Compliance Letter
 */
exports.agmNonCompliance = (company, check, lawFirm, customNote) => {
  const firm = getLawFirmInfo(lawFirm);
  const today = formatDate(new Date());
  
  const dueDate = check?.dueDate;
  const isOverdue = check?.status === 'overdue';
  const statusText = isOverdue ? 'has passed' : 'is approaching';

  return `
    ${letterHead(firm)}
    <p style="margin-top: 30px;"><strong>Date:</strong> ${today}</p>
    
    <p><strong>Re: ${company.name} (RC No: ${company.rcNumber})</strong></p>
    
    <p>Dear Sir/Madam,</p>
    
    <h3 style="margin-top: 20px;">1. OBLIGATION</h3>
    <p>
      Under Section 371 of CAMA 2020, your company is required to hold an Annual
      General Meeting within 18 months of incorporation (for first AGM) or within
      15 months of your last AGM.
    </p>
    
    <h3 style="margin-top: 20px;">2. CURRENT STATUS</h3>
    <p>
      The AGM deadline of ${formatDate(dueDate)} ${statusText}.
    </p>
    
    <h3 style="margin-top: 20px;">3. IMPORTANT NOTE</h3>
    <p>
      Failure to hold your AGM also affects your annual return filing deadline under
      Section 421, CAMA 2020, as the annual return is due 42 days after the AGM.
    </p>
    
    <h3 style="margin-top: 20px;">4. RECOMMENDED ACTION</h3>
    <p>
      Please instruct us to assist with scheduling and documenting your AGM.
    </p>
    
    ${customNote ? `<p><strong>Additional Note:</strong> ${customNote}</p>` : ''}
    
    <p style="margin-top: 40px;">Yours faithfully,</p>
    <p><strong>[Authorized Signatory]</strong></p>
    <p>${firm.name}</p>
    ${letterFooter}
  `;
};

/**
 * General Non-Compliance Letter
 */
exports.generalNonCompliance = (company, checks, lawFirm, customNote) => {
  const firm = getLawFirmInfo(lawFirm);
  const today = formatDate(new Date());
  
  const totalLiability = checks.reduce((sum, c) => {
    return sum + (c.estimatedPenalty?.totalLiability || 0);
  }, 0);

  let tableRows = '';
  checks.forEach(check => {
    if (check.status !== 'compliant' && check.status !== 'not_applicable') {
      const checkTypeLabel = check.checkType === 'annual_return' ? 'Annual Return' :
                             check.checkType === 'psc_filing' ? 'PSC Filing' :
                             check.checkType === 'agm' ? 'AGM' : check.checkType;
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${checkTypeLabel}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${check.legalBasis}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(check.estimatedPenalty?.totalLiability || 0)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${(check.status || '').replace('_', ' ').toUpperCase()}</td>
        </tr>
      `;
    }
  });

  return `
    ${letterHead(firm)}
    <p style="margin-top: 30px;"><strong>Date:</strong> ${today}</p>
    
    <p><strong>Re: ${company.name} (RC No: ${company.rcNumber})</strong></p>
    
    <p>Dear Sir/Madam,</p>
    
    <h3 style="margin-top: 20px;">1. COMPLIANCE REVIEW</h3>
    <p>
      Our compliance review of your entity has identified the following outstanding
      obligations:
    </p>
    
    ${tableRows ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Violation</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Legal Basis</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Est. Penalty</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    ` : '<p>No outstanding violations identified.</p>'}
    
    <p style="margin-top: 20px;">
      <strong>Total estimated penalty exposure: ${formatCurrency(totalLiability)}</strong>
    </p>
    
    ${customNote ? `<p style="margin-top: 20px;"><strong>Additional Note:</strong> ${customNote}</p>` : ''}
    
    <p style="margin-top: 40px;">Yours faithfully,</p>
    <p><strong>[Authorized Signatory]</strong></p>
    <p>${firm.name}</p>
    ${letterFooter}
  `;
};
