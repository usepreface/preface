import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { BrowserIcon, TerminalIcon } from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { feedback } from "#/lib/feedback";
import { connectedAccounts, sessions } from "#/lib/placeholder";

export function ConnectedAccounts() {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-md:hidden">Connected</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connectedAccounts.map((account) => {
            const connected = account.status === "connected";
            return (
              <TableRow key={account.provider}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <LogoTile brand={account.brand} size={28} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {account.provider}
                      </span>
                      <span className="text-caption text-fg-tertiary">{account.account}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-fg-secondary">{account.organization}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={
                      connected
                        ? { label: "Connected", tone: "success", dot: true }
                        : { label: "Not connected", tone: "neutral" }
                    }
                  />
                </TableCell>
                <TableCell className="text-fg-secondary max-md:hidden">
                  {account.connected}
                </TableCell>
                <TableCell className="text-right">
                  {account.required ? (
                    <Badge variant="outline">Required by {account.organization}</Badge>
                  ) : connected ? (
                    <Button variant="ghost" size="sm" onClick={feedback.notConnected}>
                      Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={feedback.notConnected}>
                      Connect
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}

export function Sessions() {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead className="max-md:hidden">Created</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead className="max-md:hidden">Expires</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const Icon = session.kind === "terminal" ? TerminalIcon : BrowserIcon;
            return (
              <TableRow key={session.device}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2">
                      <Icon className="size-4 text-icon-secondary" />
                    </span>
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {session.device}
                        {session.current ? (
                          <Badge tone="success">
                            <BadgeDot />
                            Current session
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-caption text-fg-tertiary">{session.detail}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-fg-secondary max-md:hidden">{session.created}</TableCell>
                <TableCell className="text-fg-secondary">{session.lastActive}</TableCell>
                <TableCell className="text-fg-secondary max-md:hidden">{session.expires}</TableCell>
                <TableCell className="text-right">
                  {session.current ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        feedback.done("Session revoked", `${session.device} is signed out.`)
                      }
                    >
                      Revoke
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}
