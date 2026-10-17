import { HttpApi, OpenApi } from "effect/http-api";

import { InstanceSetupApi } from "#/groups/instance-setup";
import { SessionApi } from "#/groups/session";

export class PrefaceApi extends HttpApi.make("PrefaceApi")
  .add(InstanceSetupApi, SessionApi)
  .prefix("/api/v1")
  .annotateMerge(
    OpenApi.annotations({
      title: "Preface API",
      version: "1.0.0",
      description: "Instance setup and cookie-authenticated sessions for self-hosted Preface.",
      license: { name: "Apache-2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
      servers: [{ url: "/", description: "This Preface installation" }],
    }),
  ) {}
