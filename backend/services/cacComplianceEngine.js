const complianceRules = require('../config/complianceRules');
const { ComplianceCheck, ClientCompany } = require('../models/cacCompliance');

function getOfficerCount(company) {
  return 1 + company.numDirectors + (company.hasCompanySecretary ? 1 : 0);
}

function getDaysOverdue(dueDate) {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = now - due;
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDaysUntil(dueDate) {
  if (!dueDate) return 999;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDailyPenaltyDays(dueDate) {
  const effectiveDate = complianceRules.annualReturns.dailyPenaltyEffectiveDate;
  const now = new Date();
  
  const due = new Date(dueDate);
  const startDate = due > effectiveDate ? due : effectiveDate;
  
  if (now <= startDate) return 0;
  
  const diff = now - startDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount) {
  return '₦' + amount.toLocaleString('en-NG');
}

function checkAnnualReturns(company) {
  const result = {
    checkType: 'annual_return',
    status: 'compliant',
    dueDate: null,
    daysOverdue: 0,
    estimatedPenalty: {
      companyLiability: 0,
      perDirectorLiability: 0,
      secretaryLiability: 0,
      totalLiability: 0,
      officerCount: getOfficerCount(company),
      calculationBreakdown: ''
    },
    legalBasis: complianceRules.annualReturns.legalBasis,
    advisoryNote: '',
    recommendedAction: ''
  };

  let dueDate;
  
  if (!company.firstAnnualReturnFiled) {
    dueDate = new Date(company.incorporationDate);
    dueDate.setMonth(dueDate.getMonth() + complianceRules.annualReturns.firstReturnMonthsFromIncorporation);
  } else {
    const companyType = company.type;
    const isExempt = complianceRules.agm.exemptTypes.includes(companyType);
    
    if (!isExempt && company.lastAGMDate) {
      dueDate = new Date(company.lastAGMDate);
      dueDate.setDate(dueDate.getDate() + complianceRules.annualReturns.subsequentReturnDaysAfterAGM);
    } else if (company.lastAnnualReturnDate) {
      dueDate = new Date(company.lastAnnualReturnDate);
      const currentYear = new Date().getFullYear();
      dueDate.setFullYear(currentYear);
      if (dueDate < new Date()) {
        dueDate.setFullYear(currentYear + 1);
      }
    } else {
      dueDate = new Date(company.incorporationDate);
      dueDate.setMonth(dueDate.getMonth() + 12);
    }
  }

  result.dueDate = dueDate;
  result.daysOverdue = getDaysOverdue(dueDate);

  if (result.daysOverdue === 0) {
    const daysUntil = getDaysUntil(dueDate);
    if (daysUntil <= complianceRules.riskLevels.amberThresholdDays) {
      result.status = 'due_soon';
    } else {
      result.status = 'compliant';
    }
    return result;
  }

  result.status = 'overdue';
  
  const yearsOverdue = Math.ceil(result.daysOverdue / 365);
  const fixedPenalty = yearsOverdue * complianceRules.annualReturns.fixedAnnualPenalty[company.type];
  
  const dailyDays = getDailyPenaltyDays(dueDate);
  const officerCount = getOfficerCount(company);
  const dailyRate = complianceRules.annualReturns.dailyPenaltyPerOfficer[company.type];
  const dailyPenalty = dailyDays * dailyRate * officerCount;
  
  const companyPenaltyRate = complianceRules.annualReturns.dailyPenaltyPerOfficer[company.type];
  const companyDailyPenalty = dailyDays * companyPenaltyRate;
  
  const totalLiability = fixedPenalty + dailyPenalty;
  
  result.estimatedPenalty = {
    companyLiability: fixedPenalty + companyDailyPenalty,
    perDirectorLiability: dailyDays * dailyRate,
    secretaryLiability: company.hasCompanySecretary ? dailyDays * dailyRate : 0,
    totalLiability: totalLiability,
    officerCount: officerCount,
    calculationBreakdown: `Annual return was due on ${dueDate.toLocaleDateString('en-GB')}. Company is ${result.daysOverdue} days overdue. Fixed penalty: ${formatCurrency(fixedPenalty)} (${formatCurrency(complianceRules.annualReturns.fixedAnnualPenalty[company.type])} × ${yearsOverdue} year(s)). Daily penalty (from April 1, 2024 to today): ${formatCurrency(dailyRate)}/day × ${dailyDays} days × ${officerCount} parties = ${formatCurrency(dailyPenalty)}. Total estimated liability: ${formatCurrency(totalLiability)}.`
  };

  result.advisoryNote = `File all outstanding annual returns immediately at the CAC services portal. Penalty is accruing daily at ${formatCurrency(dailyRate)} per party. After ${complianceRules.strikeOff.nonFilingYearsThreshold} consecutive years of non-filing, CAC may strike off the company under Section 692, CAMA 2020.`;

  result.recommendedAction = `File annual return(s) for ${yearsOverdue} year(s) immediately via the CAC portal. Create a filing task.`;

  return result;
}

function checkPSCFiling(company) {
  const result = {
    checkType: 'psc_filing',
    status: 'compliant',
    dueDate: null,
    daysOverdue: 0,
    estimatedPenalty: {
      companyLiability: 0,
      perDirectorLiability: 0,
      secretaryLiability: 0,
      totalLiability: 0,
      officerCount: getOfficerCount(company),
      calculationBreakdown: ''
    },
    legalBasis: complianceRules.psc.legalBasis,
    advisoryNote: '',
    recommendedAction: ''
  };

  if (company.pscFiled && !company.pscHasConflict) {
    result.status = 'compliant';
    return result;
  }

  if (company.pscFiled && company.pscHasConflict) {
    result.status = 'violation';
    result.dueDate = company.pscFiledDate;
    result.daysOverdue = getDaysOverdue(company.pscFiledDate);
    
    const dailyDays = getDailyPenaltyDays(company.pscFiledDate);
    const officerCount = getOfficerCount(company);
    const perOfficerPenalty = complianceRules.psc.dailyPenaltyPerOfficer * dailyDays;
    const totalLiability = perOfficerPenalty * officerCount;

    result.estimatedPenalty = {
      companyLiability: perOfficerPenalty,
      perDirectorLiability: perOfficerPenalty,
      secretaryLiability: company.hasCompanySecretary ? perOfficerPenalty : 0,
      totalLiability: totalLiability,
      officerCount: officerCount,
      calculationBreakdown: `PSC conflict flagged from ${company.pscFiledDate.toLocaleDateString('en-GB')}. Daily penalty: ${formatCurrency(complianceRules.psc.dailyPenaltyPerOfficer)}/party × ${dailyDays} days × ${officerCount} parties = ${formatCurrency(totalLiability)}.`
    };

    result.advisoryNote = complianceRules.psc.consequences.join('. ') + '. This is a critical violation. The company may be marked INACTIVE by CAC. All CAC applications are blocked until PSC is resolved.';
    result.recommendedAction = 'Update PSC information immediately via the CAC portal. Create a filing task.';

    return result;
  }

  const dueDate = new Date(company.incorporationDate);
  dueDate.setDate(dueDate.getDate() + complianceRules.psc.filingDeadlineDays);
  
  result.dueDate = dueDate;
  result.daysOverdue = getDaysOverdue(dueDate);

  if (result.daysOverdue === 0) {
    const daysUntil = getDaysUntil(dueDate);
    if (daysUntil <= complianceRules.riskLevels.amberThresholdDays) {
      result.status = 'due_soon';
    } else {
      result.status = 'compliant';
    }
    return result;
  }

  result.status = 'violation';
  
  const dailyDays = getDailyPenaltyDays(dueDate);
  const officerCount = getOfficerCount(company);
  const perOfficerPenalty = complianceRules.psc.dailyPenaltyPerOfficer * dailyDays;
  const totalLiability = perOfficerPenalty * officerCount;

  result.estimatedPenalty = {
    companyLiability: perOfficerPenalty,
    perDirectorLiability: perOfficerPenalty,
    secretaryLiability: company.hasCompanySecretary ? perOfficerPenalty : 0,
    totalLiability: totalLiability,
    officerCount: officerCount,
    calculationBreakdown: `PSC was due on ${dueDate.toLocaleDateString('en-GB')} (30 days from incorporation). Daily penalty: ${formatCurrency(complianceRules.psc.dailyPenaltyPerOfficer)}/party × ${dailyDays} days × ${officerCount} parties = ${formatCurrency(totalLiability)}.`
  };

  result.advisoryNote = complianceRules.psc.consequences.join('. ') + '. This is a critical violation. The company may be marked INACTIVE by CAC. All CAC applications are blocked until PSC is resolved.';

  result.recommendedAction = 'File PSC immediately via the CAC portal. Create a filing task.';

  return result;
}

function checkAGMStatus(company) {
  const result = {
    checkType: 'agm',
    status: 'not_applicable',
    dueDate: null,
    daysOverdue: 0,
    estimatedPenalty: {
      companyLiability: 0,
      perDirectorLiability: 0,
      secretaryLiability: 0,
      totalLiability: 0,
      officerCount: getOfficerCount(company),
      calculationBreakdown: ''
    },
    legalBasis: complianceRules.agm.legalBasis,
    advisoryNote: '',
    recommendedAction: ''
  };

  if (complianceRules.agm.exemptTypes.includes(company.type)) {
    result.status = 'not_applicable';
    return result;
  }

  let dueDate;
  
  if (!company.lastAGMDate) {
    dueDate = new Date(company.incorporationDate);
    dueDate.setMonth(dueDate.getMonth() + complianceRules.agm.firstAGMMonthsFromIncorporation);
  } else {
    dueDate = new Date(company.lastAGMDate);
    dueDate.setMonth(dueDate.getMonth() + complianceRules.agm.subsequentAGMMaxIntervalMonths);
  }

  result.dueDate = dueDate;
  result.daysOverdue = getDaysOverdue(dueDate);

  if (result.daysOverdue === 0) {
    const daysUntil = getDaysUntil(dueDate);
    if (daysUntil <= complianceRules.riskLevels.amberThresholdDays) {
      result.status = 'due_soon';
    } else {
      result.status = 'compliant';
    }
    return result;
  }

  result.status = 'overdue';
  
  result.advisoryNote = 'AGM is required under Section 371, CAMA 2020. Failure to hold AGM also delays the annual return filing deadline under Section 421, CAMA 2020.';
  
  result.recommendedAction = 'Hold AGM and file the resolution. Note: No specific financial penalty formula published by CAC for AGM non-compliance, but it creates procedural risk.';

  return result;
}

function calculateTotalLiability(checksArray) {
  let total = 0;
  const byCheckType = {
    annual_return: 0,
    psc_filing: 0,
    agm: 0
  };

  checksArray.forEach(check => {
    if (check.estimatedPenalty && check.estimatedPenalty.totalLiability) {
      total += check.estimatedPenalty.totalLiability;
      if (byCheckType.hasOwnProperty(check.checkType)) {
        byCheckType[check.checkType] += check.estimatedPenalty.totalLiability;
      }
    }
  });

  return { total, byCheckType };
}

function generateRiskLevel(checksArray, company) {
  if (company.isStruck || company.isCACInactive) {
    return 'red';
  }

  for (const check of checksArray) {
    if (check.status === 'violation') {
      return 'red';
    }
    if (check.daysOverdue >= complianceRules.riskLevels.redThresholdDays) {
      return 'red';
    }
    if (check.status === 'overdue') {
      return 'amber';
    }
    if (check.status === 'due_soon') {
      const daysUntil = getDaysUntil(check.dueDate);
      if (daysUntil <= 30) {
        return 'amber';
      }
    }
  }

  return 'green';
}

async function runFullAudit(company) {
  const checks = [
    checkAnnualReturns(company),
    checkPSCFiling(company),
    checkAGMStatus(company)
  ];

  const liability = calculateTotalLiability(checks);
  const riskLevel = generateRiskLevel(checks, company);

  for (const checkResult of checks) {
    await ComplianceCheck.findOneAndUpdate(
      { companyId: company._id, checkType: checkResult.checkType },
      {
        ...checkResult,
        companyId: company._id,
        lawFirmId: company.lawFirmId,
        generatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }

  company.complianceRiskLevel = riskLevel;
  company.totalEstimatedLiability = liability.total;
  company.lastAuditDate = new Date();
  await company.save();

  return {
    company,
    checks,
    riskLevel,
    totalLiability: liability
  };
}

module.exports = {
  getOfficerCount,
  getDaysOverdue,
  getDaysUntil,
  getDailyPenaltyDays,
  checkAnnualReturns,
  checkPSCFiling,
  checkAGMStatus,
  calculateTotalLiability,
  generateRiskLevel,
  runFullAudit
};
