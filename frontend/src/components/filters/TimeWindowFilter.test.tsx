/**
 * TimeWindowFilter Component Tests
 * Module: FP-03
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { tzOffset } from '@date-fns/tz/tzOffset';
import { TimeWindowFilter } from './TimeWindowFilter';

describe('TimeWindowFilter', () => {
  const mockOnTimeWindowChange = jest.fn();
  const MANILA_TZ = 'Asia/Manila';

  const expectedUtcFromManilaDate = (dateString: string, endOfDay = false): number => {
    const [year, month, day] = dateString.split('-').map(Number);
    const hour = endOfDay ? 23 : 0;
    const minute = endOfDay ? 59 : 0;
    const second = endOfDay ? 59 : 0;
    const millisecond = endOfDay ? 999 : 0;

    const wallClockTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    const offsetMinutes = tzOffset(MANILA_TZ, new Date(wallClockTimestamp));
    return wallClockTimestamp - offsetMinutes * 60 * 1000;
  };

  beforeEach(() => {
    mockOnTimeWindowChange.mockClear();
  });

  // ============================================================================
  // DISABLED STATE TESTS
  // ============================================================================

  describe('disabled prop', () => {
    it('should disable start date input when disabled=true', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
          disabled={true}
        />
      );

      const startInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      expect(startInput.disabled).toBe(true);
    });

    it('should disable end date input when disabled=true', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
          disabled={true}
        />
      );

      const endInput = screen.getByLabelText('End Date') as HTMLInputElement;
      expect(endInput.disabled).toBe(true);
    });

    it('should disable Apply button when disabled=true', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
          disabled={true}
        />
      );

      // Set dates to make Apply button enabled by form logic
      const startInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const endInput = screen.getByLabelText('End Date') as HTMLInputElement;
      
      fireEvent.change(startInput, { target: { value: '2024-04-01' } });
      fireEvent.change(endInput, { target: { value: '2024-04-15' } });

      // Button should still be disabled because component-level disabled=true
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).toHaveAttribute('disabled');
    });

    it('should not prevent date input interaction when disabled=false', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
          disabled={false}
        />
      );

      const startInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      expect(startInput.disabled).toBe(false);

      fireEvent.change(startInput, { target: { value: '2024-04-01' } });
      expect(startInput.value).toBe('2024-04-01');
    });
  });

  // ============================================================================
  // TIMEZONE DISPLAY TESTS
  // ============================================================================

  describe('timezone display', () => {
    it('should display custom date range in Manila timezone', () => {
      // UTC: 2024-04-16T08:00:00Z = April 16, 16:00 in Manila (GMT+8)
      const utcDate = new Date('2024-04-16T08:00:00Z');
      const customDateRange = {
        start: utcDate,
        end: utcDate,
      };

      render(
        <TimeWindowFilter
          timeWindow="custom"
          customDateRange={customDateRange}
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      // Should show April 16 (Manila time)
      const display = screen.getByText(/Apr 16/);
      expect(display).toBeInTheDocument();
    });

    it('should handle day boundaries correctly in Manila timezone', () => {
      // Edge case: UTC 2024-04-15T16:00:00Z = April 16, 00:00 in Manila (exactly midnight)
      const utcDate = new Date('2024-04-15T16:00:00Z');
      const customDateRange = {
        start: utcDate,
        end: utcDate,
      };

      render(
        <TimeWindowFilter
          timeWindow="custom"
          customDateRange={customDateRange}
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      // Should show April 16 (Manila time, at midnight)
      const display = screen.getByText(/Apr 16/);
      expect(display).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PRESET BUTTON TESTS
  // ============================================================================

  describe('preset buttons', () => {
    it('should show all preset options', () => {
      render(
        <TimeWindowFilter
          timeWindow="all"
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 24h' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Range' })).toBeInTheDocument();
    });

    it('should highlight active preset button', () => {
      render(
        <TimeWindowFilter
          timeWindow="24h"
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      const last24hButton = screen.getByRole('button', { name: 'Last 24h' });
      expect(last24hButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ============================================================================
  // CUSTOM RANGE SUBMISSION TESTS
  // ============================================================================

  describe('custom range submission', () => {
    it('should require both start and end dates', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      const startInput = screen.getByLabelText('Start Date');

      // Set only start date
      fireEvent.change(startInput, { target: { value: '2024-04-01' } });
      fireEvent.click(applyButton);

      // Should not call callback when input invalid (incomplete date range)
      expect(mockOnTimeWindowChange).not.toHaveBeenCalled();
    });

    it('should convert Manila timezone dates to UTC when submitting', () => {
      render(
        <TimeWindowFilter
          timeWindow="custom"
          onTimeWindowChange={mockOnTimeWindowChange}
        />
      );

      const startInput = screen.getByLabelText('Start Date');
      const endInput = screen.getByLabelText('End Date');
      const applyButton = screen.getByRole('button', { name: 'Apply' });

      fireEvent.change(startInput, { target: { value: '2024-04-01' } });
      fireEvent.change(endInput, { target: { value: '2024-04-15' } });
      fireEvent.click(applyButton);

      expect(mockOnTimeWindowChange).toHaveBeenCalledWith(
        'custom',
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        })
      );

      // Verify dates are converted from Manila wall-clock dates to UTC timestamps.
      const callArgs = mockOnTimeWindowChange.mock.calls[0];
      const startDate = callArgs[1].start as Date;
      const endDate = callArgs[1].end as Date;

      expect(startDate.getTime()).toBe(expectedUtcFromManilaDate('2024-04-01', false));
      expect(endDate.getTime()).toBe(expectedUtcFromManilaDate('2024-04-15', true));
    });
  });
});
