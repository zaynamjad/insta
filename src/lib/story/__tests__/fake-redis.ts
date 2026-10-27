/**
 * Minimal in-memory stand-in for the subset of the Upstash client the story
 * backend uses, so the shared cache, locks, circuit breaker and usage
 * metering are tested against real command semantics (NX, EX, INCR, hashes)
 * without a network. TTLs are honoured against `Date.now()`.
 */
export class FakeRedis {
  private data = new Map<string, { value: unknown; expiresAt: number | null }>();
  commands: string[] = [];

  private live(key: string) {
    const e = this.data.get(key);
    if (!e) return undefined;
    if (e.expiresAt !== null && Date.now() >= e.expiresAt) {
      this.data.delete(key);
      return undefined;
    }
    return e;
  }

  async get<T>(key: string): Promise<T | null> {
    this.commands.push(`get ${key}`);
    return (this.live(key)?.value as T) ?? null;
  }

  async set(key: string, value: unknown, opts?: { ex?: number; nx?: boolean }): Promise<"OK" | null> {
    this.commands.push(`set ${key}`);
    if (opts?.nx && this.live(key)) return null;
    this.data.set(key, { value, expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null });
    return "OK";
  }

  async del(key: string): Promise<number> {
    this.commands.push(`del ${key}`);
    return this.data.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.live(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const next = Number(this.live(key)?.value ?? 0) + 1;
    const prev = this.live(key);
    this.data.set(key, { value: next, expiresAt: prev?.expiresAt ?? null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const e = this.live(key);
    if (!e) return 0;
    e.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  private hash(key: string): Record<string, unknown> {
    const e = this.live(key);
    if (e) return e.value as Record<string, unknown>;
    const h: Record<string, unknown> = {};
    this.data.set(key, { value: h, expiresAt: null });
    return h;
  }

  async hincrby(key: string, field: string, by: number): Promise<number> {
    const h = this.hash(key);
    h[field] = Number(h[field] ?? 0) + by;
    return h[field] as number;
  }

  async hsetnx(key: string, field: string, value: unknown): Promise<number> {
    const h = this.hash(key);
    if (field in h) return 0;
    h[field] = value;
    return 1;
  }

  async hgetall<T>(key: string): Promise<T | null> {
    const e = this.live(key);
    return e ? ({ ...(e.value as object) } as T) : null;
  }

  pipeline() {
    const ops: (() => Promise<unknown>)[] = [];
    const p = {
      hincrby: (k: string, f: string, by: number) => (ops.push(() => this.hincrby(k, f, by)), p),
      exec: async <T>() => (await Promise.all(ops.map((op) => op()))) as T,
    };
    return p;
  }

  /** Test helper: reads a hash field directly. */
  field(key: string, field: string): unknown {
    return (this.live(key)?.value as Record<string, unknown> | undefined)?.[field];
  }

  keys(): string[] {
    return [...this.data.keys()];
  }
}
