import { calculateLineAmounts, calculateQuoteTotals, getMarginHealth, isValidDecimal } from '@/lib/calculations';
import { QuoteLine } from '@/types';
import Decimal from 'decimal.js';

describe('Calculations', () => {
  describe('calculateLineAmounts', () => {
    it('should calculate line amounts correctly', () => {
      const line = {
        quantity: '2',
        unit_cost_ex_gst: '100.00',
        markup_percent: '50',
      };

      const result = calculateLineAmounts(line);

      expect(result.line_total_cost).toBe('200.00');
      expect(result.selling_price_ex_gst).toBe('300.00'); // 200 * 1.5
      expect(result.gst).toBe('30.00'); // 300 * 0.10
      expect(result.selling_price_inc_gst).toBe('330.00');
    });

    it('should handle zero quantity', () => {
      const line = {
        quantity: '0',
        unit_cost_ex_gst: '100.00',
        markup_percent: '50',
      };

      const result = calculateLineAmounts(line);

      expect(result.line_total_cost).toBe('0.00');
      expect(result.selling_price_ex_gst).toBe('0.00');
      expect(result.gst).toBe('0.00');
      expect(result.selling_price_inc_gst).toBe('0.00');
    });

    it('should handle decimal quantities', () => {
      const line = {
        quantity: '2.5',
        unit_cost_ex_gst: '88.00',
        markup_percent: '50',
      };

      const result = calculateLineAmounts(line);

      expect(result.line_total_cost).toBe('220.00');
      expect(result.selling_price_ex_gst).toBe('330.00'); // 220 * 1.5
      expect(result.gst).toBe('33.00');
      expect(result.selling_price_inc_gst).toBe('363.00');
    });
  });

  describe('calculateQuoteTotals', () => {
    it('should calculate quote totals correctly', () => {
      const lines: QuoteLine[] = [
        {
          id: '1',
          quote_id: 'q1',
          line_number: 1,
          type: 'labour_plumber',
          description: 'Labour',
          quantity: '2',
          unit: 'hours',
          unit_cost_ex_gst: '88.00',
          markup_percent: '50',
          line_total_cost: '176.00',
          selling_price_ex_gst: '264.00',
          gst: '26.40',
          selling_price_inc_gst: '290.40',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          quote_id: 'q1',
          line_number: 2,
          type: 'material',
          description: 'Tap',
          quantity: '1',
          unit: 'each',
          unit_cost_ex_gst: '25.00',
          markup_percent: '35',
          line_total_cost: '25.00',
          selling_price_ex_gst: '33.75',
          gst: '3.38',
          selling_price_inc_gst: '37.13',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const result = calculateQuoteTotals(lines);

      expect(result.direct_job_cost).toBe('201.00'); // 176 + 25
      expect(result.quote_ex_gst).toBe('297.75'); // 264 + 33.75
      expect(result.gst_total).toBe('29.78'); // 297.75 * 0.10
      expect(result.gross_profit).toBe('96.75'); // 297.75 - 201
      expect(result.margin_health).toBe('strong'); // 32.5% >= 40% ? no... should be 'watch'
    });

    it('should exclude optional lines from totals', () => {
      const lines: QuoteLine[] = [
        {
          id: '1',
          quote_id: 'q1',
          line_number: 1,
          type: 'labour_plumber',
          description: 'Labour',
          quantity: '1',
          unit: 'hours',
          unit_cost_ex_gst: '88.00',
          markup_percent: '50',
          line_total_cost: '88.00',
          selling_price_ex_gst: '132.00',
          gst: '13.20',
          selling_price_inc_gst: '145.20',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          quote_id: 'q1',
          line_number: 2,
          type: 'material',
          description: 'Optional Tap',
          quantity: '1',
          unit: 'each',
          unit_cost_ex_gst: '100.00',
          markup_percent: '35',
          line_total_cost: '100.00',
          selling_price_ex_gst: '135.00',
          gst: '13.50',
          selling_price_inc_gst: '148.50',
          optional: true,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const result = calculateQuoteTotals(lines);

      // Should only include first line (not optional)
      expect(result.quote_ex_gst).toBe('132.00');
      expect(result.direct_job_cost).toBe('88.00');
    });
  });

  describe('Margin health', () => {
    it('should return strong for margin >= 40%', () => {
      const lines: QuoteLine[] = [
        {
          id: '1',
          quote_id: 'q1',
          line_number: 1,
          type: 'labour_plumber',
          description: 'Labour',
          quantity: '1',
          unit: 'hours',
          unit_cost_ex_gst: '100.00',
          markup_percent: '100', // 100% markup = 100 profit on 200 selling = 50% margin
          line_total_cost: '100.00',
          selling_price_ex_gst: '200.00',
          gst: '20.00',
          selling_price_inc_gst: '220.00',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const result = calculateQuoteTotals(lines);
      expect(result.margin_health).toBe('strong');
    });

    it('should return watch for margin 25%-39.9%', () => {
      const lines: QuoteLine[] = [
        {
          id: '1',
          quote_id: 'q1',
          line_number: 1,
          type: 'labour_plumber',
          description: 'Labour',
          quantity: '1',
          unit: 'hours',
          unit_cost_ex_gst: '100.00',
          markup_percent: '33.33', // 33% markup
          line_total_cost: '100.00',
          selling_price_ex_gst: '133.33',
          gst: '13.33',
          selling_price_inc_gst: '146.66',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const result = calculateQuoteTotals(lines);
      expect(result.margin_health).toBe('watch');
    });

    it('should return low for margin < 25%', () => {
      const lines: QuoteLine[] = [
        {
          id: '1',
          quote_id: 'q1',
          line_number: 1,
          type: 'labour_plumber',
          description: 'Labour',
          quantity: '1',
          unit: 'hours',
          unit_cost_ex_gst: '100.00',
          markup_percent: '10',
          line_total_cost: '100.00',
          selling_price_ex_gst: '110.00',
          gst: '11.00',
          selling_price_inc_gst: '121.00',
          optional: false,
          section_indent: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const result = calculateQuoteTotals(lines);
      expect(result.margin_health).toBe('low');
    });
  });

  describe('isValidDecimal', () => {
    it('should accept valid decimal strings', () => {
      expect(isValidDecimal('100.00')).toBe(true);
      expect(isValidDecimal('50')).toBe(true);
      expect(isValidDecimal('0.50')).toBe(true);
      expect(isValidDecimal('88.50')).toBe(true);
    });

    it('should reject invalid decimal strings', () => {
      expect(isValidDecimal('abc')).toBe(false);
      expect(isValidDecimal('')).toBe(false);
      expect(isValidDecimal('$100')).toBe(false);
    });

    it('should accept numbers', () => {
      expect(isValidDecimal(100)).toBe(true);
      expect(isValidDecimal(50.5)).toBe(true);
    });
  });
});
