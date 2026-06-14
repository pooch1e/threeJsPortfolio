import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicOnlyRoute from './PublicOnlyRoute';

vi.mock('../store/user', () => ({
  userLoginStore: vi.fn(),
}));

import { userLoginStore } from '../store/user';

function renderWithRouter(storeState, { initialEntries = ['/login'] } = {}) {
  userLoginStore.mockImplementation((selector) => selector(storeState));
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/homepage" element={<div>Homepage</div>} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>Login page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicOnlyRoute', () => {
  it('renders nothing while session is validating', () => {
    const { container } = renderWithRouter({ isLoading: true, isAuthenticated: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /homepage when already authenticated', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: true });
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.getByText('Homepage')).toBeInTheDocument();
  });

  it('renders children when not authenticated', () => {
    renderWithRouter({ isLoading: false, isAuthenticated: false });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
