# Known limitations and deferred features

This MVP provides a working local application for discovery, accounts, initiative drafts/review, volunteer interest, resource offers, private assistance requests, and reviewer dashboards. The following requested capabilities are not implemented or are intentionally disabled:

- PostgreSQL, Drizzle ORM, versioned database migration files, hosted persistence, backup, and multi-instance deployment.
- Stripe checkout/connect, validated payment webhooks, refunds, receipts, recurring giving, payouts, or donation reconciliation. Financial giving remains disabled.
- Email verification, password reset, OAuth, email notifications, and production session revocation.
- Production rate limiting and distributed abuse/fraud monitoring. Current rate limiting is in-memory.
- Uploads, secure private documents, organization membership/invitations, external verification providers, and organization verification review.
- Public user profiles, professional credential handling, availability scheduling, assignment completion, volunteer time approval, resource-handoff confirmation, and matching recommendations in the UI.
- Private in-app messaging, complaint intake, moderation-case management, user export/deletion, consent history, and configurable data retention.
- Initiative editing/version history, detailed multi-stage wizard, budgets, outcomes, public progress reports, milestone completion, and verified impact aggregation.
- AI assistant/provider abstraction. Matching is a small deterministic helper with an explanation-ready score; it does not call an AI service.
- Full localization, language preferences, country/currency support, WCAG audit, and comprehensive mobile/browser accessibility verification.
- Automated end-to-end and integration tests, payment/webhook tests, vulnerability/dependency scanning, and production authorization audit.
- Legal review and jurisdiction-specific privacy, charitable fundraising, payment, tax, safeguarding, and regulated-service requirements.

Do not collect real assistance data, claim charitable status, accept payments, or represent synthetic initiative records as real projects until the relevant operational, security, and legal work is complete.
