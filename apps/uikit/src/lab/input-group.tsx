"use client";

import { useState } from "react";

import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CodeIcon,
  CopyIcon,
  DeleteIcon,
  LinkSquare02Icon,
  MailIcon,
  RecordIcon,
  RefreshIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  Tick02Icon,
  ViewOffIcon,
  VoiceIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@usepreface/ui/components/button";
import { ButtonGroup, ButtonGroupText } from "@usepreface/ui/components/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@usepreface/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@usepreface/ui/components/field";
import { Input } from "@usepreface/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@usepreface/ui/components/input-group";
import { Kbd, KbdGroup } from "@usepreface/ui/components/kbd";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@usepreface/ui/components/popover";
import { toast } from "@usepreface/ui/components/sonner";
import { Spinner } from "@usepreface/ui/components/spinner";
import { Textarea } from "@usepreface/ui/components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";

import { Example, ExampleWrapper } from "../components/example";

export default function InputGroupExample() {
  const [country, setCountry] = useState("+1");

  return (
    <ExampleWrapper className="min-w-0">
      <InputGroupBasic />
      <InputGroupWithAddons />
      <InputGroupWithButtons />
      <InputGroupWithTooltip country={country} setCountry={setCountry} />
      <InputGroupWithKbd />
      <InputGroupInCard />
      <InputGroupTextareaExamples />
    </ExampleWrapper>
  );
}

function InputGroupBasic() {
  return (
    <Example title="Basic">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-default-01">Default (No Input Group)</FieldLabel>
          <Input placeholder="Placeholder" id="input-default-01" />
        </Field>
        <Field>
          <FieldLabel htmlFor="input-group-02">Input Group</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-group-02" placeholder="Placeholder" />
          </InputGroup>
        </Field>
        <Field data-disabled="true">
          <FieldLabel htmlFor="input-disabled-03">Disabled</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-disabled-03" placeholder="This field is disabled" disabled />
          </InputGroup>
        </Field>
        <Field data-invalid="true">
          <FieldLabel htmlFor="input-invalid-04">Invalid</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="input-invalid-04"
              placeholder="This field is invalid"
              aria-invalid="true"
            />
          </InputGroup>
        </Field>
      </FieldGroup>
    </Example>
  );
}

function InputGroupWithAddons() {
  return (
    <Example title="With Addons">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-icon-left-05">Addon (inline-start)</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-icon-left-05" />
            <InputGroupAddon>
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-icon-right-07">Addon (inline-end)</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-icon-right-07" />
            <InputGroupAddon align="inline-end">
              <HugeiconsIcon icon={ViewOffIcon} strokeWidth={2} />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-icon-both-09">Addon (inline-start and inline-end)</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-icon-both-09" />
            <InputGroupAddon>
              <HugeiconsIcon icon={VoiceIcon} strokeWidth={2} className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <HugeiconsIcon
                icon={RecordIcon}
                strokeWidth={2}
                className="animate-pulse text-red-500"
              />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-addon-20">Addon (block-start)</FieldLabel>
          <InputGroup className="h-auto">
            <InputGroupInput id="input-addon-20" />
            <InputGroupAddon align="block-start">
              <InputGroupText>First Name</InputGroupText>
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="ml-auto text-muted-foreground"
              />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-addon-21">Addon (block-end)</FieldLabel>
          <InputGroup className="h-auto">
            <InputGroupInput id="input-addon-21" />
            <InputGroupAddon align="block-end">
              <InputGroupText>20/240 characters</InputGroupText>
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="ml-auto text-muted-foreground"
              />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-icon-both-10">Multiple Icons</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-icon-both-10" />
            <InputGroupAddon align="inline-end">
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
              <InputGroupButton size="icon-xs" onClick={() => toast("Copied to clipboard")}>
                <HugeiconsIcon icon={CopyIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupAddon>
              <HugeiconsIcon
                icon={RecordIcon}
                strokeWidth={2}
                className="animate-pulse text-red-500"
              />
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-description-10">Description</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-description-10" />
            <InputGroupAddon align="inline-end">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-label-10">Label</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FieldLabel htmlFor="input-label-10">Label</FieldLabel>
            </InputGroupAddon>
            <InputGroupInput id="input-label-10" />
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-optional-12" aria-label="Optional" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>(optional)</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </Example>
  );
}

function InputGroupWithButtons() {
  return (
    <Example title="With Buttons">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-button-13">Button</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-button-13" />
            <InputGroupAddon>
              <InputGroupButton>Default</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-button-14" />
            <InputGroupAddon>
              <InputGroupButton variant="outline">Outline</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-button-15" />
            <InputGroupAddon>
              <InputGroupButton variant="secondary">Secondary</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-button-16" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="secondary">Button</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-button-17" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs">
                <HugeiconsIcon icon={CopyIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-button-18" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton variant="secondary" size="icon-xs">
                <HugeiconsIcon icon={DeleteIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </Example>
  );
}

function InputGroupWithTooltip({
  country,
  setCountry,
}: {
  country: string;
  setCountry: (value: string) => void;
}) {
  return (
    <Example title="With Tooltip, Dropdown, Popover">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-tooltip-20">Tooltip</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-tooltip-20" />
            <InputGroupAddon align="inline-end">
              <Tooltip>
                <TooltipTrigger
                  render={<InputGroupButton className="rounded-full" size="icon-xs" />}
                >
                  <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
                </TooltipTrigger>
                <TooltipContent>This is content in a tooltip.</TooltipContent>
              </Tooltip>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-dropdown-21">Dropdown</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-dropdown-21" />
            <InputGroupAddon>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<InputGroupButton className="text-muted-foreground tabular-nums" />}
                >
                  {country} <HugeiconsIcon icon={ArrowDownIcon} strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-16"
                  sideOffset={10}
                  alignOffset={-8}
                >
                  <DropdownMenuItem onClick={() => setCountry("+1")}>+1</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCountry("+44")}>+44</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCountry("+46")}>+46</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-secure-19">Popover</FieldLabel>
          <InputGroup>
            <Popover>
              <PopoverTrigger render={<InputGroupAddon />} nativeButton={false}>
                <InputGroupButton variant="secondary" size="icon-xs">
                  <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverTitle>Your connection is not secure.</PopoverTitle>
                  <PopoverDescription>
                    You should not enter any sensitive information on this site.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
            <InputGroupAddon className="pl-1 text-muted-foreground">https://</InputGroupAddon>
            <InputGroupInput id="input-secure-19" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => toast("Added to favorites")}>
                <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="url">Button Group</FieldLabel>
          <ButtonGroup>
            <ButtonGroupText>https://</ButtonGroupText>
            <InputGroup>
              <InputGroupInput id="url" />
              <InputGroupAddon align="inline-end">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
              </InputGroupAddon>
            </InputGroup>
            <ButtonGroupText>.com</ButtonGroupText>
          </ButtonGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
      </FieldGroup>
    </Example>
  );
}

function InputGroupWithKbd() {
  return (
    <Example title="With Kbd">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="input-kbd-22">Input Group with Kbd</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-kbd-22" />
            <InputGroupAddon>
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-kbd-23" />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-search-apps-24" placeholder="Search for Apps..." />
            <InputGroupAddon align="inline-end">Ask AI</InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>Tab</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupInput id="input-search-type-25" placeholder="Type to search..." />
            <InputGroupAddon align="inline-start">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>C</Kbd>
              </KbdGroup>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="input-username-26">Username</FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-username-26" defaultValue="shadcn" />
            <InputGroupAddon align="inline-end">
              <div className="flex size-4 items-center justify-center rounded-full bg-green-500 dark:bg-green-800">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3 text-white" />
              </div>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription className="text-green-700">
            This username is available.
          </FieldDescription>
        </Field>
        <InputGroup>
          <InputGroupInput id="input-search-docs-27" placeholder="Search documentation..." />
          <InputGroupAddon>
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">12 results</InputGroupAddon>
        </InputGroup>
        <InputGroup data-disabled="true">
          <InputGroupInput
            id="input-search-disabled-28"
            placeholder="Search documentation..."
            disabled
          />
          <InputGroupAddon>
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">Disabled</InputGroupAddon>
        </InputGroup>
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="input-group-11">First Name</FieldLabel>
            <InputGroup>
              <InputGroupInput id="input-group-11" placeholder="First Name" />
              <InputGroupAddon align="inline-end">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="input-group-12">Last Name</FieldLabel>
            <InputGroup>
              <InputGroupInput id="input-group-12" placeholder="Last Name" />
              <InputGroupAddon align="inline-end">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
        <Field data-disabled="true">
          <FieldLabel htmlFor="input-group-29">
            Loading (&quot;data-disabled=&quot;true&quot;)
          </FieldLabel>
          <InputGroup>
            <InputGroupInput id="input-group-29" disabled defaultValue="shadcn" />
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
      </FieldGroup>
    </Example>
  );
}

function InputGroupInCard() {
  return (
    <Example title="In Card">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Card with Input Group</CardTitle>
          <CardDescription>This is a card with an input group.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email-input">Email Address</FieldLabel>
              <InputGroup>
                <InputGroupInput id="email-input" type="email" placeholder="you@example.com" />
                <InputGroupAddon align="inline-end">
                  <HugeiconsIcon icon={MailIcon} strokeWidth={2} />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="website-input">Website URL</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput id="website-input" placeholder="example.com" />
                <InputGroupAddon align="inline-end">
                  <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="feedback-textarea">Feedback & Comments</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="feedback-textarea"
                  placeholder="Share your thoughts..."
                  className="min-h-[100px]"
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText>0/500 characters</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Submit</Button>
        </CardFooter>
      </Card>
    </Example>
  );
}

function InputGroupTextareaExamples() {
  return (
    <Example title="Textarea">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="textarea-header-footer-12">
            Default Textarea (No Input Group)
          </FieldLabel>
          <Textarea id="textarea-header-footer-12" placeholder="Enter your text here..." />
        </Field>
        <Field>
          <FieldLabel htmlFor="textarea-header-footer-13">Input Group</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-header-footer-13"
              placeholder="Enter your text here..."
            />
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field data-invalid="true">
          <FieldLabel htmlFor="textarea-header-footer-14">Invalid</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-header-footer-14"
              placeholder="Enter your text here..."
              aria-invalid="true"
            />
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field data-disabled="true">
          <FieldLabel htmlFor="textarea-header-footer-15">Disabled</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-header-footer-15"
              placeholder="Enter your text here..."
              disabled
            />
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="prompt-31">Addon (block-start)</FieldLabel>
          <InputGroup>
            <InputGroupTextarea id="prompt-31" />
            <InputGroupAddon align="block-start">
              <InputGroupText>Ask, Search or Chat...</InputGroupText>
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={2}
                className="ml-auto text-muted-foreground"
              />
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>This is a description of the input group.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="textarea-header-footer-30">Addon (block-end)</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-header-footer-30"
              placeholder="Enter your text here..."
            />
            <InputGroupAddon align="block-end">
              <InputGroupText>0/280 characters</InputGroupText>
              <InputGroupButton variant="default" size="icon-xs" className="ml-auto rounded-full">
                <HugeiconsIcon icon={ArrowUpIcon} strokeWidth={2} />
                <span className="sr-only">Send</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="textarea-comment-31">Addon (Buttons)</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-comment-31"
              placeholder="Share your thoughts..."
              className="min-h-[120px]"
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton variant="ghost" className="ml-auto" size="sm">
                Cancel
              </InputGroupButton>
              <InputGroupButton variant="default" size="sm">
                Post Comment
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="textarea-code-32">Code Editor</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id="textarea-code-32"
              placeholder="console.log('Hello, world!');"
              className="min-h-[300px] py-3"
            />
            <InputGroupAddon align="block-start" className="border-b">
              <InputGroupText className="font-mono font-medium">
                <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
                script.js
              </InputGroupText>
              <InputGroupButton size="icon-xs" className="ml-auto">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              </InputGroupButton>
              <InputGroupButton size="icon-xs" variant="ghost">
                <HugeiconsIcon icon={CopyIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupAddon align="block-end" className="border-t">
              <InputGroupText>Line 1, Column 1</InputGroupText>
              <InputGroupText className="ml-auto">JavaScript</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </Example>
  );
}
