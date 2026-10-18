import { randomBytes } from "node:crypto";

import { request } from "@playwright/test";
import { GenericContainer, Wait } from "testcontainers";

import { startPostgres } from "../../../tooling/testing/postgres.js";
import { createTestTls } from "./tls.js";

export async function startInfrastructure() {
  const resources = new AsyncDisposableStack();
  try {
    const tls = await createTestTls();
    resources.defer(tls.close);
    const postgres = await startPostgres();
    resources.defer(async () => {
      await postgres.stop();
    });
    const files = [
      { content: tls.cert, target: "/tmp/preface-cert.pem", mode: 0o644 },
      { content: tls.key, target: "/tmp/preface-key.pem", mode: 0o644 },
    ];
    const mailpit = await new GenericContainer("axllent/mailpit:v1.31.5")
      .withCopyContentToContainer(files)
      .withEnvironment({
        MP_SMTP_TLS_CERT: "/tmp/preface-cert.pem",
        MP_SMTP_TLS_KEY: "/tmp/preface-key.pem",
        MP_SMTP_REQUIRE_STARTTLS: "true",
      })
      .withExposedPorts(1025, 8025)
      .withWaitStrategy(Wait.forHttp("/livez", 8025))
      .withStartupTimeout(90_000)
      .start();
    resources.defer(async () => {
      await mailpit.stop();
    });
    const adminPassword = randomBytes(24).toString("hex");
    const keycloak = await new GenericContainer("quay.io/keycloak/keycloak:26.8.1")
      .withCopyContentToContainer(files)
      .withEnvironment({
        KC_BOOTSTRAP_ADMIN_USERNAME: "preface_test",
        KC_BOOTSTRAP_ADMIN_PASSWORD: adminPassword,
        KC_HOSTNAME_STRICT: "false",
        JAVA_OPTS_KC_HEAP: "-Xms256m -Xmx768m",
      })
      .withCommand([
        "start-dev",
        "--https-certificate-file=/tmp/preface-cert.pem",
        "--https-certificate-key-file=/tmp/preface-key.pem",
      ])
      .withExposedPorts(8443)
      .withWaitStrategy(
        Wait.forHttp("/realms/master/.well-known/openid-configuration", 8443)
          .usingTls()
          .allowInsecure(),
      )
      .withStartupTimeout(120_000)
      .start();
    resources.defer(async () => {
      await keycloak.stop();
    });
    // Controller trusts only disposable services; the backend uses NODE_EXTRA_CA_CERTS.
    const control = await request.newContext({ ignoreHTTPSErrors: true });
    resources.defer(() => control.dispose());
    return {
      tls,
      postgres,
      mailpit,
      keycloak,
      control,
      adminPassword,
      idpOrigin: `https://127.0.0.1:${keycloak.getMappedPort(8443)}`,
      mailOrigin: `http://127.0.0.1:${mailpit.getMappedPort(8025)}`,
      close: () => resources.disposeAsync(),
    };
  } catch (error) {
    await resources.disposeAsync();
    throw error;
  }
}
export type Infrastructure = Awaited<ReturnType<typeof startInfrastructure>>;
