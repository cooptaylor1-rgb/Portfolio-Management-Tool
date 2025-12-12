import { describe, expect, it } from 'vitest';

import {
  compareVersions,
  extractVersion,
  isVersionDeprecated,
  isVersionSupported,
  parseVersion,
  VERSION_CONFIG,
} from './versioning.js';

describe('versioning', () => {
  it('parses versions with and without v-prefix', () => {
    expect(parseVersion('2.0')).toEqual({ major: 2, minor: 0, patch: undefined });
    expect(parseVersion('v2.1')).toEqual({ major: 2, minor: 1, patch: undefined });
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('compares versions by major/minor/patch', () => {
    expect(compareVersions('1.0', '1.0')).toBe(0);
    expect(compareVersions('1.1', '1.0')).toBe(1);
    expect(compareVersions('1.0', '1.1')).toBe(-1);
    expect(compareVersions('2.0', '1.9')).toBe(1);
    expect(compareVersions('1.2.0', '1.2')).toBe(0);
    expect(compareVersions('1.2.1', '1.2.0')).toBe(1);
  });

  it('flags deprecated versions', () => {
    expect(isVersionDeprecated('1.0')).toBe(true);
    expect(isVersionDeprecated(VERSION_CONFIG.current)).toBe(false);
  });

  it('recognizes supported versions', () => {
    expect(isVersionSupported('2.0')).toBe(true);
    expect(isVersionSupported('2.1')).toBe(true);
    expect(isVersionSupported('9.9')).toBe(false);
  });

  it('extracts version from URL path, then Accept header, then custom header, then query, else defaults', () => {
    // URL path
    expect(
      extractVersion({
        url: '/api/v2/portfolios',
        headers: {},
        query: {},
      } as any)
    ).toBe('2');

    // Accept header vendor media type
    expect(
      extractVersion({
        url: '/api/portfolios',
        headers: { accept: 'application/vnd.portfolio.v2+json' },
        query: {},
      } as any)
    ).toBe('2');

    // Custom header
    expect(
      extractVersion({
        url: '/api/portfolios',
        headers: { 'x-api-version': '2.0' },
        query: {},
      } as any)
    ).toBe('2.0');

    // Query param
    expect(
      extractVersion({
        url: '/api/portfolios',
        headers: {},
        query: { 'api-version': '1.1' },
      } as any)
    ).toBe('1.1');

    // Default
    expect(
      extractVersion({
        url: '/api/portfolios',
        headers: {},
        query: {},
      } as any)
    ).toBe(VERSION_CONFIG.current);
  });
});
