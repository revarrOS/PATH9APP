# INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL

This folder contains the Gemma AI personality, knowledge canon, depth system, and domain-specific rules.

## Current Status

**NOT YET FULLY ACTIVATED IN APP**

The Gemma system is partially integrated:
- Core orchestration layer (`/supabase/functions/orchestrate/`) is ACTIVE
- Product-specific AI endpoints (`bloodwork-ai-respond`, `condition-ai-respond`) are ACTIVE
- Knowledge canon retrieval is ACTIVE
- Conversation history and depth ladder are NOT YET INTEGRATED

## What's Here

- `/core/` - Gemma core personality, rules, prompts
- `/domains/` - Domain-specific Gemma behavior (bloodwork, condition)
- `/tests/` - Test specifications

## Framework vs. Active

This is **framework code** that supports future features. The Gemma orchestration backbone is live, but the full personality system, knowledge canon usage, and depth progression are not yet activated in the UI.

## Do Not Modify

Changes to Gemma's personality, canon, or behavior require explicit approval and coordination with the orchestration layer.

**Last Updated:** 2026-02-05
