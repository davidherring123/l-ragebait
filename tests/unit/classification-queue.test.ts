import { describe, expect, it, vi } from 'vitest';

import { ClassificationQueue } from '../../src/application/classification-queue';

async function delay(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

describe('ClassificationQueue', () => {
  it('limits concurrent work', async () => {
    let active = 0;
    let maximumActive = 0;
    const queue = new ClassificationQueue(2, vi.fn());
    const task = async (): Promise<void> => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await delay(10);
      active -= 1;
    };

    queue.enqueue(task);
    queue.enqueue(task);
    queue.enqueue(task);
    await delay(50);

    expect(maximumActive).toBe(2);
    expect(queue.size).toBe(0);
  });

  it('reports task failures and continues processing', async () => {
    const onError = vi.fn<(error: unknown) => void>();
    const completed = vi.fn();
    const queue = new ClassificationQueue(1, onError);
    queue.enqueue(async () => {
      await Promise.resolve();
      throw new Error('failure');
    });
    queue.enqueue(async () => {
      completed();
      await Promise.resolve();
    });
    await delay(20);

    expect(onError).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledOnce();
  });
});
