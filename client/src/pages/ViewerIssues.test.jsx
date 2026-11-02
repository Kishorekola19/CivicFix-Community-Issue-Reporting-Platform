import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import api from '../lib/api';
import ViewerIssues from './ViewerIssues';

vi.mock('../lib/api', () => ({ default: { get: vi.fn() } }));

describe('Viewer issue interface', () => {
  it('shows permitted MongoDB issue summary fields without modification controls', async () => {
    api.get.mockResolvedValueOnce({ data: { issues: [{ _id: 'issue-1', title: 'Streetlight Not Working', category: 'Electrical', locationText: 'Block A', priority: 'High', status: 'In Progress', createdAt: '2026-10-28T10:00:00.000Z' }], pagination: { total: 1 } } });
    render(<MemoryRouter><ViewerIssues /></MemoryRouter>);
    expect(await screen.findByText('Streetlight Not Working')).toBeInTheDocument();
    expect(screen.getByText('Block A')).toBeInTheDocument();
    expect(screen.getAllByText('In Progress')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /View details/i })).toHaveAttribute('href', '/issues/issue-1');
    expect(screen.queryByRole('button', { name: /update|resolve|reject|submit/i })).not.toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/issues', expect.objectContaining({ params: expect.objectContaining({ status: '' }) })));
  });
});
