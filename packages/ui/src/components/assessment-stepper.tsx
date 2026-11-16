import { cn } from "../lib/cn";

const LABELS = ["Inicio", "Motivo", "Síntomas", "Contexto", "Objetivos", "Cierre"];

export function AssessmentStepper({
  currentIndex,
  className,
}: {
  currentIndex: number;
  className?: string;
}) {
  return (
    <nav aria-label="Progreso de la autoevaluación" className={cn("w-full", className)}>
      <ol className="flex gap-1">
        {LABELS.map((label, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          return (
            <li key={label} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  done && "bg-calm-800",
                  active && "bg-calm-800/70",
                  !done && !active && "bg-calm-100",
                )}
                title={label}
              />
              <span className="sr-only">
                {label} {active ? "(paso actual)" : done ? "(completado)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-calm-800">
        Paso {currentIndex + 1} de {LABELS.length}
      </p>
    </nav>
  );
}