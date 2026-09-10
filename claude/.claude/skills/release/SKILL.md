---
name: release
description: Release — version decision, finalized CHANGELOG, release notes, tag commands. Tag push is the CEO's
argument-hint: "[version, or empty to propose]"
disable-model-invocation: true
---
Prepare a release. Version: $ARGUMENTS (empty = propose automatically)

1. In parallel, have team-planner compare commits since the last tag with the CHANGELOG and propose a semver version (ask the CEO if interfaces changed), and run full verification with team-verifier. On verifier FAIL, do not release.
2. In parallel, have team-implementer commit the version file and finalized CHANGELOG, and team-planner write docs/releases/<version>.md (user-facing release notes, known issues, rollback); the implementer then commits the release notes.
3. If a remote exists, present the tag and push commands for the CEO to run (do not create them). If local-only (`git remote` empty), run `git tag -a v<version> -m "<summary>"` after CEO approval.
