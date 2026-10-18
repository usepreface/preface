import { Schema, Struct } from "effect";

import {
  CreateOidcConnectionInput,
  CreateSamlConnectionInput,
  UpdateOidcConnectionInput,
  UpdateSamlConnectionInput,
} from "@usepreface/protocol/input";

import { toFormSchema } from "#/lib/forms/schema";

const idp = UpdateSamlConnectionInput.fields.idp.schema;

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

export const createConnectionForm = toFormSchema(
  Schema.Union([
    CreateOidcConnectionInput.mapFields((fields) => ({
      protocol: Schema.Literal("oidc"),
      ...fields,
    })),
    CreateSamlConnectionInput.mapFields((fields) => ({
      protocol: Schema.Literal("saml"),
      ...fields,
    })),
  ]),
);
