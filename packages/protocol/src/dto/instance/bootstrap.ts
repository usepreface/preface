import { Schema } from "effect";

import { BootstrapPasswordValue } from "#/values/bootstrap";
import { InstanceDisplayName } from "#/values/instance";
import { SecretTokenFromString } from "#/values/secret-token";

// A client must encode credentials for transmission. Server-side input remains non-encodable.
export const CompleteBootstrapRequest = Schema.Struct({
  token: Schema.toEncoded(SecretTokenFromString).annotate({
    writeOnly: true,
    description: "Current one-time setup proof.",
  }),
  password: BootstrapPasswordValue.annotate({
    writeOnly: true,
    format: "password",
    description: "15–128 UTF-16 code units; preserved exactly.",
  }),
  instanceName: Schema.String.annotate({
    description: "Instance display name; trimmed to 1–120 characters.",
  }),
  ownerName: Schema.String.annotate({
    description: "First owner's display name; trimmed to 1–120 characters.",
  }),
  email: Schema.String.annotate({
    description: "Account email; trimmed and lowercased on the server.",
  }),
}).annotate({ identifier: "CompleteBootstrapRequest" });
export type CompleteBootstrapRequest = typeof CompleteBootstrapRequest.Type;

export const InspectBootstrapRequest = Schema.Struct({
  token: Schema.toEncoded(SecretTokenFromString).annotate({
    writeOnly: true,
    description: "Setup proof to inspect without consuming it.",
  }),
}).annotate({ identifier: "InspectBootstrapRequest" });
export type InspectBootstrapRequest = typeof InspectBootstrapRequest.Type;

export const BootstrapStatus = Schema.Struct({
  state: Schema.Literals(["setup_required", "ready"]),
  instanceName: InstanceDisplayName,
});
export type BootstrapStatus = typeof BootstrapStatus.Type;

export const BootstrapTokenInfo = Schema.Struct({ expiresAt: Schema.DateTimeUtcFromString });
export type BootstrapTokenInfo = typeof BootstrapTokenInfo.Type;
