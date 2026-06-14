import { describe, it, expect, beforeEach } from 'vitest';
import { userLoginStore } from './user';

const initialState = {
  username: '',
  isAuthenticated: false,
  isLoading: true,
};

beforeEach(() => {
  userLoginStore.setState(initialState);
});

describe('userLoginStore', () => {
  it('has correct initial state', () => {
    const state = userLoginStore.getState();
    expect(state.username).toBe('');
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('setUsername sets username and marks authenticated', () => {
    userLoginStore.getState().setUsername('alice');
    const state = userLoginStore.getState();
    expect(state.username).toBe('alice');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUsername with empty string marks not authenticated', () => {
    userLoginStore.getState().setUsername('alice');
    userLoginStore.getState().setUsername('');
    const state = userLoginStore.getState();
    expect(state.username).toBe('');
    expect(state.isAuthenticated).toBe(false);
  });

  it('setLoaded sets isLoading to false', () => {
    userLoginStore.getState().setLoaded();
    expect(userLoginStore.getState().isLoading).toBe(false);
  });

  it('logout clears username and isAuthenticated', () => {
    userLoginStore.getState().setUsername('alice');
    userLoginStore.getState().logout();
    const state = userLoginStore.getState();
    expect(state.username).toBe('');
    expect(state.isAuthenticated).toBe(false);
  });

  it('logout does not change isLoading', () => {
    userLoginStore.getState().setLoaded();
    userLoginStore.getState().setUsername('alice');
    userLoginStore.getState().logout();
    expect(userLoginStore.getState().isLoading).toBe(false);
  });
});
