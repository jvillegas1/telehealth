import type { ReactNode } from "react";

import { Alert } from "./alert";
import { Button } from "./button";

export function EmptyProfessionalsState(props: {
  title?: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-calm-100 bg-white p-6">
      <h2 className="text-lg font-medium text-calm-900">
        {props.title ?? "No encontramos profesionales"}
      </h2>
      <Alert variant="info">{props.description}</Alert>
      <div className="flex flex-wrap gap-2">
        {props.primaryAction ? (
          <a href={props.primaryAction.href}>
            <Button type="button">{props.primaryAction.label}</Button>
          </a>
        ) : null}
        {props.secondaryAction}
      </div>
    </div>
  );
}