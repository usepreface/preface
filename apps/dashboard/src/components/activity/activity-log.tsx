import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  SearchIcon,
  ServerIcon,
  UsersIcon,
} from "@usepreface/ui/icons";
import { FiltersTooNarrowIllustration } from "@usepreface/ui/illustrations";
import { InlineCode } from "@usepreface/ui/preface/data-display";

import { DetailList } from "#/components/data-display/detail-list";
import { IconTile } from "#/components/data-display/icon-tile";
import { Person, PersonAvatar } from "#/components/data-display/identity";
import { TableCard } from "#/components/data-display/table-card";
import { matches } from "#/components/data-display/table-toolbar";
import { EmptyState } from "#/components/feedback/empty-state";
import { FormSheet } from "#/components/feedback/form-dialog";
import { feedback } from "#/lib/feedback";
import { eventDetail, type ActivityEvent } from "#/lib/placeholder";

const ANY = "all";

/*
 * The audit log shared by an organization's Activity page and the instance's. Filters work on
 * the loaded rows until the API pages and filters on the server. `narrow` previews filters that
 * match nothing; `selected` opens one event's details.
 */
export function ActivityLog({
  events,
  total,
  typeLabel = "All events",
  narrow,
  selected,
}: {
  events: readonly ActivityEvent[];
  total: number;
  typeLabel?: string;
  narrow?: boolean;
  selected?: string;
}) {
  const [type, setType] = React.useState(narrow ? "domain" : ANY);
  const [actor, setActor] = React.useState(narrow ? "Kenji Ito" : ANY);
  const [target, setTarget] = React.useState("");
  const [open, setOpen] = React.useState<ActivityEvent | undefined>(() =>
    events.find((event) => event.action === selected),
  );

  const types = [
    ANY,
    ...new Set(events.map((event) => event.action.split(".")[0] ?? event.action)),
  ];
  const actors = [
    ANY,
    ...new Set([...events.map((event) => event.actor), ...(narrow ? ["Kenji Ito"] : [])]),
  ];
  const rows = events.filter(
    (event) =>
      (type === ANY || event.action.startsWith(`${type}.`)) &&
      (actor === ANY || event.actor === actor) &&
      matches(target, event.target),
  );
  const filtered = type !== ANY || actor !== ANY || target !== "";
  const clear = () => {
    setType(ANY);
    setActor(ANY);
    setTarget("");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Event type"
          value={type}
          onChange={setType}
          options={types.map((value) => ({
            value,
            label: value === ANY ? typeLabel : `${value}.*`,
          }))}
        />
        <FilterSelect
          label="Actor"
          value={actor}
          onChange={setActor}
          options={actors.map((value) => ({ value, label: value === ANY ? "Anyone" : value }))}
        />
        <div className="relative w-full sm:w-44">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-secondary" />
          <Input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Target"
            aria-label="Target"
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={feedback.notConnected}>
          <CalendarIcon data-icon="inline-start" />
          {narrow ? "Oct 1 – Oct 18" : "Oct 11 – Oct 18"}
        </Button>
        {filtered ? (
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : null}
      </div>
      {rows.length ? (
        <>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-30">Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="max-md:hidden">Target</TableHead>
                  <TableHead className="max-lg:hidden">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((event) => (
                  <TableRow
                    key={`${event.time}-${event.action}`}
                    data-state={open === event ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setOpen(event)}
                  >
                    <TableCell className="font-mono text-mono-sm text-fg-secondary">
                      {event.time}
                    </TableCell>
                    <TableCell>
                      <Actor name={event.actor} />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
                        onClick={() => setOpen(event)}
                      >
                        <InlineCode>{event.action}</InlineCode>
                      </button>
                    </TableCell>
                    <TableCell className="text-foreground max-md:hidden">{event.target}</TableCell>
                    <TableCell className="text-fg-secondary max-lg:hidden">
                      {event.detail}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-caption text-fg-tertiary">
              Showing 1–{rows.length} of {filtered ? rows.length : total.toLocaleString("en-US")}{" "}
              events
            </span>
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={filtered} onClick={feedback.notConnected}>
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          bordered
          art={<FiltersTooNarrowIllustration />}
          title="No events match these filters"
          description={
            actor !== ANY
              ? `${actor} made no ${type === ANY ? "" : `${type} `}changes in this date range. Try a wider date range or another person.`
              : "Try a wider date range or fewer filters."
          }
          actions={
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      )}
      {open ? <EventSheet event={open} onClose={() => setOpen(undefined)} /> : null}
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Select items={options} value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger aria-label={label} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Actor({ name }: { name: string }) {
  if (name === "System") {
    return (
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="flex size-6 items-center justify-center rounded-full bg-surface-3">
          <ServerIcon className="size-3 text-icon-secondary" />
        </span>
        System
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
      <PersonAvatar name={name} size="sm" />
      {name}
    </span>
  );
}

/** One event: who, what, from where, and the change itself. */
function EventSheet({ event, onClose }: { event: ActivityEvent; onClose: () => void }) {
  // Only member.role_changed has full sample details; other events show what the row has.
  const full = event.action === eventDetail.action;
  return (
    <FormSheet
      open
      onOpenChange={onClose}
      media={<IconTile icon={UsersIcon} />}
      title={event.action}
      description={full ? eventDetail.at : event.time}
      footer={
        <>
          <Button variant="outline" onClick={() => feedback.copied("Event")}>
            <CopyIcon data-icon="inline-start" />
            Copy as JSON
          </Button>
          <Button variant="ghost" onClick={feedback.notConnected}>
            View {event.target.split(" ")[0]}’s activity
          </Button>
        </>
      }
    >
      <DetailList
        labelWidth="w-30"
        items={
          full
            ? [
                {
                  label: "Actor",
                  value: (
                    <Person
                      name={eventDetail.actor.name}
                      detail={eventDetail.actor.detail}
                      size="sm"
                    />
                  ),
                },
                {
                  label: "Target",
                  value: (
                    <Person
                      name={eventDetail.target.name}
                      detail={eventDetail.target.detail}
                      size="sm"
                    />
                  ),
                },
                { label: "Organization", value: eventDetail.organization },
                { label: "Signed in with", value: eventDetail.session },
                { label: "IP address", value: eventDetail.ip, mono: true },
                { label: "Request ID", value: eventDetail.requestId, mono: true },
              ]
            : [
                { label: "Actor", value: event.actor },
                { label: "Target", value: event.target },
                { label: "Details", value: event.detail },
              ]
        }
      />
      {full ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-foreground">Change</h3>
          <div className="overflow-hidden rounded-lg border font-mono text-mono-sm">
            <div className="flex gap-2.5 bg-danger-bg px-3 py-2">
              <span className="text-danger-fg" aria-label="Before">
                −
              </span>
              <span className="text-foreground">{eventDetail.before}</span>
            </div>
            <div className="flex gap-2.5 bg-success-bg px-3 py-2">
              <span className="text-success-fg" aria-label="After">
                +
              </span>
              <span className="text-foreground">{eventDetail.after}</span>
            </div>
          </div>
        </div>
      ) : null}
    </FormSheet>
  );
}
