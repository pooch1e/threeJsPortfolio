import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../store/user', () => ({
  userLoginStore: vi.fn(),
}));

import { userLoginStore } from '../store/user';

function renderWithRouter(storeState, { initialEntries = ['/protected'] } = {}) {
  userLoginStore.mockImplementation((selector) => selector(storeState));
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading overlay while session is validating', () => {
    renderWithRouter({ isLoading: true, isAuthenticated: false });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    // LoadingOverlay renders instead — children are blocked
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('redirects to / when not authenticated and not loading', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: false });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: true });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
