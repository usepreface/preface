import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DashedLineCircleIcon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@usepreface/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@usepreface/ui/components/input-group";
import { Kbd, KbdGroup } from "@usepreface/ui/components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";

import { Example, ExampleWrapper } from "../components/example";

export default function KbdExample() {
  return (
    <ExampleWrapper>
      <KbdBasic />
      <KbdModifierKeys />
      <KbdGroupExample />
      <KbdArrowKeys />
      <KbdWithIcons />
      <KbdWithIconsAndText />
      <KbdInInputGroup />
      <KbdInTooltip />
      <KbdWithSamp />
    </ExampleWrapper>
  );
}

function KbdBasic() {
  return (
    <Example title="Basic">
      <div className="flex items-center gap-2">
        <Kbd>Ctrl</Kbd>
        <Kbd>⌘K</Kbd>
        <Kbd>Ctrl + B</Kbd>
      </div>
    </Example>
  );
}

function KbdModifierKeys() {
  return (
    <Example title="Modifier Keys">
      <div className="flex items-center gap-2">
        <Kbd>⌘</Kbd>
        <Kbd>C</Kbd>
      </div>
    </Example>
  );
}

function KbdGroupExample() {
  return (
    <Example title="KbdGroup">
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </Example>
  );
}

function KbdArrowKeys() {
  return (
    <Example title="Arrow Keys">
      <div className="flex items-center gap-2">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
      </div>
    </Example>
  );
}

function KbdWithIcons() {
  return (
    <Example title="With Icons">
      <KbdGroup>
        <Kbd>
          <HugeiconsIcon icon={DashedLineCircleIcon} strokeWidth={2} />
        </Kbd>
        <Kbd>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </Kbd>
        <Kbd>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </Kbd>
      </KbdGroup>
    </Example>
  );
}

function KbdWithIconsAndText() {
  return (
    <Example title="With Icons and Text">
      <KbdGroup>
        <Kbd>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Left
        </Kbd>
        <Kbd>
          <HugeiconsIcon icon={DashedLineCircleIcon} strokeWidth={2} />
          Voice Enabled
        </Kbd>
      </KbdGroup>
    </Example>
  );
}

function KbdInInputGroup() {
  return (
    <Example title="InputGroup">
      <InputGroup>
        <InputGroupInput />
        <InputGroupAddon>
          <Kbd>Space</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </Example>
  );
}

function KbdInTooltip() {
  return (
    <Example title="Tooltip">
      <Tooltip>
        <TooltipTrigger render={<Button size="icon-sm" variant="outline" />}>
          <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent className="pr-1.5">
          <div className="flex items-center gap-2">
            Save Changes <Kbd>S</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </Example>
  );
}

function KbdWithSamp() {
  return (
    <Example title="With samp">
      <Kbd>
        <samp>File</samp>
      </Kbd>
    </Example>
  );
}
