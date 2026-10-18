import { randomBytes } from "node:crypto";

import { expect } from "@playwright/test";

import type { Infrastructure } from "./infrastructure.js";

export async function createRealm(infra: Infrastructure, realm: string) {
  const tokenResponse = await infra.control.post(
    `${infra.idpOrigin}/realms/master/protocol/openid-connect/token`,
    {
      form: {
        client_id: "admin-cli",
        grant_type: "password",
        username: "preface_test",
        password: infra.adminPassword,
      },
    },
  );
  expect(tokenResponse.ok(), await tokenResponse.text()).toBe(true);
  const { access_token: accessToken } = await tokenResponse.json();
  const headers = { authorization: `Bearer ${accessToken}` };
  const realmUrl = `${infra.idpOrigin}/admin/realms/${realm}`;
  const password = randomBytes(24).toString("hex");
  const clientSecret = randomBytes(24).toString("hex");
  const realmCreated = await infra.control.post(`${infra.idpOrigin}/admin/realms`, {
    headers,
    data: { realm, enabled: true, sslRequired: "all", registrationAllowed: false },
  });
  expect(realmCreated.status(), await realmCreated.text()).toBe(201);
  return {
    issuer: `${infra.idpOrigin}/realms/${realm}`,
    password,
    clientSecret,
    async user(username: string, email: string) {
      const response = await infra.control.post(`${realmUrl}/users`, {
        headers,
        data: {
          username,
          email,
          firstName: username,
          lastName: "Fixture",
          emailVerified: true,
          enabled: true,
          credentials: [{ type: "password", value: password, temporary: false }],
        },
      });
      expect(response.status(), await response.text()).toBe(201);
    },
    async oidc(callbackUrl: string) {
      const response = await infra.control.post(`${realmUrl}/clients`, {
        headers,
        data: {
          clientId: "preface-oidc",
          enabled: true,
          protocol: "openid-connect",
          publicClient: false,
          secret: clientSecret,
          standardFlowEnabled: true,
          redirectUris: [callbackUrl],
          attributes: { "pkce.code.challenge.method": "S256" },
        },
      });
      expect(response.status(), await response.text()).toBe(201);
    },
    async saml(configuration: {
      entityId: string;
      callbackUrl: string;
      signingCertificate: string;
    }) {
      const client = {
        clientId: configuration.entityId,
        enabled: true,
        protocol: "saml",
        redirectUris: [configuration.callbackUrl],
        attributes: {
          "saml.server.signature": "true",
          "saml.assertion.signature": "true",
          "saml.client.signature": "true",
          "saml.signature.algorithm": "RSA_SHA256",
          saml_name_id_format: "persistent",
          saml_force_name_id_format: "true",
          "saml.authnstatement": "true",
          "saml.force.post.binding": "true",
          "saml.signing.certificate": configuration.signingCertificate
            .replace(/-----[^-]+-----/g, "")
            .replace(/\s/g, ""),
          saml_assertion_consumer_url_post: configuration.callbackUrl,
        },
        protocolMappers: [
          {
            name: "email",
            protocol: "saml",
            protocolMapper: "saml-user-property-mapper",
            config: {
              "user.attribute": "email",
              "attribute.name": "email",
              "attribute.nameformat": "Basic",
            },
          },
        ],
      };
      const created = await infra.control.post(`${realmUrl}/clients`, { headers, data: client });
      expect(created.status(), await created.text()).toBe(201);
      const clientId = created.headers().location?.split("/").at(-1);
      if (clientId === undefined) throw new Error("Missing Keycloak client ID");
      const metadata = await infra.control.get(
        `${infra.idpOrigin}/realms/${realm}/protocol/saml/descriptor`,
      );
      const idpCertificate = (await metadata.text()).match(
        /<(?:\w+:)?X509Certificate[^>]*>([^<]+)<\//,
      )?.[1];
      if (idpCertificate === undefined) throw new Error("Missing IdP signing certificate");
      return {
        certificate: `-----BEGIN CERTIFICATE-----\n${idpCertificate}\n-----END CERTIFICATE-----`,
        async importSigningCertificate(certificate: string) {
          client.attributes["saml.signing.certificate"] = certificate
            .replace(/-----[^-]+-----/g, "")
            .replace(/\s/g, "");
          const updated = await infra.control.put(`${realmUrl}/clients/${clientId}`, {
            headers,
            data: client,
          });
          expect(updated.status(), await updated.text()).toBe(204);
        },
      };
    },
    async disableSignIn(authorizationUrl: string) {
      const updated = await infra.control.put(realmUrl, { headers, data: { enabled: false } });
      expect(updated.status(), await updated.text()).toBe(204);
      const disabled = await infra.control.get(realmUrl, { headers });
      expect(await disabled.json()).toMatchObject({ enabled: false });
      const authorization = await infra.control.get(authorizationUrl, { maxRedirects: 0 });
      expect(authorization.status()).toBe(400);
    },
    async close() {
      const deleted = await infra.control.delete(realmUrl, { headers });
      expect(deleted.status(), await deleted.text()).toBe(204);
    },
  };
}
export type Realm = Awaited<ReturnType<typeof createRealm>>;
