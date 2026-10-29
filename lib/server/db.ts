import "server-only";
import postgres from "postgres";
let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("Storage unavailable");
  return (connection ||= postgres(process.env.DATABASE_URL, {
    max: 3,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.DATABASE_CA_CERT_BASE64
        ? {
            ca: Buffer.from(
              process.env.DATABASE_CA_CERT_BASE64,
              "base64",
            ).toString("utf8"),
          }
        : {}),
    },
  }));
}
