export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-calm-800">Telepsicología</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Conecta con psicólogos certificados desde tu dispositivo
        </h1>
      </header>

      <section
        className="rounded-lg border border-calm-100 bg-white p-4 text-sm leading-relaxed text-calm-800"
        aria-labelledby="orientativo-heading"
      >
        <h2 id="orientativo-heading" className="mb-2 text-base font-medium text-calm-900">
          Sobre la autoevaluación
        </h2>
        <p>
          Cuando esté disponible, la autoevaluación guiada tendrá un resultado{" "}
          <strong className="font-medium">orientativo</strong>: no es un diagnóstico clínico y
          solo ayudará a sugerir un perfil profesional adecuado.
        </p>
      </section>

      <p className="text-sm text-calm-800">
        Estamos preparando la plataforma. Los módulos de sesión, agenda y pagos se habilitarán por
        fases.
      </p>

      <nav className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-4" aria-label="Acceso">
        <a className="font-medium text-calm-800 underline" href="/registro">
          Crear cuenta
        </a>
        <a className="font-medium text-calm-800 underline" href="/ingreso">
          Ingresar
        </a>
        <a className="font-medium text-calm-800 underline" href="/autoevaluacion">
          Autoevaluación orientativa
        </a>
      </nav>
    </main>
  );
}