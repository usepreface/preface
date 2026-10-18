import { Link, useNavigate } from "@tanstack/react-router";

import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import {
  EditIcon,
  LockKeyIcon,
  MoreHorizontalIcon,
  PlayIcon,
  XCircleIcon,
} from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { IconTile } from "#/components/data-display/icon-tile";
import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { feedback } from "#/lib/feedback";
import { connections, type SsoConnection } from "#/lib/placeholder";
import { connectionStatus } from "#/lib/status";

const healthTone = {
  success: "success",
  info: "info",
  warning: "warning",
  neutral: "neutral",
} as const;

export function ConnectionsTable({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const open = (connection: SsoConnection) =>
    navigate({
      to: "/org/$slug/settings/connections/$connectionId",
      params: { slug, connectionId: connection.id },
    });

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Connection</TableHead>
            <TableHead className="max-sm:hidden">Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-lg:hidden">Health</TableHead>
            <TableHead className="max-md:hidden">Domains</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => (
            <TableRow
              key={connection.id}
              className={connection.status === "disabled" ? "opacity-70" : undefined}
            >
              <TableCell>
                <div className="flex items-center gap-2.5">
                  {connection.brand ? (
                    <LogoTile brand={connection.brand} size={32} />
                  ) : (
                    <IconTile icon={LockKeyIcon} size={32} />
                  )}
                  <Link
                    to="/org/$slug/settings/connections/$connectionId"
                    params={{ slug, connectionId: connection.id }}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {connection.name}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="max-sm:hidden">
                <Badge variant="outline">{connection.protocol.toUpperCase()}</Badge>
              </TableCell>
              <TableCell>
                <StatusBadge status={connectionStatus[connection.status]} />
              </TableCell>
              <TableCell className="max-lg:hidden">
                <div className="flex flex-col items-start gap-0.5">
                  <StatusBadge
                    status={{
                      label: connection.health.label,
                      tone: healthTone[connection.health.tone],
                    }}
                  />
                  <span className="text-caption text-fg-tertiary">{connection.health.detail}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-mono-sm text-fg-secondary max-md:hidden">
                {connection.domain ?? "—"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${connection.name}`}
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => open(connection)}>
                      <EditIcon />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={feedback.notConnected}>
                      <PlayIcon />
                      Test login
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={feedback.notConnected}>
                      <XCircleIcon />
                      Disable
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
