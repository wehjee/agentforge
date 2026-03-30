export type Channel = "WIDGET" | "API" | "SLACK" | "SCHEDULED" | "PLAYGROUND";
export type Environment = "DEV" | "STAGING" | "PROD";

export interface WidgetConfig {
  primaryColor: string;
  position: "bottom-right" | "bottom-left";
  welcomeMessage: string;
  avatarUrl?: string;
  windowWidth: number;
  windowHeight: number;
  showPreChatForm: boolean;
  preChatFields: PreChatField[];
  allowedDomains: string[];
}

export interface PreChatField {
  name: string;
  label: string;
  type: "text" | "email";
  required: boolean;
}

export interface SlackConfig {
  botToken?: string;
  signingSecret?: string;
  appId?: string;
  teamId?: string;
  channels: string[];
  threadAware: boolean;
}

export interface ScheduledConfig {
  cronExpr: string;
  timezone: string;
  outputRouting: "database" | "webhook" | "email";
  webhookUrl?: string;
  emailTo?: string;
  inputVariables?: Record<string, string>;
}

export interface ApiChannelConfig {
  rateLimit: number; // requests per minute
  corsOrigins: string[];
}

export type DeploymentConfig = WidgetConfig | SlackConfig | ScheduledConfig | ApiChannelConfig;

export interface Deployment {
  id: string;
  channel: Channel;
  environment: Environment;
  config: DeploymentConfig;
  agentVersion: number;
  isActive: boolean;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string; // only returned on creation, masked otherwise
  prefix: string; // e.g. "af_...xxxx"
  lastUsedAt: string | null;
  workspaceId: string;
  createdAt: string;
}

export interface VersionPromotion {
  fromEnvironment: Environment;
  toEnvironment: Environment;
  agentVersion: number;
}

export interface VersionDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
