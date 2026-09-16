import { describe, expect, it } from 'vitest';
import { failure, readBody } from '../src/app/api/_shared';
import { DomainError, patchSchema } from '../src/lib/validation';

describe('API request boundaries', () => {
  it('uses the validated browser host when the framework reconstructs a localhost URL', async () => {
    const request = new Request('http://localhost:3100/api/cases', {
      method: 'POST',
      headers: { host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100' },
      body: '{}',
    });
    expect(await readBody(request)).toEqual({});
    await expect(
      readBody(
        new Request('http://localhost:3100/api/cases', {
          method: 'POST',
          headers: { host: 'attacker.example', origin: 'http://attacker.example' },
          body: '{}',
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('accepts same-origin loopback requests and non-browser local API clients', async () => {
    const request = new Request('http://127.0.0.1:3000/api/cases', {
      method: 'POST',
      headers: { origin: 'http://127.0.0.1:3000' },
      body: '{"scenarioId":"demo"}',
    });
    expect(await readBody(request)).toEqual({ scenarioId: 'demo' });
    expect(
      await readBody(
        new Request('http://localhost:3000/api/cases', { method: 'POST', body: '{}' }),
      ),
    ).toEqual({});
  });
  it('rejects writes originating from an unrelated website', async () => {
    const request = new Request('http://127.0.0.1:3000/api/cases', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
      body: '{}',
    });
    await expect(readBody(request)).rejects.toMatchObject({ status: 403 });
  });
  it('rejects non-loopback hosts and opaque origins', async () => {
    await expect(
      readBody(new Request('http://public.example/api', { method: 'POST', body: '{}' })),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      readBody(
        new Request('http://localhost/api', {
          method: 'POST',
          headers: { origin: 'null' },
          body: '{}',
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('rejects malformed and oversized JSON', async () => {
    await expect(
      readBody(new Request('http://localhost/api', { method: 'POST', body: 'not-json' })),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readBody(
        new Request('http://localhost/api', { method: 'POST', body: 'x'.repeat(1_000_001) }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it('does not accept session state or immutable records through the draft patch contract', () => {
    expect(
      patchSchema.safeParse({ version: 1, phase: 'portfolio', published: true, adrs: [] }).success,
    ).toBe(false);
  });
  it('preserves domain error status for actionable conflicts', async () => {
    const response = failure(new DomainError('Reload the latest case.', 409));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Reload the latest case.' });
  });
});
