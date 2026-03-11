import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', locale: 'si-LK' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'sw-KE' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
];

const DEFAULT_CURRENCY: CurrencyConfig = SUPPORTED_CURRENCIES[0]; // INR

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  // Current school currency setting - default to INR
  private _currencyCode = signal<string>('INR');

  // Computed currency config
  readonly currencyConfig = computed<CurrencyConfig>(() => {
    const code = this._currencyCode();
    return SUPPORTED_CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
  });

  // Shorthand accessors
  readonly currencyCode = computed(() => this.currencyConfig().code);
  readonly currencySymbol = computed(() => this.currencyConfig().symbol);
  readonly currencyLocale = computed(() => this.currencyConfig().locale);

  constructor() {
    this.loadCurrencyFromSchool();
  }

  /**
   * Load currency from school settings
   */
  loadCurrencyFromSchool(): void {
    // Try to get from school info in auth service
    const school = this.auth.school();
    if (school && (school as any).settings?.currency) {
      this._currencyCode.set((school as any).settings.currency);
      return;
    }

    // Try from localStorage
    const savedCurrency = localStorage.getItem('schoolCurrency');
    if (savedCurrency) {
      this._currencyCode.set(savedCurrency);
      return;
    }

    // Fetch from API if logged in
    if (this.auth.isAuthenticated()) {
      this.api.get<any>('/schools/current/settings').subscribe({
        next: (res) => {
          const currency = res?.data?.currency || res?.data?.settings?.currency;
          if (currency) {
            this._currencyCode.set(currency);
            localStorage.setItem('schoolCurrency', currency);
          }
        },
        error: () => {
          // Keep default INR
        }
      });
    }
  }

  /**
   * Set currency (for school admin to change settings)
   */
  setCurrency(code: string): void {
    const config = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (config) {
      this._currencyCode.set(code);
      localStorage.setItem('schoolCurrency', code);
    }
  }

  /**
   * Format amount using current currency
   */
  format(amount: number, showSymbol: boolean = true): string {
    const config = this.currencyConfig();
    try {
      const formatted = new Intl.NumberFormat(config.locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: config.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
      return formatted;
    } catch {
      // Fallback
      return showSymbol ? `${config.symbol}${amount.toLocaleString()}` : amount.toLocaleString();
    }
  }

  /**
   * Format for chart axis (abbreviated)
   */
  formatShort(value: number): string {
    const symbol = this.currencySymbol();
    if (value >= 10000000) {
      return `${symbol}${(value / 10000000).toFixed(1)}Cr`; // Crores for INR
    } else if (value >= 100000) {
      return `${symbol}${(value / 100000).toFixed(1)}L`; // Lakhs for INR
    } else if (value >= 1000) {
      return `${symbol}${(value / 1000).toFixed(1)}K`;
    }
    return `${symbol}${value}`;
  }

  /**
   * Get all supported currencies (for settings dropdown)
   */
  getSupportedCurrencies(): CurrencyConfig[] {
    return SUPPORTED_CURRENCIES;
  }
}
