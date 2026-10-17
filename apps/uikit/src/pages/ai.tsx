import * as React from "react";

import { AgentSteps, Reasoning, SearchStep, ToolCall } from "@usepreface/ui/ai/agent-steps";
import {
  AssistantMessage,
  ChatLauncher,
  EscalationCard,
  FeedbackBar,
  Suggestion,
  Suggestions,
  ThinkingIndicator,
  UserMessage,
} from "@usepreface/ui/ai/chat";
import {
  CitationChip,
  CitationList,
  InlineCitation,
  type CitationSource,
} from "@usepreface/ui/ai/citation";
import {
  Composer,
  ComposerActions,
  ComposerAttach,
  ComposerHint,
  ComposerInput,
  ComposerScope,
  ComposerSubmit,
} from "@usepreface/ui/ai/composer";
import { RetrievalTrace, SourceItem, SourceList } from "@usepreface/ui/ai/sources";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@usepreface/ui/components/message-scroller";
import { NotionLogo } from "@usepreface/ui/logos";
import { CodeSnippet } from "@usepreface/ui/preface/code-snippet";
import { InlineCode } from "@usepreface/ui/preface/data-display";

import { Page, Section, Specimen } from "../components/bench";

const citations: CitationSource[] = [
  {
    index: 1,
    title: "Rotating staging credentials",
    source: "notion",
    path: "Engineering / Runbooks",
    snippet:
      "Run `ops db rotate --env staging --restart api`. The API pods pick up the new secret on restart.",
    href: "https://notion.so",
    score: 0.92,
  },
  {
    index: 2,
    title: "deploy.yml · acme/platform",
    source: "github",
    path: ".github/workflows",
    snippet:
      "The pipeline pins DATABASE_URL at the start of a deploy and releases it when the run completes.",
    href: "https://github.com",
    score: 0.81,
  },
  {
    index: 3,
    title: "#infra · Mar 12",
    source: "slack",
    path: "Slack · thread, 14 replies",
    snippet:
      "Heads up: wait for in-flight deploys before rotating, otherwise the old secret sticks around.",
    href: "https://slack.com",
    score: 0.64,
  },
];

const scopes = [
  { value: "all", label: "All collections" },
  { value: "eng", label: "Engineering" },
  { value: "support", label: "Support" },
  { value: "public", label: "Public docs" },
];

const answerText =
  "Staging credentials live in Vault under secret/staging/db. Rotate them with the ops CLI, then restart the API pods so they pick up the new secret.";

type Turn = { id: string; question: string; streaming: boolean };

function useStreamedText(full: string, active: boolean) {
  const [n, setN] = React.useState(active ? 0 : full.length);
  React.useEffect(() => {
    if (!active) {
      setN(full.length);
      return;
    }
    setN(0);
    const timer = setInterval(() => setN((v) => (v >= full.length ? v : v + 3)), 24);
    return () => clearInterval(timer);
  }, [full, active]);
  return { text: full.slice(0, n), done: n >= full.length };
}

function Answer({ turn, onDone }: { turn: Turn; onDone: () => void }) {
  const [phase, setPhase] = React.useState<"search" | "read" | "write">(
    turn.streaming ? "search" : "write",
  );
  React.useEffect(() => {
    if (!turn.streaming) {
      return;
    }
    const a = setTimeout(() => setPhase("read"), 900);
    const b = setTimeout(() => setPhase("write"), 1800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [turn.streaming]);
  const { text, done } = useStreamedText(answerText, turn.streaming && phase === "write");
  React.useEffect(() => {
    if (turn.streaming && done && phase === "write") {
      onDone();
    }
  }, [turn.streaming, done, phase, onDone]);

  if (phase !== "write") {
    return (
      <AssistantMessage meta="working…">
        <ThinkingIndicator stage={phase === "search" ? "searching" : "reading"} />
      </AssistantMessage>
    );
  }
  return (
    <AssistantMessage meta={done ? "3 sources · 1.4s" : "writing…"}>
      <AgentSteps>
        <SearchStep query="Notion, GitHub and Slack" results={12} />
        <Reasoning seconds={2}>
          The question is about staging credentials. The runbook in Notion is the most specific
          source; the deploy workflow explains the timing caveat.
        </Reasoning>
      </AgentSteps>
      <p>
        {text}
        {done ? (
          <InlineCitation citation={citations[0]} />
        ) : (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-caret bg-primary align-middle" />
        )}
      </p>
      {done ? (
        <>
          <CodeSnippet
            samples={[
              {
                label: "Terminal",
                language: "bash",
                code: "ops db rotate --env staging --restart api",
              },
            ]}
          />
          <p>
            Rotation takes about two minutes. If a deploy is running, wait for it to finish - the
            pipeline pins the old secret until it completes
            <InlineCitation citation={citations[1]} />
            <InlineCitation citation={citations[2]} />.
          </p>
          <CitationList>
            {citations.map((c) => (
              <CitationChip key={c.index} citation={c} />
            ))}
          </CitationList>
          <FeedbackBar text={answerText} onRetry={() => undefined} />
        </>
      ) : null}
    </AssistantMessage>
  );
}

function ChatDemo() {
  const [turns, setTurns] = React.useState<Turn[]>([
    { id: "t0", question: "How do I rotate the staging database credentials?", streaming: false },
  ]);
  const [scope, setScope] = React.useState("all");
  const streaming = turns.some((t) => t.streaming);
  const ask = (question: string) =>
    setTurns((all) => [...all, { id: `t${all.length}`, question, streaming: true }]);
  const finish = React.useCallback(
    (id: string) =>
      setTurns((all) => all.map((t) => (t.id === id ? { ...t, streaming: false } : t))),
    [],
  );
  return (
    <MessageScrollerProvider>
      <div className="flex h-[720px] flex-col overflow-hidden rounded-2xl border bg-background">
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
              {turns.length === 0 ? (
                <Suggestions>
                  <Suggestion onClick={() => ask("How do I self-host Preface?")}>
                    How do I self-host Preface?
                  </Suggestion>
                </Suggestions>
              ) : null}
              {turns.map((turn) => (
                <MessageScrollerItem
                  key={turn.id}
                  messageId={turn.id}
                  className="flex flex-col gap-6"
                >
                  <UserMessage>{turn.question}</UserMessage>
                  <Answer turn={turn} onDone={() => finish(turn.id)} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-6 pb-6">
          <Suggestions>
            {[
              "How do we deploy the widget on docs.acme.dev?",
              "Which sources are failing?",
              "What changed in v1.4?",
            ].map((q) => (
              <Suggestion key={q} disabled={streaming} onClick={() => ask(q)}>
                {q}
              </Suggestion>
            ))}
          </Suggestions>
          <Composer onSubmit={ask} status={streaming ? "streaming" : "idle"}>
            <ComposerInput placeholder="Ask anything about Acme…" />
            <ComposerActions>
              <ComposerAttach />
              <ComposerScope value={scope} onValueChange={setScope} options={scopes} />
              <ComposerHint />
              <ComposerSubmit
                onStop={() => setTurns((all) => all.map((t) => ({ ...t, streaming: false })))}
              />
            </ComposerActions>
          </Composer>
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

export function AiPage() {
  return (
    <Page
      figma="30 Chat components · 34 Chat widget"
      title="AI & chat"
      description="AI Elements patterns on Base UI, in Preface style. The thread below streams a scripted answer: send a message or pick a suggestion."
    >
      <Section title="Live thread">
        <ChatDemo />
      </Section>

      <Section title="Citations" className="grid gap-4 md:grid-cols-2">
        <Specimen label="Inline citation · hover or focus the number">
          <p className="text-sm leading-relaxed">
            Rotate the secret with the ops CLI, then restart the API pods
            <InlineCitation citation={citations[0]} />. Wait for running deploys first
            <InlineCitation citation={citations[1]} />.
          </p>
        </Specimen>
        <Specimen label="Citation chips">
          <CitationList>
            {citations.map((c) => (
              <CitationChip key={c.index} citation={c} />
            ))}
          </CitationList>
        </Specimen>
      </Section>

      <Section title="Sources & retrieval" className="grid gap-4 md:grid-cols-2">
        <Specimen label="Source items">
          <SourceList className="w-full">
            {citations.map((c) => (
              <SourceItem
                key={c.index}
                index={c.index}
                title={c.title}
                path={c.path}
                source={c.source}
                href={c.href}
              />
            ))}
          </SourceList>
        </Specimen>
        <Specimen label="Retrieval trace">
          <RetrievalTrace
            className="w-full"
            summary="Hybrid (BM25 + vector) · reranked · 12 → 3"
            chunks={citations.map((c) => ({
              title: c.title,
              source: c.source ?? "notion",
              path: c.path,
              score: c.score ?? 0,
              href: c.href,
            }))}
          />
        </Specimen>
      </Section>

      <Section title="Agent steps" className="grid gap-4 md:grid-cols-2">
        <Specimen label="Running">
          <AgentSteps>
            <SearchStep query="Notion" running />
            <Reasoning running>Looking for the runbook that covers staging databases…</Reasoning>
            <ToolCall name="Running ops db status" state="running" />
          </AgentSteps>
        </Specimen>
        <Specimen label="Done and failed">
          <AgentSteps>
            <SearchStep query="GitHub" results={8} />
            <Reasoning seconds={4}>
              Two sources disagree on the restart order; the workflow file is newer.
            </Reasoning>
            <ToolCall
              name="Ran ops db rotate"
              description="1.2s"
              input="ops db rotate --env staging --restart api"
              output={"Rotated secret/staging/db\nRestarted api (3/3 pods)"}
            />
            <ToolCall
              name="Fetch Jira ticket"
              state="error"
              input="GET /rest/api/3/issue/OPS-412"
              output="401 · token expired"
            />
          </AgentSteps>
        </Specimen>
      </Section>

      <Section title="Thinking, feedback & hand-off" className="grid gap-4 md:grid-cols-2">
        <Specimen
          label="Thinking indicator · searching, reading, writing"
          className="flex-col items-start"
        >
          <ThinkingIndicator stage="searching" />
          <ThinkingIndicator stage="reading">
            Reading <NotionLogo size={12} className="mx-0.5 inline" /> Runbooks / Staging…
          </ThinkingIndicator>
          <ThinkingIndicator stage="writing" />
        </Specimen>
        <Specimen label="Feedback bar and escalation" className="flex-col items-stretch">
          <FeedbackBar text={answerText} onRetry={() => undefined} />
          <FeedbackBar value="up" />
          <FeedbackBar value="down" />
          <EscalationCard />
        </Specimen>
      </Section>

      <Section title="Composer" className="grid gap-4 md:grid-cols-2">
        <Specimen label="Default" className="items-stretch">
          <Composer>
            <ComposerInput placeholder="Ask anything about Acme…" />
            <ComposerActions>
              <ComposerAttach />
              <ComposerScope value="all" onValueChange={() => undefined} options={scopes} />
              <ComposerHint />
              <ComposerSubmit />
            </ComposerActions>
          </Composer>
        </Specimen>
        <Specimen label="Disabled · no sources yet" className="items-stretch">
          <Composer disabled>
            <ComposerInput placeholder="Connect a source to start asking" />
            <ComposerActions>
              <ComposerAttach />
              <ComposerHint />
              <ComposerSubmit />
            </ComposerActions>
          </Composer>
        </Specimen>
      </Section>

      <Section title="Code" className="flex flex-col gap-4">
        <CodeSnippet
          title="POST /v1/answers"
          samples={[
            {
              label: "cURL",
              language: "bash",
              code: `curl https://preface.acme.dev/v1/answers \\\n  -H "Authorization: Bearer $PREFACE_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "question": "How do I rotate staging credentials?", "stream": true }'`,
            },
            {
              label: "Python",
              language: "python",
              code: `from preface import Preface\n\nclient = Preface(api_key=os.environ["PREFACE_KEY"])\nanswer = client.answers.create(question="How do I rotate staging credentials?")\nprint(answer.text, answer.citations)`,
            },
            {
              label: "TypeScript",
              language: "typescript",
              code: `import { createPreface } from "@usepreface/ai-sdk"\nimport { streamText } from "ai"\n\nconst preface = createPreface({ baseURL: process.env.PREFACE_URL })\nconst result = streamText({ model: preface("acme-knowledge"), prompt: "How do I rotate staging credentials?" })`,
            },
          ]}
        />
        <p className="text-13 text-fg-secondary">
          Inline code reads like <InlineCode>secret/staging/db</InlineCode> in running text.
        </p>
      </Section>

      <Section
        title="Launcher"
        className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-6"
      >
        <ChatLauncher />
        <ChatLauncher label="Ask AI" />
        <ChatLauncher open />
      </Section>
    </Page>
  );
}
