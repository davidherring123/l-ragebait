import { z } from 'zod';

import {
  ClassificationScoresSchema,
  type ClassificationScores,
} from '../domain/classification';

const jevNoulSchema = z.object({
  type: z.literal('noul'),
  noul: z.number().min(0).max(1),
});

const jevResponseSchema = z.object({
  model: z.string().min(1),
  answers: z.object({
    ragebait: jevNoulSchema,
    custom: jevNoulSchema.optional(),
  }),
});

const MODEL = 'jev-1.13.0';
export const CLASSIFIER_POLICY_VERSION = 'jev-1.13.0-policy-3';

export class JevClient {
  readonly #fetch: typeof fetch;

  public constructor(fetchImplementation?: typeof fetch) {
    this.#fetch = fetchImplementation === undefined
      ? async (input, init): Promise<Response> => {
          const response = await globalThis.fetch(input, init);
          return response;
        }
      : async (input, init): Promise<Response> => {
          const response = await fetchImplementation(input, init);
          return response;
        };
  }

  public async classify(
    text: string,
    apiKey: string,
    customRule: string | undefined,
  ): Promise<ClassificationScores> {
    const coreQuestions = {
      ragebait: {
        type: 'noul',
        instructions:
          'Is this ragebait or inflammatory content designed around provocation, hostility, outrage, feuding, or antagonistic social conflict to attract engagement?',
        criteria: {
          true: 'The primary presentation uses manipulative provocation, outrage farming, hostility, contempt, personal attacks, feuding, or combative group conflict.',
          false: 'Neutral reporting, sincere humor, factual analysis, civil disagreement, or evidence-based criticism even when the topic is negative.',
        },
      },
    } as const;
    const questions = customRule === undefined
      ? coreQuestions
      : {
          ...coreQuestions,
          custom: {
            type: 'noul',
            instructions: {
              user_defined_condition: customRule,
              question: 'Does the content clearly satisfy `user_defined_condition`?',
            },
          },
        } as const;
    const response = await this.#fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        state: text,
        questions,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Jev request failed with status ${response.status}.`);
    }

    const parsed = jevResponseSchema.parse(await response.json());
    return ClassificationScoresSchema.parse({
      ragebait: parsed.answers.ragebait.noul,
      custom: parsed.answers.custom?.noul ?? null,
    });
  }
}
