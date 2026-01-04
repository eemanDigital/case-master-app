// utils/invoiceCalculations.js - COMPLETE FIXED VERSION
/**
 * Invoice Calculation Utilities
 * Mirrors backend calculation logic for consistency
 */

/**
 * Calculate service amount based on billing method
 */
export const calculateServiceAmount = (service) => {
  if (!service) return 0;

  const {
    billingMethod,
    hours = 0,
    rate = 0,
    fixedAmount = 0,
    quantity = 1,
    unitPrice = 0,
  } = service;

  let amount = 0;

  switch (billingMethod) {
    case "hourly":
      amount = hours * rate;
      break;
    case "fixed_fee":
      amount = fixedAmount;
      break;
    case "item":
      amount = quantity * unitPrice;
      break;
    case "contingency":
    case "retainer":
      amount = fixedAmount;
      break;
    default:
      amount = 0;
  }

  return amount;
};

/**
 * Calculate invoice totals - FIXED VERSION
 */
export const calculateInvoiceTotals = (formValues) => {
  if (!formValues) {
    return {
      servicesWithAmounts: [],
      servicesTotal: 0,
      expensesTotal: 0,
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      total: 0,
    };
  }

  const {
    services = [],
    expenses = [],
    discount = 0,
    discountType = "none",
    taxRate = 0,
    previousBalance = 0,
  } = formValues;

  // 1. Calculate services total with individual amounts
  let servicesTotal = 0;
  const servicesWithAmounts = services
    .filter((service) => service && service.description) // Filter out empty services
    .map((service) => {
      const amount = calculateServiceAmount(service);
      servicesTotal += amount;
      return {
        ...service,
        amount,
      };
    });

  // 2. Calculate expenses total
  const expensesTotal = expenses
    .filter((expense) => expense && expense.description) // Filter out empty expenses
    .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  // 3. Calculate subtotal (services + expenses + previous balance)
  const subtotal =
    servicesTotal + expensesTotal + (parseFloat(previousBalance) || 0);

  // 4. Apply discount
  let discountAmount = 0;
  const numericDiscount = parseFloat(discount) || 0;

  if (discountType === "percentage" && numericDiscount > 0) {
    discountAmount = subtotal * (numericDiscount / 100);
  } else if (discountType === "fixed" && numericDiscount > 0) {
    discountAmount = numericDiscount;
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  // 5. Calculate taxable amount (after discount)
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // 6. Calculate tax
  const numericTaxRate = parseFloat(taxRate) || 0;
  const taxAmount = taxableAmount * (numericTaxRate / 100);

  // 7. Calculate final total
  const total = taxableAmount + taxAmount;

  return {
    servicesWithAmounts,
    servicesTotal,
    expensesTotal,
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  };
};

/**
 * Format currency for Nigerian Naira
 */
export const formatCurrency = (value) => {
  const numValue = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

/**
 * Format service billing method for display
 */
export const formatBillingMethodDisplay = (service) => {
  if (!service) return "";

  const { billingMethod, hours, rate, quantity, unitPrice, fixedAmount } =
    service;

  switch (billingMethod) {
    case "hourly":
      return `Hourly: ${hours || 0} hours × ${formatCurrency(rate || 0)}/hour`;
    case "fixed_fee":
      return `Fixed Fee: ${formatCurrency(fixedAmount || 0)}`;
    case "item":
      return `Item-based: ${quantity || 1} × ${formatCurrency(unitPrice || 0)}`;
    case "contingency":
      return `Contingency: ${formatCurrency(fixedAmount || 0)}`;
    case "retainer":
      return `Retainer: ${formatCurrency(fixedAmount || 0)}`;
    default:
      return billingMethod || "Not specified";
  }
};

/**
 * Validate invoice form data
 */
export const validateInvoiceData = (values) => {
  const errors = [];

  // Check required fields
  if (!values.client) {
    errors.push("Client is required");
  }

  if (!values.title) {
    errors.push("Invoice title is required");
  }

  if (!values.dueDate) {
    errors.push("Due date is required");
  }

  // Check if there are valid services or expenses
  const hasValidServices = values.services?.some(
    (service) =>
      service && service.description && calculateServiceAmount(service) > 0
  );

  const hasValidExpenses = values.expenses?.some(
    (expense) =>
      expense && expense.description && (parseFloat(expense.amount) || 0) > 0
  );

  if (!hasValidServices && !hasValidExpenses) {
    errors.push("At least one valid service or expense is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Prepare invoice data for submission
 */
export const prepareInvoiceDataForSubmit = (
  formValues,
  publishOnSave = false
) => {
  const data = {
    ...formValues,
    status: publishOnSave ? "sent" : "draft",
  };

  // Set issue date if publishing
  if (publishOnSave) {
    data.issueDate = new Date().toISOString();
  }

  // Ensure dates are properly formatted
  const formatDate = (date) => {
    if (!date) return date;
    if (date.toISOString) return date.toISOString();
    if (typeof date === "string") return date;
    return date;
  };

  if (data.dueDate) {
    data.dueDate = formatDate(data.dueDate);
  }

  if (data.billingPeriodStart) {
    data.billingPeriodStart = formatDate(data.billingPeriodStart);
  }

  if (data.billingPeriodEnd) {
    data.billingPeriodEnd = formatDate(data.billingPeriodEnd);
  }

  // Process services
  if (data.services) {
    data.services = data.services
      .filter((service) => service && service.description) // Remove empty services
      .map((service) => ({
        description: service.description || "",
        billingMethod: service.billingMethod || "hourly",
        hours: parseFloat(service.hours) || 0,
        rate: parseFloat(service.rate) || 0,
        fixedAmount: parseFloat(service.fixedAmount) || 0,
        quantity: parseInt(service.quantity) || 1,
        unitPrice: parseFloat(service.unitPrice) || 0,
        date: formatDate(service.date),
        category: service.category || "other",
      }));
  }

  // Process expenses
  if (data.expenses) {
    data.expenses = data.expenses
      .filter((expense) => expense && expense.description) // Remove empty expenses
      .map((expense) => ({
        description: expense.description || "",
        amount: parseFloat(expense.amount) || 0,
        date: formatDate(expense.date),
        category: expense.category || "other",
        receiptNumber: expense.receiptNumber || "",
        isReimbursable:
          expense.isReimbursable !== undefined ? expense.isReimbursable : true,
      }));
  }

  // Convert numeric fields
  data.discount = parseFloat(data.discount) || 0;
  data.taxRate = parseFloat(data.taxRate) || 0;
  data.previousBalance = parseFloat(data.previousBalance) || 0;

  return data;
};
