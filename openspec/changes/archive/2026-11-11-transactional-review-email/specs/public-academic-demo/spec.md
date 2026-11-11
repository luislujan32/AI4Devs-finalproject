## MODIFIED Requirements

### Requirement: Public review uses a fictitious isolated environment
The academic demo SHALL require an HTTPS public origin and a dedicated persistent demo database, keep service credentials outside the repository and use fictitious questionnaire content. Mailpit mode SHALL accept only fictitious candidate email addresses. Explicitly configured Brevo mode MAY accept personal email addresses for voluntary academic review, while keeping example.test messages in the authenticated test mailbox.

#### Scenario: Start with an existing demo database
- **WHEN** the academic demo starts again with the same settings
- **THEN** it SHALL preserve the review account, catalog and existing product data

#### Scenario: Reject an invalid deployment configuration
- **WHEN** the public origin, required secrets, mail provider settings or database target are missing or invalid
- **THEN** the demo SHALL fail before provisioning data or serving requests
