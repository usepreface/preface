import { Schema, Struct } from "effect";

import {
  CreateSamlConnectionInput,
  UpdateOidcConnectionInput,
  UpdateSamlConnectionInput,
} from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

const idp = UpdateSamlConnectionInput.fields.idp.schema;

/** SSO connections → Add: the protocol and a name; the rest is configured on the next page. */
export const addConnectionForm = toFormSchema(
  CreateSamlConnectionInput.mapFields((fields) => ({
    protocol: Schema.Literals(["oidc", "saml"]),
    ...fields,
  })),
  { required: { name: "Name the connection." } },
);

/**
 * An OIDC connection's settings. Leaving the secret empty keeps the saved one; the revision
 * comes from the loaded connection, not the form.
 */
export const oidcConnectionForm = toFormSchema(
  UpdateOidcConnectionInput.mapFields(Struct.omit(["expectedRevision"])),
  {
    required: {
      name: "Name the connection.",
      issuer: "Paste the issuer URL.",
      clientId: "Paste the client ID.",
    },
    format: { issuer: "Use the https:// issuer URL, without a query string." },
  },
);

/** A SAML connection's identity provider settings. */
export const samlConnectionForm = toFormSchema(
  Schema.Struct({ name: UpdateSamlConnectionInput.fields.name.schema, idp }),
  {
    required: {
      name: "Name the connection.",
      "idp.entityId": "Paste the IdP entity ID.",
      "idp.signOnUrl": "Paste the sign-on URL.",
      "idp.signingCertificates": "Add at least one signing certificate.",
    },
    format: {
      "idp.entityId": "Use an https://, http:// or urn: identifier.",
      "idp.signOnUrl": "Use an https:// URL without a query string.",
    },
  },
);

/** SAML → Add signing certificate: one PEM certificate. */
export const samlCertificateForm = toFormSchema(
  Schema.Struct({ certificate: idp.fields.signingCertificates.value }),
  { required: { certificate: "Paste the certificate, including the BEGIN and END lines." } },
);
