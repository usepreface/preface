import { fileURLToPath } from "node:url";

import { prepareDevelopmentEnvironment } from "./environment.ts";

await prepareDevelopmentEnvironment(fileURLToPath(new URL("../../", import.meta.url)));
process.stdout.write("Development defaults and Keycloak TLS are ready in .local/development.\n");
