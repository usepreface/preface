import { AccessObject } from "./access";
import { AnswerObject } from "./answer";
import { BotObject } from "./bot";
import { CardObject } from "./card";
import { ChartObject } from "./chart";
import { CheckObject } from "./check";
import { ChipObject } from "./chip";
import { CloudObject } from "./cloud";
import { DatabaseObject } from "./database";
import { DocumentObject } from "./document";
import { EnvelopeObject } from "./envelope";
import { FacetPrismObject } from "./facet-prism";
import { FolderObject } from "./folder";
import { GearObject } from "./gear";
import { HourglassObject } from "./hourglass";
import { KeyObject } from "./key";
// Generated from the Figma brand kit (pages 10 Objects and 11 Illustrations) by gen/art.py.
// Every object by name, for galleries. Prefer the named exports in app code.
import { KnowledgeStackObject } from "./knowledge-stack";
import { LaptopObject } from "./laptop";
import { PackageObject } from "./package";
import { PipelineObject } from "./pipeline";
import { PlugObject } from "./plug";
import { RetrievalObject } from "./retrieval";
import { SelfHostedObject } from "./self-hosted";
import { ShieldObject } from "./shield";
import { SocketObject } from "./socket";
import { SourceObject } from "./source";
import { TerminalObject } from "./terminal";
import { TrayObject } from "./tray";
import { WebhookObject } from "./webhook";

export const objects = [
  KnowledgeStackObject,
  SourceObject,
  FacetPrismObject,
  AnswerObject,
  SelfHostedObject,
  AccessObject,
  PipelineObject,
  RetrievalObject,
  DocumentObject,
  FolderObject,
  PlugObject,
  SocketObject,
  KeyObject,
  ShieldObject,
  GearObject,
  DatabaseObject,
  TerminalObject,
  LaptopObject,
  BotObject,
  EnvelopeObject,
  HourglassObject,
  ChartObject,
  WebhookObject,
  ChipObject,
  TrayObject,
  CardObject,
  PackageObject,
  CheckObject,
  CloudObject,
] as const;
