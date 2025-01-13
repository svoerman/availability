import { Button } from '@/components/ui/button';
import { render, screen, testAccessibility } from '@/lib/test-utils';

describe('Button', () => {
  it('should render without accessibility violations', async () => {
    await testAccessibility(<Button>Click me</Button>);
  });

  it('should render with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
  });
});
