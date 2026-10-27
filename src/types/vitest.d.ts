import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations: AxeMatchers['toHaveNoViolations'];
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations: AxeMatchers['toHaveNoViolations'];
  }
}
