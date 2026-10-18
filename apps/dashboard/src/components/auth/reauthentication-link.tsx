import { Link, useRouterState } from "@tanstack/react-router";
export function ReauthenticationLink() {
  const returnTo = useRouterState({ select: (state) => state.location.pathname });
  return (
    <Link to="/auth/reauthenticate" search={{ returnTo }}>
      Confirm email
    </Link>
  );
}
