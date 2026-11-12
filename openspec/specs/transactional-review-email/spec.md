# transactional-review-email Specification

## Purpose
Invitaciones y códigos mediante Brevo para revisión voluntaria con correo personal, con Mailpit para pruebas ficticias, límites persistentes y estado de envío veraz.
## Requirements
### Requirement: External mail is explicitly configured
The application SHALL send real recipient invitations and access codes only through explicitly configured Brevo HTTPS credentials. Fictitious example.test addresses SHALL remain in Mailpit. Invalid configuration SHALL fail closed and secrets SHALL remain server-side.

#### Scenario: Real recipient with default configuration
- **WHEN** a recruiter invites a real email address with the default Mailpit configuration
- **THEN** the invitation SHALL be rejected without sending external email

#### Scenario: Real recipient with Brevo
- **WHEN** Brevo is configured and a recruiter invites a valid real address
- **THEN** the provider SHALL receive only the invitation message and the UI SHALL direct the recipient to their own mailbox

### Requirement: Delivery uncertainty preserves access
The application SHALL distinguish confirmed acceptance from uncertain sending. A timeout or ambiguous provider failure SHALL NOT delete the invitation or falsely confirm sending. The UI SHALL preserve that distinction after reload and permit copying the shared link.

#### Scenario: Provider response is lost
- **WHEN** an invitation send times out after the request begins
- **THEN** its invitation SHALL remain valid and visible with an unconfirmed-email notice

### Requirement: External sending is bounded
External invitation and code requests SHALL share a persistent daily limit in addition to existing access-code limits. Automated tests SHALL NOT send real email.

#### Scenario: Daily limit reached
- **WHEN** the shared daily external-mail limit has been consumed
- **THEN** further external sends SHALL be rejected without calling the provider
