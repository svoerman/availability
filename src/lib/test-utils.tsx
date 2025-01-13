import { render as rtlRender } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactElement } from 'react';

expect.extend(toHaveNoViolations);

type RenderOptions = Parameters<typeof rtlRender>[1];

// Custom render function that includes providers
export function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { ...options });
}

// Accessibility test helper
export async function testAccessibility(ui: ReactElement) {
  const { container } = render(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
