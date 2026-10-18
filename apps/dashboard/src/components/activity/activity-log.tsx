import { useState } from "react";

import { Struct } from "effect";

import type { OrganizationId } from "@usepreface/protocol";
import {
  AuditExportQuery,
  type ListAuditEventsQuery,
  type PublicAuditEvent,
} from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@usepreface/ui/components/popover";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@usepreface/ui/components/table";
import { CalendarIcon } from "@usepreface/ui/icons";
import { InlineCode } from "@usepreface/ui/preface/data-display";

import { ApiClient, mutation } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { FormSheet } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { toMutation } from "#/hooks/mutation";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { toFormSchema } from "#/lib/forms/schema";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { requestFields } from "#/lib/request-fields";

const useEvents = toQuery(
  (organizationId: OrganizationId | undefined, query: ListAuditEventsQuery) =>
    organizationId
      ? ApiClient.query(
          "audit",
          "organization",
          requestFields({
            params: { organizationId },
            query,
            reactivityKeys: [QueryKeys.authority, QueryKeys.organization(organizationId)],
          }),
        )
      : ApiClient.query(
          "audit",
          "instance",
          requestFields({
            query,
            reactivityKeys: [QueryKeys.authority, QueryKeys.instance],
          }),
        ),
);
const useExportOrganization = toMutation(mutation((c) => c.audit.exportOrganization));
const useExportInstance = toMutation(mutation((c) => c.audit.exportInstance));
const filtersForm = toFormSchema(AuditExportQuery.mapFields(Struct.omit(["cursor"])));

export function ActivityLog({ organizationId }: { organizationId?: OrganizationId }) {
  const [filters, setFilters] = useState<typeof AuditExportQuery.Type>({});
  const [cursor, setCursor] = useState<string>();
  const [exportCursor, setExportCursor] = useState<string>();
  const [exportStarted, setExportStarted] = useState(false);
  const [selected, setSelected] = useState<typeof PublicAuditEvent.Type>();
  const query = useEvents(organizationId, { ...filters, cursor, limit: 25 });
  const exportOrganization = useExportOrganization();
  const exportInstance = useExportInstance();
  const form = useSchemaForm(filtersForm, { defaultValues: {} });
  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={form.handleSubmit((values) => {
          setFilters(values);
          setCursor(undefined);
          setExportCursor(undefined);
          setExportStarted(false);
        })}
      >
        <TextField
          control={form.control}
          name="eventType"
          label="Event type"
          className="w-full sm:w-48"
          optional
          emptyAsUndefined
          inputProps={{ placeholder: "organization.created" }}
        />
        <TextField
          control={form.control}
          name="actorUserId"
          label="Actor user ID"
          className="w-full sm:w-44"
          optional
          emptyAsUndefined
        />
        <TextField
          control={form.control}
          name="targetId"
          label="Target ID"
          className="w-full sm:w-44"
          optional
          emptyAsUndefined
        />
        <Popover>
          <PopoverTrigger render={<Button type="button" variant="outline" />}>
            <CalendarIcon data-icon="inline-start" />
            Date range
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            {" "}
            <TextField
              control={form.control}
              name="after"
              label="After (ISO timestamp)"
              optional
              emptyAsUndefined
              inputProps={{ placeholder: "2026-10-01T00:00:00Z" }}
            />
            <TextField
              control={form.control}
              name="before"
              label="Before (ISO timestamp)"
              optional
              emptyAsUndefined
            />
            <p className="text-caption text-fg-tertiary">Use ISO timestamps, then apply filters.</p>
          </PopoverContent>
        </Popover>
        <SubmitButton>Apply filters</SubmitButton>
      </form>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={query.refetch}>
          Refresh activity
        </Button>
        <Button
          variant="outline"
          disabled={exportOrganization.pending || exportInstance.pending}
          onClick={async () => {
            const exportQuery = { ...filters, cursor: exportStarted ? exportCursor : undefined };
            const response = organizationId
              ? await exportOrganization.run({ params: { organizationId }, query: exportQuery })
              : await exportInstance.run({ query: exportQuery });
            if (!response) return;
            const file = URL.createObjectURL(
              new Blob([response.value.content], { type: response.value.contentType }),
            );
            const link = document.createElement("a");
            link.href = file;
            link.download = response.value.filename;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(file), 1000);
            setExportStarted(true);
            setExportCursor(response.value.nextCursor ?? undefined);
          }}
        >
          {exportStarted && exportCursor ? "Export next CSV page" : "Export CSV"}
        </Button>
      </div>
      {exportStarted && exportCursor ? (
        <Notice>
          More events are available. Download the next CSV page to continue this export.
        </Notice>
      ) : null}
      <QueryState query={query}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatDate(event.occurredAt)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setSelected(event)}
                      className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
                    >
                      <InlineCode>{event.eventType}</InlineCode>
                    </button>
                  </TableCell>
                  <TableCell className="max-w-45 truncate">
                    {event.actorUserId ?? "System"}
                  </TableCell>
                  <TableCell className="max-w-45 truncate">
                    {event.targetType} · {event.targetId}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(event)}>
                      View details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        {query.data?.events.length === 0 ? (
          <p className="text-sm text-fg-secondary">No activity matches these filters.</p>
        ) : null}
      </QueryState>
      <Pagination cursor={cursor} nextCursor={query.data?.nextCursor} onChange={setCursor} />
      {selected ? (
        <FormSheet
          open
          onOpenChange={(open) => {
            if (!open) setSelected(undefined);
          }}
          title={selected.eventType}
          description={formatDate(selected.occurredAt)}
          footer={<Button onClick={() => setSelected(undefined)}>Close</Button>}
        >
          <dl className="flex flex-col gap-3 text-sm">
            <dt>Event ID</dt>
            <dd className="break-all">{selected.id}</dd>
            <dt>Actor</dt>
            <dd className="break-all">{selected.actorUserId ?? "System"}</dd>
            <dt>Target</dt>
            <dd className="break-all">
              {selected.targetType} · {selected.targetId}
            </dd>
          </dl>
          <pre className="whitespace-pre-wrap break-all text-xs">
            {JSON.stringify(selected.metadata, null, 2)}
          </pre>
        </FormSheet>
      ) : null}
    </div>
  );
}
