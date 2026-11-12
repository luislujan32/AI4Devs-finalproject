# public-academic-demo Specification

## Purpose
Demo académica pública con HTTPS, base aislada persistente y correo de revisión, preservando datos y credenciales entre reinicios.
## Requirements
### Requirement: Public review uses a fictitious isolated environment
The academic demo SHALL require an HTTPS public origin and a dedicated persistent demo database, keep service credentials outside the repository and use fictitious questionnaire content. Mailpit mode SHALL accept only fictitious candidate email addresses. Explicitly configured Brevo mode MAY accept personal email addresses for voluntary academic review, while keeping example.test messages in the authenticated test mailbox.

#### Scenario: Start with an existing demo database
- **WHEN** the academic demo starts again with the same settings
- **THEN** it SHALL preserve the review account, catalog and existing product data

#### Scenario: Reject an invalid deployment configuration
- **WHEN** the public origin, required secrets, mail provider settings or database target are missing or invalid
- **THEN** the demo SHALL fail before provisioning data or serving requests

### Requirement: Review mailbox requires authentication
The public demo SHALL provide an authenticated review mailbox for fictitious invitations and access codes. Public requests SHALL NOT send, modify or delete messages through the mailbox.

#### Scenario: Read a fictitious invitation
- **WHEN** the reviewer creates a fictitious invitation and opens the mailbox with its credentials
- **THEN** the reviewer SHALL be able to read and use the existing one-time invitation link

#### Scenario: Recover candidate access
- **WHEN** the candidate requests a new access code
- **THEN** the reviewer SHALL be able to read that code in the mailbox and resume the saved attempt

#### Scenario: Unauthenticated mailbox request
- **WHEN** a visitor requests mailbox content without valid credentials
- **THEN** the visitor SHALL NOT receive messages or codes
