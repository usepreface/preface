import {
  ArrowUpRight01Icon,
  DashedLineCircleIcon,
  Folder01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@usepreface/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@usepreface/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@usepreface/ui/components/input-group";
import { Kbd } from "@usepreface/ui/components/kbd";

import { Example, ExampleWrapper } from "../components/example";

export default function EmptyExample() {
  return (
    <ExampleWrapper>
      <EmptyBasic />
      <EmptyWithMutedBackground />
      <EmptyWithBorder />
      <EmptyWithIcon />
      <EmptyWithMutedBackgroundAlt />
      <EmptyInCard />
    </ExampleWrapper>
  );
}

function EmptyBasic() {
  return (
    <Example title="Basic">
      <Empty>
        <EmptyHeader>
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
            className="text-muted-foreground"
            nativeButton={false}
          >
            Learn more <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
          </Button>
        </EmptyContent>
      </Empty>
    </Example>
  );
}

function EmptyWithMutedBackground() {
  return (
    <Example title="With Muted Background">
      <Empty className="bg-muted">
        <EmptyHeader>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            No results found for your search. Try adjusting your search terms.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Try again</Button>
          <Button
            variant="link"
            render={<a href="#" />}
            className="text-muted-foreground"
            nativeButton={false}
          >
            Learn more <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
          </Button>
        </EmptyContent>
      </Empty>
    </Example>
  );
}

function EmptyWithBorder() {
  return (
    <Example title="With Border">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for doesn&apos;t exist. Try searching for what you need
            below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup className="w-3/4">
            <InputGroupInput placeholder="Try searching for pages..." />
            <InputGroupAddon>
              <HugeiconsIcon icon={DashedLineCircleIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <EmptyDescription>
            Need help? <a href="#">Contact support</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </Example>
  );
}

function EmptyWithIcon() {
  return (
    <Example title="With Icon">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Nothing to see here</EmptyTitle>
          <EmptyDescription>
            No posts have been created yet. Get started by <a href="#">creating your first post</a>.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
            New Post
          </Button>
        </EmptyContent>
      </Empty>
    </Example>
  );
}

function EmptyWithMutedBackgroundAlt() {
  return (
    <Example title="With Muted Background Alt">
      <Empty className="bg-muted/50">
        <EmptyHeader>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for doesn&apos;t exist. Try searching for what you need
            below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <InputGroup className="w-3/4">
            <InputGroupInput placeholder="Try searching for pages..." />
            <InputGroupAddon>
              <HugeiconsIcon icon={DashedLineCircleIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <EmptyDescription>
            Need help? <a href="#">Contact support</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </Example>
  );
}

function EmptyInCard() {
  return (
    <Example title="In Card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
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
            className="text-muted-foreground"
            nativeButton={false}
          >
            Learn more <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
          </Button>
        </EmptyContent>
      </Empty>
    </Example>
  );
}
