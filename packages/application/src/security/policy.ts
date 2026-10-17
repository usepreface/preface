import { Duration } from "effect";

export const bootstrapTokenLifetime = Duration.minutes(30);
export const sessionLifetime = Duration.days(30);
export const sessionIdleTimeout = Duration.days(7);
export const sessionActivityInterval = Duration.minutes(5);
