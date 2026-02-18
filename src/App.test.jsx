import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

vi.mock('firebase/app');
vi.mock('firebase/firestore');
vi.mock('firebase/auth');

describe('App Component', () => {
  it('renders TaskFlow header', () => {
    render(<App />);
    expect(screen.getByText('TaskFlow')).toBeInTheDocument();
  });

  it('toggles dark mode', () => {
    render(<App />);
    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);
    expect(localStorage.getItem('darkMode')).toBeTruthy();
  });
});
