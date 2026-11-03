/// <reference path="../worker-configuration.d.ts" />

type SiteRank = "normal" | "editor" | "admin";

type MemberRow = {
  id: string;
  username: string;
  password_hash: string | null;
  discord_id: string | null;
  display_name: string | null;
  site_rank: SiteRank;
  publish_permission: number;
  created_at: string;
};

type PublicMember = {
  id: string;
  username: string;
  displayName: string | null;
  siteRank: SiteRank;
  publishPermission: boolean;
  discordLinked: boolean;
  languages: Array<"de" | "fr" | "ru" | "es">;
};

interface Env {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_ROLE_EDITOR?: string;
  DISCORD_ROLE_ADMIN?: string;
  DISCORD_BENBEN_CHANNEL_ID?: string;
  DISCORD_BENBEN_MESSAGE_ID?: string;
  BOOTSTRAP_ADMIN_USERNAME?: string;
  ASSETS?: R2Bucket;
  BENBEN?: DurableObjectNamespace;
}

declare namespace Cloudflare {
  interface Env {
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    DISCORD_REDIRECT_URI?: string;
    DISCORD_BOT_TOKEN?: string;
    DISCORD_GUILD_ID?: string;
    DISCORD_ROLE_EDITOR?: string;
    DISCORD_ROLE_ADMIN?: string;
    DISCORD_BENBEN_CHANNEL_ID?: string;
    DISCORD_BENBEN_MESSAGE_ID?: string;
    BOOTSTRAP_ADMIN_USERNAME?: string;
    ASSETS?: R2Bucket;
    BENBEN?: DurableObjectNamespace;
  }
}

declare namespace App {
  interface Locals {
    member: PublicMember | null;
    discordEnabled: boolean;
    uiOverrides: Partial<Record<string, string>> | null;
  }
}
