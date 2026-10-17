import { IdentityError } from "@usepreface/protocol";
import { DOMParser, type Element } from "@xmldom/xmldom";

export const samlNamespace = "urn:oasis:names:tc:SAML:2.0:assertion";
export const samlProtocolNamespace = "urn:oasis:names:tc:SAML:2.0:protocol";
const signatureNamespace = "http://www.w3.org/2000/09/xmldsig#";

export const parseSamlXml = (xml: string, localName: string, namespace: string) => {
  if (Buffer.byteLength(xml, "utf8") > 128 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new IdentityError({ code: "INVALID_FLOW" });
  const document = new DOMParser({
    onError: () => {
      throw new IdentityError({ code: "INVALID_FLOW" });
    },
  }).parseFromString(xml, "application/xml");
  const root = document.documentElement;
  if (!root || root.localName !== localName || root.namespaceURI !== namespace)
    throw new IdentityError({ code: "INVALID_FLOW" });
  return root;
};
export const children = (parent: Element, localName: string, namespace = samlNamespace) =>
  Array.from(parent.childNodes).filter(
    (node): node is Element =>
      node.nodeType === 1 && node.localName === localName && node.namespaceURI === namespace,
  );

export const oneChild = (parent: Element, localName: string, namespace = samlNamespace) => {
  const found = children(parent, localName, namespace);
  if (found.length !== 1 || !found[0]) throw new IdentityError({ code: "INVALID_FLOW" });
  return found[0];
};
export const attribute = (element: Element, name: string) => {
  const value = element.getAttribute(name);
  if (!value || value.length > 4096) throw new IdentityError({ code: "INVALID_FLOW" });
  return value;
};
export const scalarText = (element: Element) => {
  if (Array.from(element.childNodes).some((node) => node.nodeType !== 3 && node.nodeType !== 4))
    throw new IdentityError({ code: "INVALID_FLOW" });
  const value = element.textContent;
  if (!value || value.length > 4096) throw new IdentityError({ code: "INVALID_FLOW" });
  return value;
};

// Signature verification belongs to Node-SAML. Bound the accepted algorithm/profile before it parses.
export const validateSamlEnvelope = (
  xml: string,
  requestId: string,
  callbackUrl: string,
  issuer: string,
) => {
  const root = parseSamlXml(xml, "Response", samlProtocolNamespace);
  if (
    attribute(root, "Destination") !== callbackUrl ||
    attribute(root, "InResponseTo") !== requestId ||
    scalarText(oneChild(root, "Issuer")) !== issuer
  )
    throw new IdentityError({ code: "INVALID_FLOW" });
  const status = oneChild(root, "Status", samlProtocolNamespace);
  if (
    attribute(oneChild(status, "StatusCode", samlProtocolNamespace), "Value") !==
    "urn:oasis:names:tc:SAML:2.0:status:Success"
  )
    throw new IdentityError({ code: "INVALID_FLOW" });
  if (children(root, "Assertion").length !== 1 || children(root, "EncryptedAssertion").length !== 0)
    throw new IdentityError({ code: "INVALID_FLOW" });
  const methods = Array.from(root.getElementsByTagNameNS(signatureNamespace, "SignatureMethod"));
  const digests = Array.from(root.getElementsByTagNameNS(signatureNamespace, "DigestMethod"));
  if (
    methods.length !== 2 ||
    digests.length !== 2 ||
    methods.some(
      (method) =>
        ![
          "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
          "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512",
        ].includes(attribute(method, "Algorithm")),
    ) ||
    digests.some(
      (digest) =>
        ![
          "http://www.w3.org/2001/04/xmlenc#sha256",
          "http://www.w3.org/2001/04/xmlenc#sha512",
        ].includes(attribute(digest, "Algorithm")),
    )
  )
    throw new IdentityError({ code: "INVALID_FLOW" });
  return root;
};
