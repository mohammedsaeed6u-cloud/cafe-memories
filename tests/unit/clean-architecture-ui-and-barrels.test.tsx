// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import * as Types from '@/types';
import * as Services from '@/lib/services';
import * as Validations from '@/lib/validations';
import * as Utils from '@/lib/utils';

describe('Clean Architecture UI Primitives', () => {
  describe('Button Component', () => {
    it('renders with children and default props', () => {
      render(<Button>اضغط هنا</Button>);
      const btn = screen.getByRole('button', { name: /اضغط هنا/i });
      expect(btn).toBeDefined();
      expect(btn.getAttribute('aria-busy')).toBe('false');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>تسجيل</Button>);
      const btn = screen.getByRole('button', { name: /تسجيل/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders loading state correctly', () => {
      render(<Button isLoading>حفظ</Button>);
      const btn = screen.getByRole('button');
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.hasAttribute('disabled')).toBe(true);
    });

    it('supports destructive variant', () => {
      render(<Button variant="destructive">حذف السجل</Button>);
      const btn = screen.getByRole('button', { name: /حذف السجل/i });
      expect(btn.className).toContain('bg-rose-600');
    });

    it('supports icons', () => {
      render(
        <Button leftIcon={<span data-testid="left-icon">←</span>}>
          معاينة
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeDefined();
    });
  });

  describe('Card Component Family', () => {
    it('renders full card hierarchy cleanly', () => {
      render(
        <Card variant="warm">
          <CardHeader>
            <CardTitle>بطاقة العضوية</CardTitle>
            <CardDescription>تفاصيل بطاقة الولاء الرقمية</CardDescription>
          </CardHeader>
          <CardContent>
            <p>محتوى البطاقة</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">تعديل</Button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('بطاقة العضوية')).toBeDefined();
      expect(screen.getByText('تفاصيل بطاقة الولاء الرقمية')).toBeDefined();
      expect(screen.getByText('محتوى البطاقة')).toBeDefined();
      expect(screen.getByRole('button', { name: /تعديل/i })).toBeDefined();
    });
  });

  describe('EmptyState Component', () => {
    it('renders empty state with actions', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="لا توجد ذكريات بعد"
          description="قم بالتقاط أول ذكرى للبدء في تزيين جدار المقهى"
          action={{
            label: 'التقاط صورة',
            onClick: handleAction,
          }}
        />
      );

      expect(screen.getByText('لا توجد ذكريات بعد')).toBeDefined();
      expect(screen.getByText(/قم بالتقاط أول ذكرى/i)).toBeDefined();
      const actionBtn = screen.getByRole('button', { name: /التقاط صورة/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState Component', () => {
    it('renders error state with retry and back actions', () => {
      const handleRetry = vi.fn();
      const handleBack = vi.fn();
      render(
        <ErrorState
          title="فشل تحميل البيانات"
          message="تعذر الوصول إلى خادم المزامنة السحابي"
          code="ERR_NETWORK_TIMEOUT"
          onRetry={handleRetry}
          onBack={handleBack}
        />
      );

      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('فشل تحميل البيانات')).toBeDefined();
      expect(screen.getByText(/تعذر الوصول إلى خادم المزامنة/i)).toBeDefined();
      expect(screen.getByText(/ERR_NETWORK_TIMEOUT/i)).toBeDefined();

      const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);

      const backBtn = screen.getByRole('button', { name: /العودة للخلف/i });
      fireEvent.click(backBtn);
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Clean Architecture Central Barrels', () => {
  it('exports valid services from @/lib/services', () => {
    expect(Services.DigitalWalletService).toBeDefined();
    expect(Services.LoyaltyCardService).toBeDefined();
    expect(Services.CustomerRegistryService).toBeDefined();
    expect(typeof Services.evaluateVisitEligibility).toBe('function');
    expect(typeof Services.pickMemoryThumbnail).toBe('function');
  });

  it('exports valid types from @/types', () => {
    expect(Types).toBeDefined();
  });

  it('exports valid validations from @/lib/validations', () => {
    expect(Validations.businessBrandingSchema).toBeDefined();
    expect(Validations.createOrganizationSchema).toBeDefined();
    expect(Validations.staffPinSchema).toBeDefined();
  });

  it('exports valid utils from @/lib/utils', () => {
    expect(typeof Utils.cn).toBe('function');
    expect(typeof Utils.withUtm).toBe('function');
  });
});
