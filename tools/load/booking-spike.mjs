#!/usr/bin/env node
/**
 * Prueba de carga básica (REQ-QA-01, Etapa 10 §6.3).
 * Simula lecturas concurrentes a rutas públicas (sin auth).
 *
 * Uso: node tools/load/booking-spike.mjs http://localhost:3000 50 200
 *       (baseUrl, concurrencia, total peticiones)
 */
const baseUrl = process.argv[2] ?? "http://localhost:3000";
const concurrency = Number(process.argv[3] ?? 20);
const total = Number(process.argv[4] ?? 100);

const paths = ["/", "/privacidad", "/ingreso", "/autoevaluacion"];

async function fetchPath(path) {
  const start = performance.now();
  const res = await fetch(`${baseUrl}${path}`);
  const ms = performance.now() - start;
  return { path, status: res.status, ms };
}

let completed = 0;
let errors = 0;
const latencies = [];

async function worker() {
  while (completed < total) {
    const i = completed++;
    if (i >= total) break;
    const path = paths[i % paths.length];
    try {
      const r = await fetchPath(path);
      latencies.push(r.ms);
      if (r.status >= 500) errors += 1;
    } catch {
      errors += 1;
    }
  }
}

const t0 = performance.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const elapsed = performance.now() - t0;

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
const avg = latencies.reduce((s, n) => s + n, 0) / (latencies.length || 1);

console.log(
  JSON.stringify(
    {
      baseUrl,
      concurrency,
      total,
      elapsedMs: Math.round(elapsed),
      errors,
      avgMs: Math.round(avg),
      p95Ms: Math.round(p95),
    },
    null,
    2,
  ),
);
