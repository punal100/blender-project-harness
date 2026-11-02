# Shell Command Approvals

| Command | Approved | Shell command | Reasoning |
|---|---|---|---|
| [56745b05-a9f8-48bb-b4e6-641ced99295f](56745b05-a9f8-48bb-b4e6-641ced99295f.md) | 2026-11-02T06:12:05.627Z | node -e "process.exit(0)" | Validate project-scoped shell approval recording before production. |
| [2e0852c7-1c18-48f5-9383-8434b2904a1e](2e0852c7-1c18-48f5-9383-8434b2904a1e.md) | 2026-11-02T06:51:46.128Z | Copy-Item -LiteralPath 'config.json' -Destination '.temp/config.after-user-update.json' -Force; $c=Get-Content -Raw -LiteralPath 'config.json' \| ConvertFrom-Js | restore the registered visual backup temporarily so the stale main-branch change can be reviewed and preserved, then the user's updated config is restored; the  |
