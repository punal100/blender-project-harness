# Workspace Command Approvals

Harness-owned records for non-read-only shell commands in generic sessions. A session that owns a
Blender project writes to `<project>/Documents/Commands/` instead.

Each approved command commits its `COMMANDS.md` index row and one `<id>.md` record containing the
exact command, reasoning, session, timestamps, and working directory. Command output is never
captured or committed.

Read-only commands are not recorded. Blender launches, command substitution, and project mutations
remain blocked.
