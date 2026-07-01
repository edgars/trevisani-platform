// Descobre em qual região Supavisor está o projeto Supabase.
// Uso: node scripts/find-supabase-region.mjs <project-ref> <password>
import net from "node:net";
import tls from "node:tls";

const projectRef = process.argv[2];
const password = process.argv[3];
if (!projectRef || !password) {
  console.error("Uso: node scripts/find-supabase-region.mjs <project-ref> <password>");
  process.exit(2);
}

const BASE_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "sa-east-1",
  "eu-central-1",
  "eu-central-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "ca-central-1",
];

// Testa aws-0-*, aws-1-* e ambos prefixos completos.
const REGIONS = [];
for (const r of BASE_REGIONS) REGIONS.push(`aws0:aws-0-${r}.pooler.supabase.com`);
for (const r of BASE_REGIONS) REGIONS.push(`aws1:aws-1-${r}.pooler.supabase.com`);

function encodeStartup(user, database) {
  // PostgreSQL StartupMessage
  const params = { user, database, client_encoding: "UTF8" };
  const kv = Object.entries(params).flatMap(([k, v]) => [k, v]).join("\0") + "\0\0";
  const len = 4 + 4 + Buffer.byteLength(kv);
  const buf = Buffer.alloc(len);
  buf.writeUInt32BE(len, 0);
  buf.writeUInt32BE(196608, 4); // protocol version 3.0
  buf.write(kv, 8, "utf8");
  return buf;
}

function encodeSSLRequest() {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(8, 0);
  buf.writeUInt32BE(80877103, 4); // SSLRequest magic
  return buf;
}

function testRegion(region) {
  return new Promise((resolve) => {
    const host = region.includes(":") ? region.split(":")[1] : `aws-0-${region}.pooler.supabase.com`;
    const label = region.includes(":") ? region.split(":")[1] : `aws-0-${region}`;
    const port = 5432;
    const user = `postgres.${projectRef}`;
    const socket = net.connect({ host, port, family: 4 });
    let timer = setTimeout(() => {
      socket.destroy();
      resolve({ region, result: "timeout" });
    }, 6000);

    socket.on("error", (e) => {
      clearTimeout(timer);
      resolve({ region, result: `net-error: ${e.code || e.message}` });
    });

    socket.once("connect", () => {
      socket.write(encodeSSLRequest());
    });

    let sslResponded = false;
    socket.on("data", (data) => {
      if (!sslResponded) {
        sslResponded = true;
        if (data[0] === 0x53) {
          // 'S' = server supports SSL, upgrade
          const tlsSocket = tls.connect({ socket, servername: host, rejectUnauthorized: false }, () => {
            tlsSocket.write(encodeStartup(user, "postgres"));
          });
          tlsSocket.setTimeout(6000);
          tlsSocket.on("timeout", () => {
            tlsSocket.destroy();
            clearTimeout(timer);
            resolve({ region, result: "tls-timeout" });
          });
          tlsSocket.on("error", (e) => {
            clearTimeout(timer);
            resolve({ region, result: `tls-error: ${e.code || e.message}` });
          });
          tlsSocket.on("data", (chunk) => {
            const type = String.fromCharCode(chunk[0]);
            if (type === "R") {
              clearTimeout(timer);
              tlsSocket.destroy();
              resolve({ region, result: "auth-request", host });
            } else if (type === "E") {
              const msg = chunk.slice(5).toString("utf8");
              clearTimeout(timer);
              tlsSocket.destroy();
              const notFound = msg.includes("tenant") || msg.includes("not found");
              resolve({ region, result: notFound ? "tenant-not-found" : "error", detail: msg });
            }
          });
        } else {
          clearTimeout(timer);
          socket.destroy();
          resolve({ region, result: "ssl-refused" });
        }
      }
    });
  });
}

console.log(`Procurando região do projeto ${projectRef}...\n`);
for (const region of REGIONS) {
  const label = region.split(":")[1];
  process.stdout.write(`  ${label.padEnd(40)} `);
  const r = await testRegion(region);
  if (r.result === "auth-request") {
    console.log(`✓ ENCONTRADO`);
    console.log(`\nHost: ${r.host}`);
    console.log("\nUse na .env.local:");
    console.log(`DATABASE_URL="postgresql://postgres.${projectRef}:${password}@${r.host}:6543/postgres?pgbouncer=true&connection_limit=1"`);
    console.log(`DIRECT_URL="postgresql://postgres.${projectRef}:${password}@${r.host}:5432/postgres"`);
    process.exit(0);
  }
  console.log(r.result);
}
console.log("\nRegião não encontrada. Verifique o project-ref.");
process.exit(1);
