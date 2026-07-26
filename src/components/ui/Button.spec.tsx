import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Pagar con tarjeta</Button>);

    expect(screen.getByRole('button', { name: 'Pagar con tarjeta' })).toBeInTheDocument();
  });

  it('applies the primary variant by default', () => {
    render(<Button>Click</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn', 'btn--primary');
  });

  it('applies the secondary variant when requested', () => {
    render(<Button variant="secondary">Click</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn--secondary');
  });

  it('merges a custom className', () => {
    render(<Button className="extra">Click</Button>);

    expect(screen.getByRole('button')).toHaveClass('extra');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects the disabled prop', () => {
    render(<Button disabled>Click</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
