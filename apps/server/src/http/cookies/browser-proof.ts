import { credentialCookie } from "#/http/cookies/credential";

export const googleFlowCookie = credentialCookie("preface_google_flow");
export const oidcFlowCookie = credentialCookie("preface_oidc_flow");
export const samlFlowCookie = credentialCookie("preface_saml_flow");

export const externalFlowCookie = credentialCookie("preface_external_flow");
