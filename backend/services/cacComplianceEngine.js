const complianceRules = require('../config/complianceRules');
const { ComplianceCheck, ClientCompany } = require('../models/cacCompliance');

/**
 * Get officer count from company
 * Includes directors, secretary
 * Falls back to numDirectors field or 1
 */
function getOfficerCount(company) {
  if (!company) return 1;
  
  let count = 0;
  
  // Directors
  if (company.numDirectors && typeof company.numDirectors === 'number') {
    count += company.numDirectors;
  } else if (company.directors && Array.isArray(company.directors)) {
    count += company.directors.length;
  }
  
  // Secretary (if exists)
  if (company.hasCompanySecretary) {
    count += 1;
  }
  
  // Minimum of 1 officer
  return count > 0 ? count : 1;
}

/**
 * Calculate days overdue (positive number if late, 0 if not late)
 */
function getDaysOverdue(dueDate) {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = now - due;
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until due date
 */
function getDaysUntil(dueDate) {
  if (!dueDate) return 999;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get daily penalty days (from effective date)
 */
function getDailyPenaltyDays(dueDate) {
  const effectiveDate = complianceRules.annualReturns.dailyPenaltyEffectiveDate;
  const now = new Date();
  const due = new Date(dueDate);
  
  const startDate = due > effectiveDate ? due : effectiveDate;
  
  if (now <= startDate) return 0;
  
  const diff = now - startDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return '₦' + (amount || 0).toLocaleString('en-NG');
}

/**
 * Check if entity type has officer liability
 * Business Names and Trustees don't multiply penalties by officers
 */
function hasOfficerLiability(entityType) {
  return complianceRules.officerEntityTypes.includes(entityType);
}

/**
 * Get filing fee based on entity type and share capital
 * Companies: Base fee + Share capital fee
 * Business Names: Flat fee
 */
function getFilingFee(entity) {
  const entityType = entity.type;
  
  // Business Name - flat fee
  if (entityType === 'business_name') {
    return complianceRules.annualReturns.baseFilingFee.business_name;
  }
  
  // Company types - base + share capital
  if (complianceRules.entityTypes.SMALL_COMPANY === entityType ||
      complianceRules.entityTypes.PRIVATE_COMPANY === entityType ||
      complianceRules.entityTypes.PUBLIC_COMPANY === entityType ||
      complianceRules.entityTypes.COMPANY_LIMITED_BY_GUARANTEE === entityType ||
      complianceRules.entityTypes.SINGLE_MEMBER === entityType ||
      complianceRules.entityTypes.LLP === entityType ||
      complianceRules.entityTypes.LP === entityType) {
    
    const baseFee = complianceRules.annualReturns.baseFilingFee.company;
    const shareCapital = entity.shareCapital || 0;
    
    // Find appropriate bracket
    const brackets = complianceRules.annualReturns.shareCapitalFees.brackets;
    let shareCapitalFee = complianceRules.annualReturns.shareCapitalFees.defaultFee;
    
    for (const bracket of brackets) {
      if (shareCapital >= bracket.min && shareCapital <= bracket.max) {
        shareCapitalFee = bracket.fee;
        break;
      }
    }
    
    return baseFee + shareCapitalFee;
  }
  
  // Incorporated Trustees - no filing fee tracked here
  if (entityType === 'incorporated_trustees') {
    return 0;
  }
  
  // Default fallback
  return complianceRules.annualReturns.baseFilingFee.company;
}

/**
 * Get daily penalty rate for entity type
 */
function getDailyRate(entityType) {
  return complianceRules.annualReturns.dailyPenaltyPerDay[entityType] || 100;
}

/**
 * Get one-off penalty for entity type
 */
function getOneOffPenalty(entityType) {
  return complianceRules.annualReturns.oneOffPenalty[entityType] || 5000;
}

/**
 * Get annual return default penalty for entity type
 */
function getAnnualReturnPenalty(entityType) {
  return complianceRules.annualReturns.annualReturnDefaultPenalty[entityType] || 1000;
}

/**
 * Calculate total penalty based on new fee structure
 * 
 * Formula:
 * totalPenalty = dailyPenalty + oneOffPenalty + annualReturnPenalty
 * 
 * If entity has officers (Company, LLP, LP):
 * totalPenalty += annualReturnPenalty * numberOfOfficers
 */
function calculatePenalty(entity, daysLate) {
  const entityType = entity.type;
  
  // Clamp negative days to 0
  const effectiveDaysLate = Math.max(0, daysLate);
  
  // Get rates
  const dailyRate = getDailyRate(entityType);
  const oneOffPenalty = getOneOffPenalty(entityType);
  const annualReturnPenalty = getAnnualReturnPenalty(entityType);
  
  // Calculate components
  const dailyPenalty = effectiveDaysLate * dailyRate;
  
  // Determine if officer liability applies
  const hasOfficers = hasOfficerLiability(entityType);
  const officerCount = hasOfficers ? getOfficerCount(entity) : 0;
  
  // Base entity penalty
  let totalEntityPenalty = dailyPenalty + oneOffPenalty + annualReturnPenalty;
  
  // Add per-officer penalty if applicable
  // Note: annualReturnPenalty applies per officer for companies
  let totalPenalty = totalEntityPenalty;
  if (hasOfficers && officerCount > 0) {
    totalPenalty += annualReturnPenalty * officerCount;
  }
  
  return {
    dailyPenalty,
    oneOffPenalty,
    annualReturnPenalty,
    totalPenalty,
    officerCount,
    hasOfficerLiability: hasOfficers
  };
}

/**
 * Determine risk level based on days late
 * 
 * daysLate <= 0 → LOW
 * daysLate <= 30 → MEDIUM
 * daysLate > 30 → HIGH
 */
function calculateRiskLevel(daysLate) {
  if (daysLate <= 0) return 'green';    // Compliant
  if (daysLate <= 30) return 'amber';   // Medium risk
  return 'red';                          // High risk
}

/**
 * Calculate compliance status and full penalty breakdown
 */
function calculateComplianceStatus(entity, daysLate) {
  const effectiveDaysLate = Math.max(0, daysLate);
  const penalty = calculatePenalty(entity, effectiveDaysLate);
  const riskLevel = calculateRiskLevel(effectiveDaysLate);
  
  return {
    status: effectiveDaysLate > 0 ? 'DEFAULTING' : 'COMPLIANT',
    daysLate: effectiveDaysLate,
    filingFee: getFilingFee(entity),
    penalty,
    riskLevel
  };
}

/**
 * Calculate due date for annual return
 */
function calculateAnnualReturnDueDate(company) {
  let dueDate;
  
  if (!company.firstAnnualReturnFiled) {
    // First annual return due 18 months from incorporation
    dueDate = new Date(company.incorporationDate);
    dueDate.setMonth(dueDate.getMonth() + complianceRules.annualReturns.firstReturnMonthsFromIncorporation);
  } else {
    const companyType = company.type;
    const isExempt = complianceRules.agm.exemptTypes.includes(companyType);
    
    if (!isExempt && company.lastAGMDate) {
      // Due 42 days after AGM
      dueDate = new Date(company.lastAGMDate);
      dueDate.setDate(dueDate.getDate() + complianceRules.annualReturns.subsequentReturnDaysAfterAGM);
    } else if (company.lastAnnualReturnDate) {
      // Due annually on same date as last filing
      dueDate = new Date(company.lastAnnualReturnDate);
      const currentYear = new Date().getFullYear();
      dueDate.setFullYear(currentYear);
      if (dueDate < new Date()) {
        dueDate.setFullYear(currentYear + 1);
      }
    } else {
      // Fallback: 12 months from incorporation
      dueDate = new Date(company.incorporationDate);
      dueDate.setMonth(dueDate.getMonth() + 12);
    }
  }
  
  return dueDate;
}

/**
 * Check annual return compliance
 * Uses the new penalty calculation logic
 */
function checkAnnualReturns(company) {
  const result = {
    checkType: 'annual_return',
    checkTypeLabel: 'Annual Return Filing',
    statusLabel: 'Annual Return',
    status: 'compliant',
    dueDate: null,
    daysOverdue: 0,
    estimatedPenalty: {
      filingFee: 0,
      dailyPenalty: 0,
      oneOffPenalty: 0,
      annualReturnPenalty: 0,
      companyLiability: 0,
      perDirectorLiability: 0,
      secretaryLiability: 0,
      totalLiability: 0,
      officerCount: 0,
      hasOfficerLiability: false,
      calculationBreakdown: ''
    },
    legalBasis: complianceRules.annualReturns.legalBasis,
    advisoryNote: '',
    recommendedAction: '',
    filingFee: 0
  };

  const dueDate = calculateAnnualReturnDueDate(company);
  result.dueDate = dueDate;
  
  const daysOverdue = getDaysOverdue(dueDate);
  result.daysOverdue = daysOverdue;
  
  // Calculate filing fee
  const filingFee = getFilingFee(company);
  result.filingFee = filingFee;
  result.estimatedPenalty.filingFee = filingFee;
  
  // If not overdue, check if due soon
  if (daysOverdue === 0) {
    const daysUntil = getDaysUntil(dueDate);
    if (daysUntil <= complianceRules.riskLevels.amberThresholdDays) {
      result.status = 'due_soon';
    } else {
      result.status = 'compliant';
    }
    return result;
  }
  
  // Overdue - calculate penalties
  result.status = 'overdue';
  
  // Get penalty components
  const dailyRate = getDailyRate(company.type);
  const oneOffPenalty = getOneOffPenalty(company.type);
  const annualReturnPenalty = getAnnualReturnPenalty(company.type);
  const officerCount = getOfficerCount(company);
  const hasOfficers = hasOfficerLiability(company.type);
  
  const dailyPenalty = daysOverdue * dailyRate;
  
  // Base entity liability
  let companyLiability = dailyPenalty + oneOffPenalty + annualReturnPenalty;
  
  // Per-officer penalty (directors)
  const perDirectorPenalty = hasOfficers ? annualReturnPenalty : 0;
  const totalDirectorPenalty = perDirectorPenalty * Math.max(0, officerCount - (company.hasCompanySecretary ? 1 : 0));
  
  // Secretary penalty
  const secretaryPenalty = company.hasCompanySecretary ? annualReturnPenalty : 0;
  
  // Total liability
  let totalLiability = companyLiability + totalDirectorPenalty + secretaryPenalty;
  
  result.estimatedPenalty = {
    filingFee,
    dailyPenalty,
    oneOffPenalty,
    annualReturnPenalty,
    companyLiability,
    perDirectorLiability: perDirectorPenalty,
    secretaryLiability: secretaryPenalty,
    totalLiability,
    officerCount,
    hasOfficerLiability: hasOfficers,
    calculationBreakdown: generateBreakdown(company, dueDate, daysOverdue, filingFee, dailyRate, oneOffPenalty, annualReturnPenalty, officerCount, hasOfficers)
  };
  
  // Advisory notes
  result.advisoryNote = `Annual return was due on ${dueDate.toLocaleDateString('en-GB')}. ` +
    `Penalty is accruing at ${formatCurrency(dailyRate)}/day. ` +
    `Total liability: ${formatCurrency(totalLiability)}. ` +
    `After ${complianceRules.strikeOff.nonFilingYearsThreshold} consecutive years of non-filing, ` +
    `CAC may strike off the company under Section 692, CAMA 2020.`;
  
  result.recommendedAction = `File annual return(s) immediately via the CAC portal. ` +
    `Total filing fee: ${formatCurrency(filingFee)}. ` +
    `Create a filing task.`;

  return result;
}

/**
 * Generate detailed calculation breakdown
 */
function generateBreakdown(company, dueDate, daysOverdue, filingFee, dailyRate, oneOffPenalty, annualReturnPenalty, officerCount, hasOfficers) {
  const lines = [];
  
  lines.push(`Annual return due: ${dueDate.toLocaleDateString('en-GB')}`);
  lines.push(`Days overdue: ${daysOverdue} days`);
  lines.push(`Filing fee: ${formatCurrency(filingFee)}`);
  lines.push('');
  lines.push('Penalty Calculation:');
  lines.push(`  Daily penalty: ${daysOverdue} days × ${formatCurrency(dailyRate)}/day = ${formatCurrency(daysOverdue * dailyRate)}`);
  lines.push(`  One-off penalty: ${formatCurrency(oneOffPenalty)}`);
  lines.push(`  Annual return penalty: ${formatCurrency(annualReturnPenalty)}`);
  
  if (hasOfficers) {
    lines.push(`  Officer penalty: ${formatCurrency(annualReturnPenalty)} × ${officerCount} officers = ${formatCurrency(annualReturnPenalty * officerCount)}`);
  }
  
  const totalPenalty = daysOverdue * dailyRate + oneOffPenalty + annualReturnPenalty + (hasOfficers ? annualReturnPenalty * officerCount : 0);
  lines.push('');
  lines.push(`Total estimated liability: ${formatCurrency(totalPenalty)}`);
  
  return lines.join('\n');
}

/**
 * Check PSC filing compliance
 * PSC applies ONLY to companies and LLPs per PSC Regulations 2022
 */
function checkPSCFiling(company) {
  // Check if PSC applies to this entity type
  const pscApplies = complianceRules.psc.applicableEntityTypes.includes(company.type);
  
  const result = {
    checkType: 'psc_filing',
    checkTypeLabel: 'PSC Filing',
    statusLabel: 'PSC Filing',
    status: pscApplies ? 'compliant' : 'not_applicable',
    dueDate: null,
    daysOverdue: 0,
    estimatedPenalty: {
      filingFee: 0,
      dailyPenalty: 0,
      oneOffPenalty: 0,
      companyLiability: 0,
      perDirectorLiability: 0,
      totalLiability: 0,
      officerCount: 0,
      hasOfficerLiability: pscApplies,
      calculationBreakdown: ''
    },
    legalBasis: complianceRules.psc.legalBasis,
    advisoryNote: '',
    recommendedAction: ''
  };

  // PSC does not apply to LP, Business Name, or Incorporated Trustees
  if (!pscApplies) {
    result.advisoryNote = `PSC requirements under Sections 119 & 791, CAMA 2020 and PSC Regulations 2022 apply only to companies and Limited Liability Partnerships. This entity type (${company.type}) is not subject to PSC filing.`;
    result.recommendedAction = 'No PSC filing required for this entity type.';
    return result;
  }

  // Get entity-specific daily rate from Section 2 (default in PSC reporting)
  const getPSCDailyRate = (entityType) => {
    return complianceRules.psc.dailyPenaltyPerDay.default_reporting[entityType] || 5000;
  };

  // If PSC is filed and no conflict, compliant
  if (company.pscFiled && !company.pscHasConflict) {
    result.status = 'compliant';
    return result;
  }

  // PSC has conflict - Section 6 violation (inaccurate PSC)
  if (company.pscFiled && company.pscHasConflict) {
    result.status = 'violation';
    result.dueDate = company.pscFiledDate ? new Date(company.pscFiledDate) : null;
    result.daysOverdue = getDaysOverdue(company.pscFiledDate);
    
    const dailyDays = getDailyPenaltyDays(company.pscFiledDate);
    const officerCount = getOfficerCount(company);
    const dailyRate = complianceRules.psc.dailyPenaltyPerDay.not_identifying[company.type] || 10000;
    const totalLiability = dailyRate * dailyDays * officerCount;

    result.estimatedPenalty = {
      filingFee: 0,
      dailyPenalty: dailyRate * dailyDays,
      oneOffPenalty: 0,
      companyLiability: dailyRate * dailyDays,
      perDirectorLiability: dailyRate * dailyDays,
      totalLiability,
      officerCount,
      hasOfficerLiability: true,
      calculationBreakdown: `Section 6 - PSC on record inaccurate/different from other orgs. Daily penalty: ${formatCurrency(dailyRate)}/party × ${dailyDays} days × ${officerCount} parties = ${formatCurrency(totalLiability)}.`
    };

    result.advisoryNote = complianceRules.psc.consequences.join('. ');
    result.recommendedAction = 'Update PSC information immediately to reflect accurate information. File changes via CAC portal. Create a filing task.';

    return result;
  }

  // PSC not filed - calculate due date (30 days from incorporation)
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
  const dailyRate = getPSCDailyRate(company.type);
  const oneOffPenalty = complianceRules.psc.oneOffPenalty[company.type] || 5000;
  const totalLiability = dailyRate * dailyDays * officerCount;

  result.estimatedPenalty = {
    filingFee: 0,
    dailyPenalty: dailyRate * dailyDays,
    oneOffPenalty,
    companyLiability: dailyRate * dailyDays,
    perDirectorLiability: dailyRate * dailyDays,
    totalLiability,
    officerCount,
    hasOfficerLiability: true,
    calculationBreakdown: `Section 2 - PSC reporting default. PSC due on ${dueDate.toLocaleDateString('en-GB')} (30 days from incorporation). Daily penalty: ${formatCurrency(dailyRate)}/party × ${dailyDays} days × ${officerCount} parties = ${formatCurrency(dailyRate * dailyDays * officerCount)}.`
  };

  result.advisoryNote = complianceRules.psc.consequences.join('. ');

  result.recommendedAction = 'File PSC immediately via the CAC portal. Create a filing task.';

  return result;
}

/**
 * Check AGM status
 * AGM applies only to companies (not LLPs, LPs, Business Names, or Incorporated Trustees)
 */
function checkAGMStatus(company) {
  // AGM applies only to companies
  const companyTypesOnly = [
    'small_private',
    'private',
    'public',
    'company_limited_by_guarantee',
    'single_member'
  ];
  const isCompany = companyTypesOnly.includes(company.type);
  
  const result = {
    checkType: 'agm',
    checkTypeLabel: 'Annual General Meeting',
    statusLabel: 'AGM',
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

  // Not a company - AGM not applicable
  if (!isCompany) {
    result.advisoryNote = `AGM requirements under Section 371, CAMA 2020 apply only to companies. This entity type (${company.type}) is not required to hold an AGM.`;
    result.recommendedAction = 'No AGM required for this entity type.';
    return result;
  }

  // Exempt company types don't need AGM
  if (complianceRules.agm.exemptTypes.includes(company.type)) {
    result.advisoryNote = `Small Private Companies and Single Member Companies are exempt from holding AGMs under Section 371, CAMA 2020.`;
    result.recommendedAction = 'No AGM required for this company type.';
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

/**
 * Calculate total liability from all checks
 */
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

/**
 * Generate risk level based on checks
 */
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

/**
 * Run full compliance audit on a company
 */
async function runFullAudit(company) {
  const checks = [
    checkAnnualReturns(company),
    checkPSCFiling(company),
    checkAGMStatus(company)
  ];

  const liability = calculateTotalLiability(checks);
  const riskLevel = generateRiskLevel(checks, company);

  // Save/update compliance checks
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

  // Update company with audit results
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
  // Utility functions
  getOfficerCount,
  getDaysOverdue,
  getDaysUntil,
  getDailyPenaltyDays,
  formatCurrency,
  hasOfficerLiability,
  getFilingFee,
  getDailyRate,
  getOneOffPenalty,
  getAnnualReturnPenalty,
  calculatePenalty,
  calculateRiskLevel,
  calculateComplianceStatus,
  calculateAnnualReturnDueDate,
  generateBreakdown,
  
  // Check functions
  checkAnnualReturns,
  checkPSCFiling,
  checkAGMStatus,
  
  // Aggregate functions
  calculateTotalLiability,
  generateRiskLevel,
  runFullAudit
};
