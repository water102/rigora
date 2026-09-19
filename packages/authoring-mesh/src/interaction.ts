import type { Vec2 } from "@rigora/math";
import type { AuthoringMesh } from "./authoring.js";
import { moveVertex } from "./authoring.js";

export type DragMode = "vertex" | "brush";
export interface DragSession {
  mode: DragMode;
  vertexId?: string;
  start: Vec2;
  current: Vec2;
  active: boolean;
}
export function beginDrag(
  mode: DragMode,
  start: Vec2,
  vertexId?: string,
): DragSession {
  if (mode === "vertex" && !vertexId) throw new Error("DRAG_VERTEX_REQUIRED");
  return {
    mode,
    ...(vertexId ? { vertexId } : {}),
    start: { ...start },
    current: { ...start },
    active: true,
  };
}
export function updateDrag(session: DragSession, current: Vec2): DragSession {
  if (!session.active) throw new Error("DRAG_NOT_ACTIVE");
  return { ...session, current: { ...current } };
}
export function applyVertexDrag(
  mesh: AuthoringMesh,
  session: DragSession,
): AuthoringMesh {
  if (!session.active || session.mode !== "vertex" || !session.vertexId)
    throw new Error("DRAG_INVALID_VERTEX_SESSION");
  return moveVertex(mesh, session.vertexId, session.current);
}
export function endDrag(session: DragSession): DragSession {
  return { ...session, active: false };
}
export function cancelDrag(session: DragSession): DragSession {
  return { ...session, current: { ...session.start }, active: false };
}
