# @usepreface/dashboard

The Preface dashboard: a Vite single-page app on TanStack Router (file-based routes). It has every
auth, organization and instance screen from the Figma "Dashboard" pages, in light and dark. It is
UI only: nothing talks to the server yet. Forms validate in the browser with the protocol's Effect
schemas, and submitting moves to the next screen or shows a toast.

```sh
pnpm --filter @usepreface/dashboard dev       # http://localhost:3000
pnpm --filter @usepreface/dashboard build
pnpm --filter @usepreface/dashboard preview   # serves the build on port 3000
```

## Routes

| Area                  | Routes                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup                 | `/setup`, `/setup/verify`, `/setup/organization`, `/organizations/new`                                                                                           |
| Sign-in               | `/sign-in`, `/sign-in/verify`, `/auth/email/verify`, `/auth/verify-email`, `/auth/reauthenticate`, `/auth/error?reason=`                                         |
| Invitations           | `/invitations/accept`                                                                                                                                            |
| Account               | `/organizations`, `/account/profile`, `/account/security`                                                                                                        |
| Organization          | `/org/:slug`, `/org/:slug/auth-recovery`                                                                                                                         |
| Organization settings | `/org/:slug/settings/` `general`, `members`, `teams`, `teams/:teamId`, `roles`, `authentication`, `connections`, `connections/:connectionId`, `domains`, `audit` |
| Instance              | `/instance`, `/instance/authentication`, `/instance/domains/:organizationId/:domainId`, `/instance/audit`                                                        |

`/` opens the organization picker. Signup is invitation-only, and only instance owners see
"New organization".

### Previewing states

Until the API is wired, screens read the state to show from `?state=` so every design state can be
opened directly. Each route's comment lists its states, for example:

- `/setup/verify?state=incorrect`, `?state=expired`
- `/sign-in?state=sso`, `?state=slug`, `?state=checking`
- `/invitations/accept?state=sso`, `signed-in`, `mismatch`, `expired`, `revoked`
- `/organizations?state=sso`, `empty`, `loading`
- `/org/acme?state=member`
- `/org/acme/settings/members?state=invite`, `roles`, `suspend`, `read-only`, `loading`, `invitations`, `no-invitations`
- `/org/acme/settings/authentication?state=readiness`, `recovery`, `required`
- `/org/acme/settings/connections/<id>?state=test-passed`, `test-failed`, `rotate`
- `/org/acme/settings/roles?state=create`, `assignments`, `no-access`

Without `?state=` a screen shows its default and moves between states as you use it.

## Structure

- `src/main.tsx`: router, theme, tooltip and toast providers.
- `src/routes/`: file routes. Route-only parts live in `-components/` beside the route; the `-`
  prefix keeps them out of the route tree.
  - `org/$slug/_app.tsx`: the organization shell. Settings pages render `SettingsFrame` from
    `settings/-components/` for the breadcrumb and settings navigation.
  - `account/route.tsx` and `instance/route.tsx`: the account and instance shells.
- `src/components/`: UI shared by unrelated routes.
  - `auth/`: the split auth layout, the centred status card, the aside, and the 8-digit code form.
  - `shell/`: the app frame (`ShellLayout`), top bar, account menu, sidebars, page bar and cards.
  - `form/`: react-hook-form fields (`TextField`, `SlugField`, `CodeField`, `SelectField`,
    `ChoiceField`, `SwitchField`, `EmailListField`), `SubmitButton` and `SaveBar`.
  - `feedback/`: `ConfirmDialog`, `FormDialog`, `FormSheet`, `EmptyState`, `Notice`, `AccessDenied`.
  - `data-display/`: status badges, people, copy fields, detail lists, checklists and tables.
  - `activity/`: the audit log shared by an organization and the instance.
- `src/forms/`: form schemas. Each one is derived from an `@usepreface/protocol` input schema and
  turned into a Standard Schema with `toFormSchema`, which also maps validation issues to the
  sentences shown under fields.
- `src/lib/`: helpers: `forms/` (`useSchemaForm`, `useDerivedSlug`, `useSlugStatus`), `feedback`
  (all toast copy), `status` (status labels and tones), `roles`, `permissions`, `urls`, `preview`
  and `identity`.
- `src/lib/placeholder/`: the sample instance, people, roles, connections, domains and activity
  every screen reads until the API is wired. Replace module by module.
- `src/routeTree.gen.ts`: generated by the router plugin on `dev` and `build`; don't edit it.

## Forms

Forms use react-hook-form with `standardSchemaResolver`. Never write validation by hand: derive the
schema from the protocol input in `src/forms/` (`mapFields`, `Struct.pick`, `Struct.omit`) so the
browser checks exactly what the API will. `useSchemaForm(schema, options)` validates once a field
has been touched.

`#/…` imports point at `src/`, like the `#/*` imports in the workspace packages. Workspace packages
are compiled from source through the `preface-source` condition.
