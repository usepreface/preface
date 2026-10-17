/*
 * Preface UI icons.
 *
 * Hugeicons Free (MIT), stroke-rounded on a 24px grid, drawn at 1.5px like the Figma kit
 * (page 08 Iconography). Each icon is a React component with a Preface name:
 *
 *   import { SearchIcon } from "@usepreface/ui/icons"
 *   <SearchIcon />                 // 16px, currentColor
 *   <SearchIcon size={20} />
 *
 * For any other Hugeicons glyph, use <Icon icon={SomeIcon} /> with an icon from
 * "@hugeicons/core-free-icons". Company logos live in "@usepreface/ui/logos".
 */
import * as React from "react";

import {
  Activity01Icon as Activity01Glyph,
  Add01Icon as Add01Glyph,
  AiBrain01Icon as AiBrain01Glyph,
  AiChat02Icon as AiChat02Glyph,
  AiNetworkIcon as AiNetworkGlyph,
  AiSearchIcon as AiSearchGlyph,
  Alert02Icon as Alert02Glyph,
  AlertCircleIcon as AlertCircleGlyph,
  Analytics01Icon as Analytics01Glyph,
  ApiIcon as ApiGlyph,
  ArrowDown01Icon as ArrowDown01Glyph,
  ArrowDown02Icon as ArrowDown02Glyph,
  ArrowLeft01Icon as ArrowLeft01Glyph,
  ArrowLeft02Icon as ArrowLeft02Glyph,
  ArrowRight01Icon as ArrowRight01Glyph,
  ArrowRight02Icon as ArrowRight02Glyph,
  ArrowUp01Icon as ArrowUp01Glyph,
  ArrowUp02Icon as ArrowUp02Glyph,
  ArrowUpRight01Icon as ArrowUpRight01Glyph,
  Attachment01Icon as Attachment01Glyph,
  Book02Icon as Book02Glyph,
  BookOpen01Icon as BookOpen01Glyph,
  BotIcon as BotGlyph,
  BrowserIcon as BrowserGlyph,
  BubbleChatIcon as BubbleChatGlyph,
  Bug01Icon as Bug01Glyph,
  Building03Icon as Building03Glyph,
  Calendar03Icon as Calendar03Glyph,
  Cancel01Icon as Cancel01Glyph,
  CancelCircleIcon as CancelCircleGlyph,
  ChartHistogramIcon as ChartHistogramGlyph,
  ChatBotIcon as ChatBotGlyph,
  CheckmarkCircle02Icon as CheckmarkCircle02Glyph,
  Clock01Icon as Clock01Glyph,
  CloudServerIcon as CloudServerGlyph,
  CodeIcon as CodeGlyph,
  CodeSquareIcon as CodeSquareGlyph,
  CommandIcon as CommandGlyph,
  CommandLineIcon as CommandLineGlyph,
  ComputerIcon as ComputerGlyph,
  ContainerIcon as ContainerGlyph,
  Copy01Icon as Copy01Glyph,
  CpuIcon as CpuGlyph,
  CubeIcon as CubeGlyph,
  DashboardSquare01Icon as DashboardSquare01Glyph,
  Database02Icon as Database02Glyph,
  Delete02Icon as Delete02Glyph,
  Download01Icon as Download01Glyph,
  DragDropVerticalIcon as DragDropVerticalGlyph,
  File01Icon as File01Glyph,
  FilterIcon as FilterGlyph,
  FlashIcon as FlashGlyph,
  Folder01Icon as Folder01Glyph,
  GitBranchIcon as GitBranchGlyph,
  GitPullRequestIcon as GitPullRequestGlyph,
  Globe02Icon as Globe02Glyph,
  GridViewIcon as GridViewGlyph,
  HashtagIcon as HashtagGlyph,
  HelpCircleIcon as HelpCircleGlyph,
  Home01Icon as Home01Glyph,
  Image01Icon as Image01Glyph,
  InboxIcon as InboxGlyph,
  InformationCircleIcon as InformationCircleGlyph,
  Key01Icon as Key01Glyph,
  Layers01Icon as Layers01Glyph,
  Link01Icon as Link01Glyph,
  LinkSquare02Icon as LinkSquare02Glyph,
  Loading03Icon as Loading03Glyph,
  LockKeyIcon as LockKeyGlyph,
  Logout01Icon as Logout01Glyph,
  Mail01Icon as Mail01Glyph,
  McpServerIcon as McpServerGlyph,
  Menu01Icon as Menu01Glyph,
  MessageQuestionIcon as MessageQuestionGlyph,
  Mic01Icon as Mic01Glyph,
  MinusSignIcon as MinusSignGlyph,
  Moon02Icon as Moon02Glyph,
  MoreHorizontalIcon as MoreHorizontalGlyph,
  Notification01Icon as Notification01Glyph,
  PackageIcon as PackageGlyph,
  PauseIcon as PauseGlyph,
  Pdf01Icon as Pdf01Glyph,
  PencilEdit01Icon as PencilEdit01Glyph,
  PlayIcon as PlayGlyph,
  PlugSocketIcon as PlugSocketGlyph,
  RefreshIcon as RefreshGlyph,
  ReloadIcon as ReloadGlyph,
  Robot01Icon as Robot01Glyph,
  Search01Icon as Search01Glyph,
  SentIcon as SentGlyph,
  ServerStack01Icon as ServerStack01Glyph,
  Settings02Icon as Settings02Glyph,
  Share03Icon as Share03Glyph,
  Shield01Icon as Shield01Glyph,
  SidebarLeftIcon as SidebarLeftGlyph,
  SlidersHorizontalIcon as SlidersHorizontalGlyph,
  SourceCodeIcon as SourceCodeGlyph,
  SparklesIcon as SparklesGlyph,
  SquareLock02Icon as SquareLock02Glyph,
  StarIcon as StarGlyph,
  StopCircleIcon as StopCircleGlyph,
  Sun03Icon as Sun03Glyph,
  TableIcon as TableGlyph,
  ThumbsDownIcon as ThumbsDownGlyph,
  ThumbsUpIcon as ThumbsUpGlyph,
  Tick02Icon as Tick02Glyph,
  UnfoldMoreIcon as UnfoldMoreGlyph,
  Upload01Icon as Upload01Glyph,
  UserCircleIcon as UserCircleGlyph,
  UserGroupIcon as UserGroupGlyph,
  UserIcon as UserGlyph,
  ViewIcon as ViewGlyph,
  ViewOffSlashIcon as ViewOffSlashGlyph,
  WebhookIcon as WebhookGlyph,
  Wifi01Icon as Wifi01Glyph,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "../lib/utils";

export type IconProps = Omit<React.ComponentProps<"svg">, "ref"> & {
  /** Pixel size. Defaults to 16, the Figma "size/icon-md". */
  size?: number | string;
  /** Stroke width on the 24px grid. Defaults to 1.5. */
  strokeWidth?: number;
};

export type IconComponent = React.FC<IconProps> & { iconName: string; data: IconSvgElement };

/** Renders any Hugeicons glyph with Preface defaults. */
function Icon({
  icon,
  size = 16,
  strokeWidth = 1.5,
  className,
  ...props
}: IconProps & { icon: IconSvgElement }) {
  return (
    <HugeiconsIcon
      data-slot="icon"
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
}

function createIcon(data: IconSvgElement, iconName: string): IconComponent {
  const Component = (props: IconProps) => <Icon icon={data} {...props} />;
  Component.displayName = iconName;
  return Object.assign(Component, { iconName, data });
}

// Navigation
export const HomeIcon = createIcon(Home01Glyph, "HomeIcon");
export const DashboardIcon = createIcon(DashboardSquare01Glyph, "DashboardIcon");
export const InboxIcon = createIcon(InboxGlyph, "InboxIcon");
export const SearchIcon = createIcon(Search01Glyph, "SearchIcon");
export const MenuIcon = createIcon(Menu01Glyph, "MenuIcon");
export const SidebarIcon = createIcon(SidebarLeftGlyph, "SidebarIcon");
export const GridIcon = createIcon(GridViewGlyph, "GridIcon");
export const SettingsIcon = createIcon(Settings02Glyph, "SettingsIcon");
export const SlidersIcon = createIcon(SlidersHorizontalGlyph, "SlidersIcon");
export const FilterIcon = createIcon(FilterGlyph, "FilterIcon");
export const HashIcon = createIcon(HashtagGlyph, "HashIcon");
export const LogoutIcon = createIcon(Logout01Glyph, "LogoutIcon");

// Arrows
export const ChevronDownIcon = createIcon(ArrowDown01Glyph, "ChevronDownIcon");
export const ChevronUpIcon = createIcon(ArrowUp01Glyph, "ChevronUpIcon");
export const ChevronLeftIcon = createIcon(ArrowLeft01Glyph, "ChevronLeftIcon");
export const ChevronRightIcon = createIcon(ArrowRight01Glyph, "ChevronRightIcon");
export const ChevronsUpDownIcon = createIcon(UnfoldMoreGlyph, "ChevronsUpDownIcon");
export const ArrowRightIcon = createIcon(ArrowRight02Glyph, "ArrowRightIcon");
export const ArrowLeftIcon = createIcon(ArrowLeft02Glyph, "ArrowLeftIcon");
export const ArrowUpIcon = createIcon(ArrowUp02Glyph, "ArrowUpIcon");
export const ArrowDownIcon = createIcon(ArrowDown02Glyph, "ArrowDownIcon");
export const ArrowUpRightIcon = createIcon(ArrowUpRight01Glyph, "ArrowUpRightIcon");
export const ExternalLinkIcon = createIcon(LinkSquare02Glyph, "ExternalLinkIcon");

// Actions
export const PlusIcon = createIcon(Add01Glyph, "PlusIcon");
export const MinusIcon = createIcon(MinusSignGlyph, "MinusIcon");
export const CheckIcon = createIcon(Tick02Glyph, "CheckIcon");
export const CloseIcon = createIcon(Cancel01Glyph, "CloseIcon");
export const CopyIcon = createIcon(Copy01Glyph, "CopyIcon");
export const EditIcon = createIcon(PencilEdit01Glyph, "EditIcon");
export const TrashIcon = createIcon(Delete02Glyph, "TrashIcon");
export const RefreshIcon = createIcon(RefreshGlyph, "RefreshIcon");
export const RetryIcon = createIcon(ReloadGlyph, "RetryIcon");
export const UploadIcon = createIcon(Upload01Glyph, "UploadIcon");
export const DownloadIcon = createIcon(Download01Glyph, "DownloadIcon");
export const ShareIcon = createIcon(Share03Glyph, "ShareIcon");
export const LinkIcon = createIcon(Link01Glyph, "LinkIcon");
export const MoreHorizontalIcon = createIcon(MoreHorizontalGlyph, "MoreHorizontalIcon");
export const PlayIcon = createIcon(PlayGlyph, "PlayIcon");
export const PauseIcon = createIcon(PauseGlyph, "PauseIcon");
export const StopIcon = createIcon(StopCircleGlyph, "StopIcon");
export const SendIcon = createIcon(SentGlyph, "SendIcon");
export const PaperclipIcon = createIcon(Attachment01Glyph, "PaperclipIcon");
export const MicIcon = createIcon(Mic01Glyph, "MicIcon");
export const ThumbsUpIcon = createIcon(ThumbsUpGlyph, "ThumbsUpIcon");
export const ThumbsDownIcon = createIcon(ThumbsDownGlyph, "ThumbsDownIcon");
export const StarIcon = createIcon(StarGlyph, "StarIcon");
export const DragIcon = createIcon(DragDropVerticalGlyph, "DragIcon");
export const EyeIcon = createIcon(ViewGlyph, "EyeIcon");
export const EyeOffIcon = createIcon(ViewOffSlashGlyph, "EyeOffIcon");

// Status
export const InfoIcon = createIcon(InformationCircleGlyph, "InfoIcon");
export const HelpIcon = createIcon(HelpCircleGlyph, "HelpIcon");
export const AlertIcon = createIcon(Alert02Glyph, "AlertIcon");
export const AlertCircleIcon = createIcon(AlertCircleGlyph, "AlertCircleIcon");
export const CheckCircleIcon = createIcon(CheckmarkCircle02Glyph, "CheckCircleIcon");
export const XCircleIcon = createIcon(CancelCircleGlyph, "XCircleIcon");
export const ClockIcon = createIcon(Clock01Glyph, "ClockIcon");
export const LoaderIcon = createIcon(Loading03Glyph, "LoaderIcon");
export const BellIcon = createIcon(Notification01Glyph, "BellIcon");
export const ActivityIcon = createIcon(Activity01Glyph, "ActivityIcon");
export const ZapIcon = createIcon(FlashGlyph, "ZapIcon");
export const WifiIcon = createIcon(Wifi01Glyph, "WifiIcon");

// Product
export const SparklesIcon = createIcon(SparklesGlyph, "SparklesIcon");
export const AiChatIcon = createIcon(AiChat02Glyph, "AiChatIcon");
export const AiSearchIcon = createIcon(AiSearchGlyph, "AiSearchIcon");
export const BrainIcon = createIcon(AiBrain01Glyph, "BrainIcon");
export const NetworkIcon = createIcon(AiNetworkGlyph, "NetworkIcon");
export const ChatIcon = createIcon(BubbleChatGlyph, "ChatIcon");
export const QuestionIcon = createIcon(MessageQuestionGlyph, "QuestionIcon");
export const ChatBotIcon = createIcon(ChatBotGlyph, "ChatBotIcon");
export const BotIcon = createIcon(BotGlyph, "BotIcon");
export const RobotIcon = createIcon(Robot01Glyph, "RobotIcon");
export const McpIcon = createIcon(McpServerGlyph, "McpIcon");
export const PlugIcon = createIcon(PlugSocketGlyph, "PlugIcon");
export const WebhookIcon = createIcon(WebhookGlyph, "WebhookIcon");
export const ApiIcon = createIcon(ApiGlyph, "ApiIcon");
export const LayersIcon = createIcon(Layers01Glyph, "LayersIcon");
export const DatabaseIcon = createIcon(Database02Glyph, "DatabaseIcon");
export const ServerIcon = createIcon(ServerStack01Glyph, "ServerIcon");
export const CloudIcon = createIcon(CloudServerGlyph, "CloudIcon");
export const ContainerIcon = createIcon(ContainerGlyph, "ContainerIcon");
export const CpuIcon = createIcon(CpuGlyph, "CpuIcon");
export const PackageIcon = createIcon(PackageGlyph, "PackageIcon");
export const CubeIcon = createIcon(CubeGlyph, "CubeIcon");
export const ChartIcon = createIcon(ChartHistogramGlyph, "ChartIcon");
export const AnalyticsIcon = createIcon(Analytics01Glyph, "AnalyticsIcon");
export const BrowserIcon = createIcon(BrowserGlyph, "BrowserIcon");
export const GlobeIcon = createIcon(Globe02Glyph, "GlobeIcon");

// Security
export const KeyIcon = createIcon(Key01Glyph, "KeyIcon");
export const LockIcon = createIcon(SquareLock02Glyph, "LockIcon");
export const LockKeyIcon = createIcon(LockKeyGlyph, "LockKeyIcon");
export const ShieldIcon = createIcon(Shield01Glyph, "ShieldIcon");

// People
export const UserIcon = createIcon(UserGlyph, "UserIcon");
export const UserCircleIcon = createIcon(UserCircleGlyph, "UserCircleIcon");
export const UsersIcon = createIcon(UserGroupGlyph, "UsersIcon");
export const BuildingIcon = createIcon(Building03Glyph, "BuildingIcon");
export const MailIcon = createIcon(Mail01Glyph, "MailIcon");

// Content
export const FileIcon = createIcon(File01Glyph, "FileIcon");
export const FolderIcon = createIcon(Folder01Glyph, "FolderIcon");
export const BookIcon = createIcon(BookOpen01Glyph, "BookIcon");
export const NotebookIcon = createIcon(Book02Glyph, "NotebookIcon");
export const PdfIcon = createIcon(Pdf01Glyph, "PdfIcon");
export const ImageIcon = createIcon(Image01Glyph, "ImageIcon");
export const TableIcon = createIcon(TableGlyph, "TableIcon");
export const CalendarIcon = createIcon(Calendar03Glyph, "CalendarIcon");

// Developer
export const CodeIcon = createIcon(SourceCodeGlyph, "CodeIcon");
export const CodeTagIcon = createIcon(CodeGlyph, "CodeTagIcon");
export const CodeSquareIcon = createIcon(CodeSquareGlyph, "CodeSquareIcon");
export const TerminalIcon = createIcon(CommandLineGlyph, "TerminalIcon");
export const CommandIcon = createIcon(CommandGlyph, "CommandIcon");
export const GitBranchIcon = createIcon(GitBranchGlyph, "GitBranchIcon");
export const GitPullRequestIcon = createIcon(GitPullRequestGlyph, "GitPullRequestIcon");
export const BugIcon = createIcon(Bug01Glyph, "BugIcon");

// Theme
export const SunIcon = createIcon(Sun03Glyph, "SunIcon");
export const MoonIcon = createIcon(Moon02Glyph, "MoonIcon");
export const ComputerIcon = createIcon(ComputerGlyph, "ComputerIcon");

/** Every Preface icon, grouped as in the Figma iconography page. Used by the icon gallery. */
export const iconGroups = {
  Navigation: {
    HomeIcon,
    DashboardIcon,
    InboxIcon,
    SearchIcon,
    MenuIcon,
    SidebarIcon,
    GridIcon,
    SettingsIcon,
    SlidersIcon,
    FilterIcon,
    HashIcon,
    LogoutIcon,
  },
  Arrows: {
    ChevronDownIcon,
    ChevronUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsUpDownIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowUpRightIcon,
    ExternalLinkIcon,
  },
  Actions: {
    PlusIcon,
    MinusIcon,
    CheckIcon,
    CloseIcon,
    CopyIcon,
    EditIcon,
    TrashIcon,
    RefreshIcon,
    RetryIcon,
    UploadIcon,
    DownloadIcon,
    ShareIcon,
    LinkIcon,
    MoreHorizontalIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    SendIcon,
    PaperclipIcon,
    MicIcon,
    ThumbsUpIcon,
    ThumbsDownIcon,
    StarIcon,
    DragIcon,
    EyeIcon,
    EyeOffIcon,
  },
  Status: {
    InfoIcon,
    HelpIcon,
    AlertIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    LoaderIcon,
    BellIcon,
    ActivityIcon,
    ZapIcon,
    WifiIcon,
  },
  Product: {
    SparklesIcon,
    AiChatIcon,
    AiSearchIcon,
    BrainIcon,
    NetworkIcon,
    ChatIcon,
    QuestionIcon,
    ChatBotIcon,
    BotIcon,
    RobotIcon,
    McpIcon,
    PlugIcon,
    WebhookIcon,
    ApiIcon,
    LayersIcon,
    DatabaseIcon,
    ServerIcon,
    CloudIcon,
    ContainerIcon,
    CpuIcon,
    PackageIcon,
    CubeIcon,
    ChartIcon,
    AnalyticsIcon,
    BrowserIcon,
    GlobeIcon,
  },
  Security: { KeyIcon, LockIcon, LockKeyIcon, ShieldIcon },
  People: { UserIcon, UserCircleIcon, UsersIcon, BuildingIcon, MailIcon },
  Content: {
    FileIcon,
    FolderIcon,
    BookIcon,
    NotebookIcon,
    PdfIcon,
    ImageIcon,
    TableIcon,
    CalendarIcon,
  },
  Developer: {
    CodeIcon,
    CodeTagIcon,
    CodeSquareIcon,
    TerminalIcon,
    CommandIcon,
    GitBranchIcon,
    GitPullRequestIcon,
    BugIcon,
  },
  Theme: { SunIcon, MoonIcon, ComputerIcon },
} as const satisfies Record<string, Record<string, IconComponent>>;

export { Icon, createIcon, HugeiconsIcon };
export type { IconSvgElement };
