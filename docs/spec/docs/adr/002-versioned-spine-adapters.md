# ADR-002 — Spine Uses Versioned Adapters
Status: Accepted

## Decision
Separate 3.8 and 4.2 packages. 3.8.75 has an exact compatibility profile.

## Rationale
Major/minor families differ semantically; 3.8.75 has known special handling history.

## Consequence
No scattered `if (spineVersion)` in shared runtime/editor code.
