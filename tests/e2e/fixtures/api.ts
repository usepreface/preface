import { Schema } from "effect";

import { expect, type BrowserContext } from "@playwright/test";

export class AuthApi {
  constructor(
    readonly context: BrowserContext,
    readonly origin: string,
    readonly dashboard: string,
  ) {}

  request(path: string, method = "GET", payload?: unknown) {
    return this.context.request.fetch(`${this.origin}/api/v1${path}`, {
      method,
      headers: { origin: this.dashboard },
      ...(payload === undefined ? {} : { data: payload }),
      maxRedirects: 0,
    });
  }

  async json<S extends Schema.Top>(
    schema: S,
    path: string,
    method = "GET",
    payload?: unknown,
    status = 200,
  ) {
    const response = await this.request(path, method, payload);
    expect(response.status(), `${method} ${path}: ${await response.text()}`).toBe(status);
    // Decoding must not hide unexpected fields, including accidentally exposed secrets.
    return Schema.decodeUnknownSync(Schema.toEncoded(schema), { onExcessProperty: "error" })(
      await response.json(),
    );
  }
}
