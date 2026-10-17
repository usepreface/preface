import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { ButtonGroup, ButtonGroupText } from "@usepreface/ui/components/button-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@usepreface/ui/components/input-otp";
import { Label } from "@usepreface/ui/components/label";
import { NativeSelect, NativeSelectOption } from "@usepreface/ui/components/native-select";
import { Slider } from "@usepreface/ui/components/slider";
import { Toggle } from "@usepreface/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@usepreface/ui/components/toggle-group";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DashboardIcon,
  DownloadIcon,
  GridIcon,
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  RefreshIcon,
  SparklesIcon,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";
import { Dropzone, UploadItem } from "@usepreface/ui/preface/dropzone";

import { Page, Section, Specimen } from "../components/bench";

type Upload = { name: string; size: number; progress: number };

const seed: Upload[] = [
  { name: "security-policy.pdf", size: 2_516_582, progress: 1 },
  { name: "onboarding.md", size: 18_432, progress: 0.62 },
  { name: "pricing-faq.docx", size: 552_960, progress: 0.2 },
];

function useFakeUploads() {
  const [files, setFiles] = React.useState(seed);
  React.useEffect(() => {
    if (!files.some((f) => f.progress < 1)) {
      return;
    }
    const t = window.setTimeout(
      () =>
        setFiles((list) =>
          list.map((f) =>
            f.progress < 1 ? { ...f, progress: Math.min(1, f.progress + 0.08) } : f,
          ),
        ),
      400,
    );
    return () => window.clearTimeout(t);
  }, [files]);
  return [files, setFiles] as const;
}

const sources: [BrandName, string][] = [
  ["github", "GitHub"],
  ["slack", "Slack"],
  ["notion", "Notion"],
  ["discord", "Discord"],
];

export function InputsPage() {
  const [code, setCode] = React.useState("482");
  const [expired, setExpired] = React.useState("482913");
  const [topK, setTopK] = React.useState(8);
  const [chunk, setChunk] = React.useState<number[]>([256, 768]);
  const [temp, setTemp] = React.useState(0.2);
  const [view, setView] = React.useState<string[]>(["grid"]);
  const [filters, setFilters] = React.useState<string[]>(["github", "slack"]);
  const [files, setFiles] = useFakeUploads();

  return (
    <Page
      figma="54 More inputs"
      title="More inputs"
      description="One-time codes, sliders, toggles and toggle groups, button groups, native select, labels and a file dropzone."
    >
      <Section
        title="One-time code"
        description="Six slots in two groups. Paste fills every cell and focus moves on its own."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Filling" className="flex-col items-start gap-2">
          <Label htmlFor="otp-1">Verification code</Label>
          <InputOTP id="otp-1" maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <span className="text-xs text-fg-tertiary">Sent to aisha@acme.dev</span>
        </Specimen>
        <Specimen label="Invalid" className="flex-col items-start gap-2">
          <Label htmlFor="otp-2">Verification code</Label>
          <InputOTP id="otp-2" maxLength={6} value={expired} onChange={setExpired} aria-invalid>
            <InputOTPGroup>
              <InputOTPSlot index={0} aria-invalid />
              <InputOTPSlot index={1} aria-invalid />
              <InputOTPSlot index={2} aria-invalid />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} aria-invalid />
              <InputOTPSlot index={4} aria-invalid />
              <InputOTPSlot index={5} aria-invalid />
            </InputOTPGroup>
          </InputOTP>
          <span className="text-xs text-danger-fg">That code has expired. Send a new one.</span>
        </Specimen>
        <Specimen label="Disabled" className="flex-col items-start gap-2">
          <Label htmlFor="otp-3" className="text-fg-disabled">
            Verification code
          </Label>
          <InputOTP id="otp-3" maxLength={6} disabled>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Specimen>
      </Section>

      <Section
        title="Slider"
        description="Retrieval settings. The value prints beside the label: a slider without a number is a guess."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Type=Single" className="flex-col items-stretch gap-3">
          <div className="flex justify-between text-13">
            <Label id="topk">Top-k results</Label>
            <span className="font-mono text-fg-secondary tabular-nums">{topK}</span>
          </div>
          <Slider
            aria-labelledby="topk"
            min={1}
            max={24}
            value={topK}
            onValueChange={(v) => setTopK(Array.isArray(v) ? (v[0] ?? 1) : v)}
          />
        </Specimen>
        <Specimen label="Type=Range" className="flex-col items-stretch gap-3">
          <div className="flex justify-between text-13">
            <Label id="chunk">Chunk size</Label>
            <span className="font-mono text-fg-secondary tabular-nums">
              {chunk[0]} – {chunk[1]} tokens
            </span>
          </div>
          <Slider
            aria-labelledby="chunk"
            min={64}
            max={1024}
            step={32}
            value={chunk}
            onValueChange={(v) => setChunk(Array.isArray(v) ? [...v] : [v])}
          />
        </Specimen>
        <Specimen label="State=Disabled" className="flex-col items-stretch gap-3">
          <div className="flex justify-between text-13">
            <Label id="temp" className="text-fg-disabled">
              Temperature
            </Label>
            <span className="font-mono text-fg-disabled tabular-nums">{temp.toFixed(1)}</span>
          </div>
          <Slider
            aria-labelledby="temp"
            min={0}
            max={1}
            step={0.1}
            value={temp}
            disabled
            onValueChange={(v) => setTemp(Array.isArray(v) ? (v[0] ?? 0) : v)}
          />
        </Specimen>
      </Section>

      <Section
        title="Toggle & toggle group"
        description="A toggle stays pressed; on uses the selected state with a hairline. Groups pick one view or several filters."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Toggle · icon, label, disabled">
          <Toggle aria-label="Citations only" defaultPressed>
            <SparklesIcon />
          </Toggle>
          <Toggle>
            <SparklesIcon />
            Citations
          </Toggle>
          <Toggle defaultPressed>
            <SparklesIcon />
            Citations
          </Toggle>
          <Toggle disabled>
            <SparklesIcon />
            Citations
          </Toggle>
        </Specimen>
        <Specimen label="Single-select · view">
          <ToggleGroup
            value={view}
            onValueChange={(v) => v.length && setView(v as string[])}
            spacing={0.5}
            className="rounded-[10px] border bg-surface-1 p-0.5"
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <MenuIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <GridIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board view">
              <DashboardIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </Specimen>
        <Specimen label="Multi-select · source filters">
          <ToggleGroup
            multiple
            value={filters}
            onValueChange={(v) => setFilters(v as string[])}
            spacing={1.5}
            className="flex-wrap"
          >
            {sources.map(([k, label]) => {
              const on = filters.includes(k);
              return (
                <ToggleGroupItem
                  key={k}
                  value={k}
                  className={cn(
                    "h-7 rounded-full border-border-default bg-surface-1 px-2.5 text-13 aria-pressed:border-border-focus aria-pressed:bg-primary-subtle aria-pressed:text-fg-accent",
                  )}
                >
                  <BrandLogo name={k} size={14} variant={on ? "auto" : "mono"} aria-hidden="true" />
                  {label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </Specimen>
      </Section>

      <Section
        title="Button group"
        description="Split button for a primary action with options; joined groups for related actions."
        className="flex flex-wrap gap-6"
      >
        <Specimen label="Split">
          <ButtonGroup>
            <Button>
              <RefreshIcon data-icon="inline-start" />
              Sync now
            </Button>
            <Button
              size="icon"
              aria-label="Sync options"
              className="border-l border-l-primary-hover"
            >
              <ChevronDownIcon />
            </Button>
          </ButtonGroup>
        </Specimen>
        <Specimen label="Pager">
          <ButtonGroup>
            <Button variant="outline" size="icon" aria-label="Previous page">
              <ChevronLeftIcon />
            </Button>
            <ButtonGroupText>Page 2 of 9</ButtonGroupText>
            <Button variant="outline" size="icon" aria-label="Next page">
              <ChevronRightIcon />
            </Button>
          </ButtonGroup>
        </Specimen>
        <Specimen label="Actions">
          <ButtonGroup>
            <Button variant="outline">
              <CopyIcon data-icon="inline-start" />
              Copy
            </Button>
            <Button variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Download
            </Button>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreHorizontalIcon />
            </Button>
          </ButtonGroup>
        </Specimen>
      </Section>

      <Section
        title="Native select & label"
        description="The platform picker, for forms on mobile and the self-hosted setup wizard. Labels are Body/S Medium with a required asterisk, optional suffix or info trigger."
        className="grid gap-6 md:grid-cols-2"
      >
        <Specimen
          label="Native select · default, disabled"
          className="flex-col items-stretch gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ns-1">Answer language</Label>
            <NativeSelect id="ns-1" defaultValue="en-GB" className="w-56">
              <NativeSelectOption value="en-GB">English (UK)</NativeSelectOption>
              <NativeSelectOption value="en-US">English (US)</NativeSelectOption>
              <NativeSelectOption value="de">Deutsch</NativeSelectOption>
              <NativeSelectOption value="ja">日本語</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ns-2" className="text-fg-disabled">
              Region
            </Label>
            <NativeSelect id="ns-2" disabled defaultValue="eu" className="w-56">
              <NativeSelectOption value="eu">eu-west-1</NativeSelectOption>
            </NativeSelect>
          </div>
        </Specimen>
        <Specimen label="Label · required, optional, info" className="flex-col items-start gap-3.5">
          <Label>
            Display name <span className="text-danger-fg">*</span>
          </Label>
          <Label>
            Webhook secret <span className="text-xs font-normal text-fg-tertiary">(optional)</span>
            <InfoIcon className="size-3.5 text-icon-secondary" aria-label="More info" />
          </Label>
          <Label>Region</Label>
        </Specimen>
      </Section>

      <Section
        title="Dropzone"
        description="File upload for the Files source. Dashed border; accent while dragging; per-file progress below."
        className="flex"
      >
        <div className="flex w-full max-w-xl flex-col gap-3">
          <Dropzone
            onFiles={(list) =>
              setFiles((f) => [
                ...f,
                ...list.map((file) => ({ name: file.name, size: file.size, progress: 0 })),
              ])
            }
          />
          {files.map((f, i) => (
            <UploadItem
              key={`${f.name}-${i}`}
              name={f.name}
              size={f.size}
              progress={f.progress}
              onRemove={() => setFiles((list) => list.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      </Section>
    </Page>
  );
}
