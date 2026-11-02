import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';

vi.mock('./lib/api', () => ({ default: { get: vi.fn(() => Promise.resolve({ data: { total: 0, open: 0, byStatus: { 'In Progress': 0, Resolved: 0 } } })) } }));

describe('CivicFix app', () => {
  it('renders the landing page', () => {
    render(<MemoryRouter initialEntries={['/']}><ThemeProvider><AuthProvider><App/></AuthProvider></ThemeProvider></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Report community issues. Track every update./i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Switch to/i })).not.toBeInTheDocument();
  });
});
