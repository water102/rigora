# Batch 44 — Explicit Topology Edges

Authoring meshes now store edges independently from triangles. Edge add/remove/reset operations preserve valid face indices and no longer encode an edge as a degenerate triangle, improving topology editing and adjacency correctness.
