import { describe, expect, it } from 'vitest';
import { formatAuditAction, getActionColor } from './helpers';

describe('formatAuditAction', () => {
  it('should format "subscription.upgraded" → "Subscription: Upgraded"', () => {
    expect(formatAuditAction('subscription.upgraded')).toBe('Subscription: Upgraded');
  });

  it('should format "api_key.created" → "Api Key: Created"', () => {
    expect(formatAuditAction('api_key.created')).toBe('Api Key: Created');
  });

  it('should format "user.deleted" → "User: Deleted"', () => {
    expect(formatAuditAction('user.deleted')).toBe('User: Deleted');
  });

  it('should capitalize single word action', () => {
    expect(formatAuditAction('login')).toBe('Login');
  });
});

describe('getActionColor', () => {
  it('should return green for creation actions', () => {
    expect(getActionColor('subscription.created')).toBe('bg-green-100 text-green-700');
    expect(getActionColor('api_key.created')).toBe('bg-green-100 text-green-700');
    expect(getActionColor('user.registered')).toBe('bg-green-100 text-green-700');
  });

  it('should return red for removal/revoke actions', () => {
    expect(getActionColor('api_key.revoked')).toBe('bg-red-100 text-red-700');
    expect(getActionColor('user.deleted')).toBe('bg-red-100 text-red-700');
    expect(getActionColor('subscription.cancelled')).toBe('bg-red-100 text-red-700');
  });

  it('should return yellow for update/upgrade actions', () => {
    expect(getActionColor('subscription.upgraded')).toBe('bg-yellow-100 text-yellow-700');
    expect(getActionColor('user.updated')).toBe('bg-yellow-100 text-yellow-700');
    expect(getActionColor('profile.edited')).toBe('bg-yellow-100 text-yellow-700');
  });

  it('should return gray for other actions', () => {
    expect(getActionColor('other.action')).toBe('bg-gray-100 text-gray-700');
    expect(getActionColor('something.else')).toBe('bg-gray-100 text-gray-700');
  });
});
