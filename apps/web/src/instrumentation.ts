/**
 * Validación de entorno al arrancar el servidor (REQ-INFRA-04).
 */
export async function register() {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const { getServerEnv } = await import("./env.server");
    getServerEnv();
  }
}