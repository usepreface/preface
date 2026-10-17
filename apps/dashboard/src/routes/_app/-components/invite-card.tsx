import * as React from "react";

import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";

import { placeholder } from "../../../lib/placeholder";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The owner row and an invite field. Invites only live in this component's state for now. */
export function InviteCard() {
  const { owner } = placeholder;
  const domain = owner.email.split("@")[1] ?? "acme.dev";
  const [email, setEmail] = React.useState("");
  const [invited, setInvited] = React.useState<string[]>([]);
  const members = 1 + invited.length;

  return (
    <section
      aria-labelledby="invite-title"
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-4"
    >
      <div className="flex items-center gap-2">
        <h2 id="invite-title" className="flex-1 text-sm font-semibold text-foreground">
          Invite your team
        </h2>
        <span className="text-xs text-fg-tertiary">
          {members} {members === 1 ? "member" : "members"}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        <li className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {owner.initials}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{owner.name}</span>
            <span className="truncate text-xs text-fg-tertiary">{owner.email}</span>
          </span>
          <Badge tone="info">Owner</Badge>
        </li>
        {invited.map((address) => (
          <li
            key={address}
            className="flex animate-in items-center gap-2.5 duration-300 fade-in-0 slide-in-from-top-1"
          >
            <Avatar>
              <AvatarFallback>{address.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{address}</span>
            <Badge variant="outline">Invited</Badge>
          </li>
        ))}
      </ul>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = email.trim().toLowerCase();
          if (EMAIL.test(next) && !invited.includes(next) && next !== owner.email) {
            setInvited((list) => [...list, next]);
            setEmail("");
          }
        }}
      >
        <Input
          type="email"
          aria-label="Email to invite"
          placeholder={`name@${domain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={!EMAIL.test(email.trim())}>
          Invite
        </Button>
      </form>
    </section>
  );
}
