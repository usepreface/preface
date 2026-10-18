import { Button } from "@usepreface/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  GlobeIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  XCircleIcon,
} from "@usepreface/ui/icons";
import { LogoTile } from "@usepreface/ui/preface/data-display";

import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { domainForm } from "#/forms/domains";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { domains } from "#/lib/placeholder";
import { domainApproval, domainStatus } from "#/lib/status";

export type Domain = (typeof domains)[number];

export function AddDomain({ onAdded }: { onAdded: (domain: string) => void }) {
  const form = useSchemaForm(domainForm, { defaultValues: { domain: "" } });
  return (
    <form
      noValidate
      className="flex items-start gap-2"
      onSubmit={form.handleSubmit(({ domain }) => {
        onAdded(domain);
        form.reset();
      })}
    >
      <TextField
        control={form.control}
        name="domain"
        label={<span className="sr-only">Domain</span>}
        className="w-full max-w-90 gap-0"
        leading={<GlobeIcon />}
        inputProps={{ placeholder: "example.com", autoComplete: "off", spellCheck: false }}
      />
      <SubmitButton>
        <PlusIcon data-icon="inline-start" />
        Add domain
      </SubmitButton>
    </form>
  );
}

export function DomainsTable({
  onVerify,
  onRevoke,
}: {
  onVerify: (domain: string) => void;
  onRevoke: (domain: Domain) => void;
}) {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead className="max-lg:hidden">Verified · expiry</TableHead>
            <TableHead className="max-md:hidden">SSO connection</TableHead>
            <TableHead className="max-md:hidden">Instance approval</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow
              key={domain.name}
              className={domain.status === "expired" ? "opacity-70" : undefined}
            >
              <TableCell className="font-mono text-mono-sm text-foreground">
                {domain.name}
              </TableCell>
              <TableCell>
                <StatusBadge status={domainStatus[domain.status]} />
              </TableCell>
              <TableCell className="text-fg-secondary max-lg:hidden">{domain.verified}</TableCell>
              <TableCell className="max-md:hidden">
                {"connection" in domain ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <LogoTile brand={domain.connection.brand} size={20} />
                    {domain.connection.name}
                  </span>
                ) : (
                  <span className="text-fg-tertiary">—</span>
                )}
              </TableCell>
              <TableCell className="max-md:hidden">
                {domain.approval === "none" && domain.status !== "expired" ? (
                  <span className="text-fg-tertiary">—</span>
                ) : (
                  <StatusBadge status={domainApproval[domain.approval]} />
                )}
              </TableCell>
              <TableCell className="text-right">
                {domain.status === "pending" ? (
                  <Button variant="outline" size="sm" onClick={() => onVerify(domain.name)}>
                    Verify
                  </Button>
                ) : domain.status === "expired" ? (
                  <Button variant="ghost" size="sm" onClick={() => onVerify(domain.name)}>
                    Re-verify
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${domain.name}`}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={feedback.notConnected}>
                        <LinkIcon />
                        Change SSO connection
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onRevoke(domain)}>
                        <XCircleIcon />
                        Revoke verification
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
