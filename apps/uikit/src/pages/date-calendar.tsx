import * as React from "react";

import { Calendar } from "@usepreface/ui/components/calendar";
import {
  DatePicker,
  DateRangePicker,
  TimeField,
  type DateRange,
} from "@usepreface/ui/components/date-picker";
import { Label } from "@usepreface/ui/components/label";

import { Page, Section, Specimen } from "../components/bench";

const today = new Date(2026, 9, 15);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function DateCalendarPage() {
  const [single, setSingle] = React.useState<Date | undefined>(addDays(today, 7));
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: addDays(today, 11),
    to: addDays(today, 20),
  });
  const [due, setDue] = React.useState<Date | undefined>(new Date(2026, 9, 22));
  return (
    <Page
      figma="51 Date & calendar"
      title="Date & calendar"
      description="Calendar grid, single and range pickers with presets, and a time field in 15-minute steps. Today is tinted, selection is solid Signal, ranges fill in Signal subtle and past days strike through when blocked."
    >
      <Section
        title="Calendar"
        description="36 px cells, 13 px day numbers. Outside days are tertiary; disabled days strike through."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Mode=Single" className="justify-center p-2">
          <Calendar
            mode="single"
            selected={single}
            onSelect={setSingle}
            defaultMonth={today}
            today={today}
            className="rounded-lg"
          />
        </Specimen>
        <Specimen label="Mode=Range" className="justify-center p-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            defaultMonth={today}
            today={today}
            className="rounded-lg"
          />
        </Specimen>
        <Specimen label="Mode=Bounded · past disabled" className="justify-center p-2">
          <Calendar
            mode="single"
            selected={due}
            onSelect={setDue}
            defaultMonth={today}
            today={today}
            disabled={{ before: today }}
            className="rounded-lg"
          />
        </Specimen>
      </Section>

      <Section
        title="Two months"
        description="For ranges that cross a month boundary."
        className="flex"
      >
        <Specimen className="justify-center p-2">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={setRange}
            defaultMonth={today}
            today={today}
          />
        </Specimen>
      </Section>

      <Section
        title="Date picker"
        description="Label above, value in the trigger, calendar below on open. A clear button appears once a date is set."
        className="grid gap-6 sm:grid-cols-2"
      >
        <Specimen label="Placeholder" className="flex-col items-stretch gap-1.5">
          <Label htmlFor="dp-1">Next sync</Label>
          <DatePicker id="dp-1" />
        </Specimen>
        <Specimen label="Filled" className="flex-col items-stretch gap-1.5">
          <Label htmlFor="dp-2">Next sync</Label>
          <DatePicker id="dp-2" defaultValue={new Date(2026, 9, 22)} />
        </Specimen>
        <Specimen label="Bounded" className="flex-col items-stretch gap-1.5">
          <Label htmlFor="dp-3">Key expires</Label>
          <DatePicker
            id="dp-3"
            placeholder="Never"
            calendarProps={{ disabled: { before: today }, today }}
          />
        </Specimen>
        <Specimen label="Disabled" className="flex-col items-stretch gap-1.5">
          <Label htmlFor="dp-4" className="text-fg-disabled">
            Next sync
          </Label>
          <DatePicker id="dp-4" defaultValue={new Date(2026, 9, 22)} disabled />
        </Specimen>
      </Section>

      <Section
        title="Range picker & time"
        description="Presets first: most ranges are “last 7 days”. The draft only commits on Apply."
        className="flex flex-wrap items-start gap-6"
      >
        <Specimen label="Date range picker" className="flex-col items-start gap-1.5">
          <Label htmlFor="rp">Period</Label>
          <DateRangePicker
            id="rp"
            defaultValue={{ from: new Date(2026, 9, 26), to: new Date(2026, 10, 4) }}
          />
        </Specimen>
        <Specimen label="Time field · 15-minute steps" className="flex-col items-start gap-1.5">
          <Label htmlFor="tf">Digest time</Label>
          <TimeField id="tf" defaultValue="09:30" />
        </Specimen>
        <Specimen label="Date + time" className="flex-col items-start gap-1.5">
          <Label htmlFor="dt">Scheduled sync</Label>
          <div className="flex gap-2">
            <DatePicker id="dt" defaultValue={new Date(2026, 9, 22)} className="w-60" />
            <TimeField aria-label="Time" defaultValue="02:00" />
          </div>
        </Specimen>
      </Section>
    </Page>
  );
}
