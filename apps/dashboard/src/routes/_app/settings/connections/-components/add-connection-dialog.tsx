import { useNavigate } from "@tanstack/react-router";

import { Redacted } from "effect";

import { Button } from "@usepreface/ui/components/button";

import { FormDialog } from "#/components/feedback/form-dialog";
import { ChoiceField } from "#/components/form/choice-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { createConnectionForm } from "#/forms/connections";
import {
  useOrganizationIdentityConnectionsCreate,
  useOrganizationIdentityConnectionsCreateSaml,
} from "#/hooks/identity";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function AddConnectionDialog({ onClose }: { onClose: () => void }) {
  const oidc = useOrganizationIdentityConnectionsCreate();
  const saml = useOrganizationIdentityConnectionsCreateSaml();
  const navigate = useNavigate();
  const form = useSchemaForm(createConnectionForm, {
    defaultValues: {
      protocol: "oidc",
      name: "",
      issuer: "",
      clientId: "",
      clientSecret: "",
      clientAuthenticationMethod: "client_secret_basic",
    },
  });
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open && !form.formState.isSubmitting) onClose();
      }}
      title="Add SSO connection"
      description="Create a draft, complete a provider test, then activate and approve it."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton pending={form.formState.isSubmitting}>Create connection</SubmitButton>
        </>
      }
      as={(content) => (
        <form
          className="contents"
          onSubmit={form.handleSubmit(async (values) => {
            const response =
              values.protocol === "saml"
                ? await saml.run({ payload: { name: values.name } })
                : await oidc.run({
                    payload: {
                      name: values.name,
                      issuer: values.issuer,
                      clientId: values.clientId,
                      clientSecret: Redacted.value(values.clientSecret),
                      clientAuthenticationMethod: values.clientAuthenticationMethod,
                    },
                  });
            if (response) {
              onClose();
              await navigate({
                to: "/settings/connections/$connectionId",
                params: { connectionId: response.value.id },
              });
            }
          })}
        >
          {content}
        </form>
      )}
    >
      <ChoiceField
        control={form.control}
        name="protocol"
        label="Protocol"
        options={[
          { value: "oidc", label: "OpenID Connect" },
          { value: "saml", label: "SAML 2.0" },
        ]}
      />
      <TextField control={form.control} name="name" label="Connection name" />
      {form.watch("protocol") === "oidc" ? (
        <>
          <TextField
            control={form.control}
            name="issuer"
            label="Issuer URL"
            inputProps={{ type: "url" }}
          />
          <TextField control={form.control} name="clientId" label="Client ID" />
          <TextField
            control={form.control}
            name="clientSecret"
            label="Client secret"
            inputProps={{ type: "password", autoComplete: "new-password" }}
          />
          <SelectField
            control={form.control}
            name="clientAuthenticationMethod"
            label="Client authentication"
            options={[
              { value: "client_secret_basic", label: "Client secret basic" },
              { value: "client_secret_post", label: "Client secret post" },
            ]}
          />
        </>
      ) : null}
    </FormDialog>
  );
}
