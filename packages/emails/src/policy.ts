import { Duration } from "effect";

export const emailPolicy = {
  requestTimeout: Duration.seconds(10),
  leaseDuration: Duration.seconds(30),
  pollInterval: Duration.seconds(2),
  maximumAttempts: 5,
  replayWindow: Duration.hours(1),
} as const;

export const emailRetryDelay = (attempt: number) =>
  Duration.seconds(Math.min(5 * 2 ** (attempt - 1), 300));
