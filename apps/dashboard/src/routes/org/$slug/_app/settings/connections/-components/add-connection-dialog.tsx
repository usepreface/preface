import { useNavigate, useParams } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";

import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { addConnectionForm } from "#/forms/connections";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { connections } from "#/lib/placeholder";

const protocols = [
  { value: "oidc", label: "OpenID Connect", description: "Okta, Entra ID, Auth0" },
  { value: "saml", label: "SAML 2.0", description: "ADFS, Ping, OneLogin" },
] as const;

/** Pick the protocol and a name. The new draft opens on its own page to finish configuring. */
export function AddConnectionDialog({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview?: boolean;
}) {
  const navigate = useNavigate();
  const { slug } = useParams({ from: "/org/$slug/_app" });
  const form = useSchemaForm(addConnectionForm, {
    defaultValues: { protocol: "oidc", name: preview ? "Microsoft Entra ID" : "" },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add SSO connection"
      description="Choose the protocol your identity provider uses."
      note="You’ll get a callback URL to paste into your IdP next."
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(({ protocol }) => {
            // Until the API creates drafts, open the matching sample connection.
            const draft =
              connections.find((connection) => connection.protocol === protocol) ?? connections[0];
            if (draft)
              void navigate({
                to: "/org/$slug/settings/connections/$connectionId",
                params: { slug, connectionId: draft.id },
              });
          })}
        >
          {content}
        </form>
      )}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton arrow>Continue</SubmitButton>
        </>
      }
    >
      <ChoiceField control={form.control} name="protocol" label="Protocol" options={protocols} />
      <TextField
        control={form.control}
        name="name"
        label="Connection name"
        description="Shown to members on the sign-in page."
        inputProps={{ autoFocus: true, placeholder: "Okta" }}
      />
    </FormDialog>
  );
}
