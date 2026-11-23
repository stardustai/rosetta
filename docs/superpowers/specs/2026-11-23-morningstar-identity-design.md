# Rosetta sign-in with MorningStar

The first change lets an existing MorningStar user sign in to the Rosetta standalone editor with their platform identity. The public GitHub pull request covers the user-facing sign-in entry, return to Rosetta, and integration tests. The editor API currently issues its own session from an email login. An associated backend pull request will make a verified platform sign-in establish a Rosetta session that the editor can use for its existing permission and license checks.

## Existing integration

The public workspace loads the editor in an iframe. The frame authorizes saves and exports through the existing editor protocol. The workspace can manage local tasks and export previously saved data from the task list. This feature preserves those paths and the current Rosetta email sign-in. The initial scope covers existing MorningStar accounts. New account registration, enterprise seat assignments, license issuance, and offline entitlement rules have separate acceptance criteria and remain outside this change.

## Sign-in and session

When the administrator configures a compatible editor service, the workspace offers **Sign in with MorningStar**. The entry starts a top-level sign-in flow at a configured HTTPS service, independent of iframe cookie restrictions during the identity-provider step. The editor backend records the sign-in request with an expiring, single-use state value, a browser binding, and an allowlisted return route. After platform authentication, the editor backend verifies the response through the platform's supported interface and obtains its stable user identifier. It checks active membership for the selected organization using the platform's membership service.

The verified platform identifier maps to a Rosetta account. An existing Rosetta account can be linked only after ownership of both accounts is verified. A matching email is a hint for account linking. Existing Rosetta license and usage records remain attached to the verified Rosetta account. In the first version an unlinked platform identity must sign in with the existing Rosetta email flow and link the accounts before exchanging a platform sign-in for an editor session. An explicit license error explains any missing Rosetta entitlement at an editor action.

The editor backend creates its regular secure session after a successful exchange. It issues the session at the editor origin and binds it to the editor's existing browser identity so the embedded editor can use the configured site and cookie policy. The public workspace receives only completion or error status through the return flow. A completion notice prompts a session check with the configured editor service. The workspace displays success only after that service confirms the session and retains its existing iframe authorization protocol. Platform passwords, platform session tokens, and editor session tokens stay out of the public workspace, local storage, and workspace URLs. The sign-in entry is absent when the integration is unconfigured.

## Platform interface and PR scope

Reuse the existing platform for sign-in, user identity and team membership. Before the backend change is ready for review, exercise the configured sign-in and callback interface with a test account. If the deployment lacks a supported way to authorize this client, add a narrow server-side handoff through the platform's authentication owner and review it as a linked backend change. Require a successful server-side exchange with a verified platform identity and membership before reporting sign-in success. Keep deployment-specific targets and service configuration in the backend review.

The GitHub PR includes the entry, verified completion and error states, deployment documentation, and public integration tests using a fixture that models the editor contract. The backend PR covers the platform verification adapter, account associations, organization membership checks, and creation of the editor session. Use separate linked reviews for provider-side changes when the verification adapter requires a platform capability that is absent in the target deployment. The GitHub review includes the backend dependency status and the results from a shared test environment when available.

## Acceptance

- A signed-in platform test user returns to Rosetta and the editor identifies the same platform user and verified organization. Test explicitly with both an eligible Rosetta user and an authenticated user without a Rosetta license.
- Expired, reused or mismatched sign-in state, upstream unavailability and users without active organization membership surface an error with a retry path. None creates an authenticated editor session. Account links require proof of ownership of both sides.
- The browser preserves the active workspace when the user returns from sign-in. The existing email login, local task management, editor save/export authorization and task-list export of saved results pass their regression checks.
- The GitHub PR passes type checking, unit tests, iframe integration tests and a production build. Run the browser flow with configured test services to verify the session can be used inside the editor. Record fixture results and test-environment results individually.
