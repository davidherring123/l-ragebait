export type QueueTask = () => Promise<void>;

export class ClassificationQueue {
  readonly #pending: QueueTask[] = [];
  readonly #concurrency: number;
  readonly #onError: (error: unknown) => void;
  #active = 0;

  public constructor(concurrency: number, onError: (error: unknown) => void) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new RangeError('Concurrency must be a positive integer.');
    }
    this.#concurrency = concurrency;
    this.#onError = onError;
  }

  public enqueue(task: QueueTask): void {
    this.#pending.push(task);
    this.#drain();
  }

  public get size(): number {
    return this.#pending.length + this.#active;
  }

  #drain(): void {
    while (this.#active < this.#concurrency) {
      const task = this.#pending.shift();
      if (task === undefined) {
        return;
      }

      this.#active += 1;
      void task().then(
        () => {
          this.#complete();
        },
        (error: unknown) => {
          this.#onError(error);
          this.#complete();
        },
      );
    }
  }

  #complete(): void {
    this.#active -= 1;
    this.#drain();
  }
}
