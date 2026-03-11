import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

/**
 * Custom currency pipe that uses school's configured currency.
 * Usage: {{ amount | schoolCurrency }}
 * Usage with options: {{ amount | schoolCurrency:'symbol':'1.0-2' }}
 */
@Pipe({
  name: 'schoolCurrency',
  standalone: true,
  pure: false // Need impure to react to currency changes
})
export class SchoolCurrencyPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  transform(
    value: number | string | null | undefined,
    display: 'symbol' | 'code' | 'none' = 'symbol',
    digitsInfo: string = '1.0-2'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(amount)) {
      return '';
    }

    const config = this.currencyService.currencyConfig();
    const [minInt, fractionPart] = digitsInfo.split('.');
    const [minFrac, maxFrac] = (fractionPart || '0-2').split('-').map(Number);

    try {
      const formatted = new Intl.NumberFormat(config.locale, {
        style: display === 'none' ? 'decimal' : 'currency',
        currency: config.code,
        minimumIntegerDigits: parseInt(minInt) || 1,
        minimumFractionDigits: minFrac || 0,
        maximumFractionDigits: maxFrac || 2,
        currencyDisplay: display === 'code' ? 'code' : 'symbol',
      }).format(amount);
      return formatted;
    } catch {
      // Fallback formatting
      const formattedAmount = amount.toLocaleString(undefined, {
        minimumFractionDigits: minFrac || 0,
        maximumFractionDigits: maxFrac || 2,
      });
      return display === 'none' ? formattedAmount : `${config.symbol}${formattedAmount}`;
    }
  }
}
