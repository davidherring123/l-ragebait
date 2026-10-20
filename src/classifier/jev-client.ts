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
    inflammatory: jevNoulSchema,
    sensationalized: jevNoulSchema,
    custom: jevNoulSchema.optional(),
  }),
});

const MODEL = 'jev-1.13.0';
export const CLASSIFIER_POLICY_VERSION = 'jev-1.13.0-policy-2';

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
          'Is this content deliberately manufactured to provoke anger or outrage primarily to farm engagement?',
        criteria: {
          true: 'Uses deliberate provocation, manipulative framing, or outrage farming as its primary presentation.',
          false: 'Neutral reporting, sincere humor, legitimate criticism, or ordinary disagreement even when the topic is negative.',
        },
      },
      inflammatory: {
        type: 'noul',
        instructions:
          'Is this a hostile, antagonistic discussion such as a political fight, gender war, or attack-driven social commentary?',
        criteria: {
          true: 'The presentation promotes hostility, contempt, dehumanization, or combative group conflict.',
          false: 'Civil disagreement, factual analysis, neutral news, or criticism focused on conduct and evidence.',
        },
      },
      sensationalized: {
        type: 'noul',
        instructions:
          'Does this exploit a crime, tragedy, death, or disturbing event through sensationalized commentary?',
        criteria: {
          true: 'The presentation exploits disturbing events for shock, spectacle, outrage, or engagement.',
          false: 'Straightforward reporting, safety information, respectful remembrance, or measured analysis.',
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
      inflammatory: parsed.answers.inflammatory.noul,
      sensationalized: parsed.answers.sensationalized.noul,
      custom: parsed.answers.custom?.noul ?? null,
    });
  }
}
