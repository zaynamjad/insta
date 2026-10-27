import { ProviderError } from "./provider";

/** Distinguishes "we chose not to call" from "the provider failed", so it never trips a circuit breaker. */
export class CallBudgetError extends ProviderError {
  constructor(label: string, max: number) {
    super(`${label} call budget for this request is used up.`, "RATE_LIMITED", `max=${max}`, true);
    this.name = "CallBudgetError";
  }
}

/**
 * Caps how many paid HTTP calls one visitor request may make to a provider.
 * One budget is created per lookup and handed to the provider client, so
 * key rotation, fallback chains and multi-step operations (profile → stories)
 * can never fan out into an unbounded number of billed calls.
 *
 * Exhaustion throws a *retryable* `RATE_LIMITED` error: the router may still
 * serve the request from a different provider, but this one is not called
 * again within the same visitor request.
 */
export class CallBudget {
  private used = 0;

  constructor(
    private readonly max: number,
    private readonly label = "provider",
  ) {}

  /** Reserves one HTTP call, or throws if the request's allowance is spent. */
  take(): void {
    if (this.used >= this.max) {
      throw new CallBudgetError(this.label, this.max);
    }
    this.used += 1;
  }

  get callsUsed(): number {
    return this.used;
  }
}
