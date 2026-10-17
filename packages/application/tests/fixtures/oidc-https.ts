import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getCACertificates, setDefaultCACertificates } from "node:tls";

import { Effect } from "effect";

// A disposable HTTPS issuer exercises the real outbound transport, including TLS verification.
export const acquireOidcHttps = Effect.acquireRelease(
  Effect.promise(async () => {
    const directory = await mkdtemp(join(tmpdir(), "preface-oidc-"));
    const originalCertificates = getCACertificates("default");
    try {
      execFileSync(
        "openssl",
        [
          "req",
          "-x509",
          "-newkey",
          "rsa:2048",
          "-nodes",
          "-keyout",
          join(directory, "key.pem"),
          "-out",
          join(directory, "cert.pem"),
          "-days",
          "1",
          "-subj",
          "/CN=localhost",
          "-addext",
          "subjectAltName=IP:127.0.0.1,DNS:localhost",
        ],
        { stdio: "ignore" },
      );
      const certificate = await readFile(join(directory, "cert.pem"), "utf8");
      const key = await readFile(join(directory, "key.pem"));
      setDefaultCACertificates([...originalCertificates, certificate]);
      const requests: { readonly authorization: string | undefined; readonly body: string }[] = [];
      const server = createServer({ key, cert: certificate }, (request, response) => {
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          requests.push({
            authorization: request.headers.authorization,
            body: Buffer.concat(chunks).toString(),
          });
          if (request.url === "/redirect") {
            response.writeHead(302, { location: "https://127.0.0.1/private" });
            response.end();
            return;
          }
          if (request.url === "/oversized") {
            response.end("x".repeat(256 * 1024 + 1));
            return;
          }
          response.writeHead(200, { "content-type": "application/json" });
          response.end(JSON.stringify({ accepted: true }));
        });
      });
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const address = server.address();
      if (address === null || typeof address === "string") throw new Error("Expected HTTPS port");
      return {
        origin: `https://localhost:${address.port}`,
        requests,
        close: async () => {
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
          setDefaultCACertificates(originalCertificates);
          await rm(directory, { recursive: true, force: true });
        },
      };
    } catch (error) {
      setDefaultCACertificates(originalCertificates);
      await rm(directory, { recursive: true, force: true });
      throw error;
    }
  }),
  (issuer) => Effect.promise(issuer.close),
);
