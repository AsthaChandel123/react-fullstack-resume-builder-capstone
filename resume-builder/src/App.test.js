import { render, screen } from '@testing-library/react';
import App from './App';

test('renders builder form and download button', () => {
  render(<App />);
  expect(screen.getByText(/Student Portfolio Builder/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();
  expect(screen.getByText(/Download Resume/i)).toBeInTheDocument();
});
