import Decimal from 'decimal.js';
import { QuoteLine, QuoteCalculations, MarginHealth } from '@/types';

// Configure Decimal for financial precision
Decimal.set({
  precision: 10,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Calculate line totals with decimal precision
 */
export function calculateLineAmounts(line: Partial<QuoteLine>): {
  line_total_cost: string;
  selling_price_ex_gst: string;
  gst: string;
  selling_price_inc_gst: string;
} {
  const quantity = new Decimal(line.quantity || 0);
  const unitCost = new Decimal(line.unit_cost_ex_gst || 0);
  const markupPercent = new Decimal(line.markup_percent || 0);

  // Line total cost
  const lineTotalCost = quantity.times(unitCost);

  // Selling price ex GST = cost × (1 + markup%)
  const markupMultiplier = new Decimal(1).plus(markupPercent.dividedBy(100));
  const sellingPriceExGst = lineTotalCost.times(markupMultiplier);

  // GST at 10%
  const gst = sellingPriceExGst.times('0.10');

  // Selling price inc GST
  const sellingPriceIncGst = sellingPriceExGst.plus(gst);

  return {
    line_total_cost: lineTotalCost.toFixed(2),
    selling_price_ex_gst: sellingPriceExGst.toFixed(2),
    gst: gst.toFixed(2),
    selling_price_inc_gst: sellingPriceIncGst.toFixed(2),
  };
}

/**
 * Calculate quote totals from all lines
 */
export function calculateQuoteTotals(lines: QuoteLine[]): QuoteCalculations {
  let directJobCost = new Decimal(0);
  let quoteExGst = new Decimal(0);

  // Only include non-optional lines in totals
  lines
    .filter((line) => !line.optional)
    .forEach((line) => {
      directJobCost = directJobCost.plus(line.line_total_cost);
      quoteExGst = quoteExGst.plus(line.selling_price_ex_gst);
    });

  // GST
  const gstTotal = quoteExGst.times('0.10');

  // Client total
  const clientTotal = quoteExGst.plus(gstTotal);

  // Gross profit
  const grossProfit = quoteExGst.minus(directJobCost);

  // Gross margin percentage
  const grossMarginPercent = quoteExGst.isZero()
    ? new Decimal(0)
    : grossProfit.dividedBy(quoteExGst).times(100);

  // Margin health
  const marginHealth = getMarginHealth(grossMarginPercent);

  // Margin explanation in plain English
  const marginExplanation = explainMargin(grossMarginPercent, quoteExGst);

  return {
    direct_job_cost: directJobCost.toFixed(2),
    quote_ex_gst: quoteExGst.toFixed(2),
    gst_total: gstTotal.toFixed(2),
    client_total: clientTotal.toFixed(2),
    gross_profit: grossProfit.toFixed(2),
    gross_margin_percent: grossMarginPercent.toFixed(2),
    margin_health: marginHealth,
    margin_explanation: marginExplanation,
  };
}

/**
 * Determine margin health status
 */
function getMarginHealth(marginPercent: Decimal): MarginHealth {
  if (marginPercent.gte(40)) return 'strong';
  if (marginPercent.gte(25)) return 'watch';
  return 'low';
}

/**
 * Generate plain English margin explanation
 */
function explainMargin(marginPercent: Decimal, quoteExGst: Decimal): string {
  const margin = marginPercent.toNumber();
  const perHundred = quoteExGst.isZero()
    ? '0'
    : new Decimal(100)
        .times(margin)
        .dividedBy(100)
        .toFixed(2);

  return `For every $100 quoted ex GST, $${perHundred} remains after direct job costs to cover overheads, tax and net profit.`;
}

/**
 * Calculate material selling price from cost and markup
 */
export function calculateMaterialSellingPrice(
  costExGst: string,
  markupPercent: string
): string {
  const cost = new Decimal(costExGst);
  const markup = new Decimal(markupPercent);
  const sellingPrice = cost.times(new Decimal(1).plus(markup.dividedBy(100)));
  return sellingPrice.toFixed(2);
}

/**
 * Validate decimal value
 */
export function isValidDecimal(value: string | number): boolean {
  try {
    new Decimal(value);
    return true;
  } catch {
    return false;
  }
}
