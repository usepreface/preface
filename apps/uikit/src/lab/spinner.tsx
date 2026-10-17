import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@usepreface/ui/components/empty";
import { Field, FieldLabel } from "@usepreface/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@usepreface/ui/components/input-group";
import { Spinner } from "@usepreface/ui/components/spinner";

import { Example, ExampleWrapper } from "../components/example";

export default function SpinnerExample() {
  return (
    <ExampleWrapper>
      <SpinnerBasic />
      <SpinnerInButtons />
      <SpinnerInBadges />
      <SpinnerInInputGroup />
      <SpinnerInEmpty />
    </ExampleWrapper>
  );
}

function SpinnerBasic() {
  return (
    <Example title="Basic">
      <div className="flex items-center gap-6">
        <Spinner />
        <Spinner className="size-6" />
      </div>
    </Example>
  );
}

function SpinnerInButtons() {
  return (
    <Example title="In Buttons">
      <div className="flex flex-wrap items-center gap-4">
        <Button>
          <Spinner data-icon="inline-start" /> Submit
        </Button>
        <Button disabled>
          <Spinner data-icon="inline-start" /> Disabled
        </Button>
        <Button variant="outline" disabled>
          <Spinner data-icon="inline-start" /> Outline
        </Button>
        <Button variant="outline" size="icon" disabled>
          <Spinner data-icon="inline-start" />
          <span className="sr-only">Loading...</span>
        </Button>
      </div>
    </Example>
  );
}

function SpinnerInBadges() {
  return (
    <Example title="In Badges" className="items-center justify-center">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Badge variant="solid" tone="info">
          <Spinner data-icon="inline-start" />
          Badge
        </Badge>
        <Badge>
          <Spinner data-icon="inline-start" />
          Badge
        </Badge>
        <Badge tone="danger">
          <Spinner data-icon="inline-start" />
          Badge
        </Badge>
        <Badge variant="outline">
          <Spinner data-icon="inline-start" />
          Badge
        </Badge>
      </div>
    </Example>
  );
}

function SpinnerInInputGroup() {
  return (
    <Example title="In Input Group">
      <Field>
        <FieldLabel htmlFor="input-group-spinner">Input Group</FieldLabel>
        <InputGroup>
          <InputGroupInput id="input-group-spinner" />
          <InputGroupAddon>
            <Spinner />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </Example>
  );
}

function SpinnerInEmpty() {
  return (
    <Example title="In Empty State" containerClassName="lg:col-span-full">
      <Empty className="min-h-[300px]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button render={<a href="#" />} nativeButton={false}>
              Create project
            </Button>
            <Button variant="outline">Import project</Button>
          </div>
          <Button
            variant="link"
            render={<a href="#" />}
            nativeButton={false}
            className="text-muted-foreground"
          >
            Learn more <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} />
          </Button>
        </EmptyContent>
      </Empty>
    </Example>
  );
}
