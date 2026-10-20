import { describe, expect, it } from 'vitest';

import { JevClient } from '../../src/classifier/jev-client';

describe('JevClient', () => {
  it('asks all categories in one request and validates scores', async () => {
    let requestBody: unknown;
    const fetchImplementation = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      await Promise.resolve();
      if (typeof init?.body !== 'string') {
        throw new Error('Expected a JSON request body.');
      }
      requestBody = JSON.parse(init.body) as unknown;
      return new Response(JSON.stringify({
        model: 'jev-1.13.0',
        answers: {
          ragebait: { type: 'noul', noul: 0.91 },
          custom: { type: 'noul', noul: 0.88 },
        },
      }));
    };
    const client = new JevClient(fetchImplementation);

    await expect(client.classify(
      'Example content long enough to classify.',
      'secret',
      'This content starts hostile arguments about games.',
    )).resolves.toEqual({
      ragebait: 0.91,
      custom: 0.88,
    });
    expect(requestBody).toMatchObject({
      questions: {
        ragebait: { type: 'noul' },
        custom: {
          type: 'noul',
          instructions: {
            user_defined_condition: 'This content starts hostile arguments about games.',
          },
        },
      },
    });
  });

  it('rejects malformed provider responses', async () => {
    const fetchImplementation = async (): Promise<Response> => {
      await Promise.resolve();
      return new Response(JSON.stringify({ nope: true }));
    };
    const client = new JevClient(fetchImplementation);

    await expect(client.classify('Example content long enough to classify.', 'secret', undefined)).rejects.toThrow();
  });

  it('rejects unsuccessful API responses', async () => {
    const fetchImplementation = async (): Promise<Response> => {
      await Promise.resolve();
      return new Response('', { status: 503 });
    };
    const client = new JevClient(fetchImplementation);

    await expect(client.classify('Example content long enough to classify.', 'secret', undefined)).rejects.toThrow('503');
  });
});
