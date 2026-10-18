import { Checkbox } from "@usepreface/ui/components/checkbox";
import { LockKeyIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { LogoTile } from "@usepreface/ui/preface/data-display";
import { Controller } from "react-hook-form";

import { IconTile } from "#/components/data-display/icon-tile";
import { StatusBadge } from "#/components/data-display/status-badge";
import type { loginPolicyForm } from "#/forms/authentication";
import type { SchemaForm } from "#/lib/forms/use-schema-form";
import type { SsoConnection } from "#/lib/placeholder";
import { connectionStatus } from "#/lib/status";

/** One connection members can be allowed to use. Only tested or active connections can be approved. */
export function ConnectionToggle({
  form,
  connection,
}: {
  form: SchemaForm<typeof loginPolicyForm>;
  connection: SsoConnection;
}) {
  const name = connection.protocol === "oidc" ? "oidcConnectionIds" : "samlConnectionIds";
  const ready = connection.status === "active" || connection.status === "tested";
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const ids: readonly string[] = field.value ?? [];
        const on = ids.includes(connection.id);
        return (
          <label
            className={cn(
              "flex items-center gap-2.5 rounded-lg border border-border-subtle px-2.5 py-2",
              on ? "bg-surface-2" : null,
              ready ? "cursor-pointer" : "cursor-not-allowed",
            )}
          >
            <Checkbox
              checked={on}
              disabled={!ready}
              onCheckedChange={(checked) =>
                field.onChange(
                  checked === true
                    ? [...ids, connection.id]
                    : ids.filter((id) => id !== connection.id),
                )
              }
            />
            {connection.brand ? (
              <LogoTile brand={connection.brand} size={24} />
            ) : (
              <IconTile icon={LockKeyIcon} size={28} />
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "text-sm font-medium",
                  ready ? "text-foreground" : "text-fg-tertiary",
                )}
              >
                {connection.name}
              </span>
              <span className="text-caption text-fg-tertiary">
                {connection.protocol.toUpperCase()} ·{" "}
                {connection.domain ?? connection.health.detail.toLowerCase()}
              </span>
            </span>
            <StatusBadge status={connectionStatus[connection.status]} />
          </label>
        );
      }}
    />
  );
}
