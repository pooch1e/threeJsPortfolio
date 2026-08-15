import { describe, it, expect, beforeEach } from 'vitest';
import { userLoginStore } from './user';

const initialState = {
  userId: '',
  username: '',
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
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

  it('setIsAdmin sets isAdmin', () => {
    userLoginStore.getState().setIsAdmin(true);
    expect(userLoginStore.getState().isAdmin).toBe(true);
  });

  it('setIsAdmin coerces truthy/falsy values to booleans', () => {
    userLoginStore.getState().setIsAdmin(1);
    expect(userLoginStore.getState().isAdmin).toBe(true);
    userLoginStore.getState().setIsAdmin(undefined);
    expect(userLoginStore.getState().isAdmin).toBe(false);
  });

  it('logout resets isAdmin', () => {
    userLoginStore.getState().setIsAdmin(true);
    userLoginStore.getState().logout();
    expect(userLoginStore.getState().isAdmin).toBe(false);
  });

  it('setUserId sets userId', () => {
    userLoginStore.getState().setUserId('user-123');
    expect(userLoginStore.getState().userId).toBe('user-123');
  });

  it('setUserId with falsy value stores an empty string', () => {
    userLoginStore.getState().setUserId('user-123');
    userLoginStore.getState().setUserId(undefined);
    expect(userLoginStore.getState().userId).toBe('');
  });

  it('logout resets userId', () => {
    userLoginStore.getState().setUserId('user-123');
    userLoginStore.getState().logout();
    expect(userLoginStore.getState().userId).toBe('');
  });
});
