import { expect } from "@playwright/test";

import type { Infrastructure } from "./infrastructure.js";

interface MailSummary {
  ID: string;
  Subject: string;
  To: readonly { Address: string }[];
}
interface MailMessage {
  ID: string;
  Text: string;
}

export class Mailbox {
  private readonly consumed = new Set<string>();
  constructor(private readonly infrastructure: Infrastructure) {}

  private async next(recipient: string, subject: RegExp): Promise<MailMessage> {
    let selected: MailSummary | undefined;
    await expect
      .poll(
        async () => {
          const response = await this.infrastructure.control.get(
            `${this.infrastructure.mailOrigin}/api/v1/messages`,
          );
          expect(response.ok()).toBe(true);
          const inbox: { messages: readonly MailSummary[] } = await response.json();
          selected = inbox.messages.find(
            (message) =>
              !this.consumed.has(message.ID) &&
              subject.test(message.Subject) &&
              message.To.some((address) => address.Address === recipient),
          );
          return selected?.ID;
        },
        { message: `SMTP delivery to ${recipient}`, timeout: 20_000 },
      )
      .toBeTruthy();
    if (selected === undefined) throw new Error("SMTP message was not selected");
    this.consumed.add(selected.ID);
    const response = await this.infrastructure.control.get(
      `${this.infrastructure.mailOrigin}/api/v1/message/${selected.ID}`,
    );
    expect(response.ok()).toBe(true);
    return response.json();
  }

  async code(recipient: string) {
    const message = await this.next(
      recipient,
      /^(Verify your email|Your Preface sign-in code|Confirm your Preface account action)/,
    );
    const code = message.Text.match(/\b\d{8}\b/)?.[0];
    if (code === undefined) throw new Error("Missing eight-digit code in delivered email");
    return code;
  }

  async signInLink(recipient: string) {
    const message = await this.next(recipient, /^Your Preface sign-in code/);
    const link = message.Text.match(/https:\/\/localhost:\d+\/auth\/email\/verify#[^\s]+/)?.[0];
    if (link === undefined) throw new Error("Missing sign-in URL in delivered email");
    return new URL(link);
  }

  async invitation(recipient: string) {
    const message = await this.next(recipient, /^You're invited/);
    const link = message.Text.match(/https:\/\/localhost:\d+\/invitations\/accept#[^\s]+/)?.[0];
    if (link === undefined) throw new Error("Missing invitation URL in delivered email");
    const parameters = new URLSearchParams(new URL(link).hash.slice(1));
    const invitationId = parameters.get("invitationId");
    const token = parameters.get("token");
    if (invitationId === null || token === null) throw new Error("Incomplete invitation URL");
    return { invitationId, token };
  }
}
