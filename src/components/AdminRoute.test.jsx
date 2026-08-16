import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';

vi.mock('../store/user', () => ({
  userLoginStore: vi.fn(),
}));

import { userLoginStore } from '../store/user';

function renderWithRouter(storeState, { initialEntries = ['/admin'] } = {}) {
  userLoginStore.mockImplementation((selector) => selector(storeState));
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/homepage" element={<div>Homepage</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute', () => {
  it('shows loading overlay while session is validating', () => {
    renderWithRouter({ isLoading: true, isAuthenticated: false, isAdmin: false });
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('redirects to / when not authenticated', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: false, isAdmin: false });
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('redirects to /homepage when authenticated but not admin', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: true, isAdmin: false });
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    expect(screen.getByText('Homepage')).toBeInTheDocument();
  });

  it('renders children when authenticated and admin', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: true, isAdmin: true });
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
