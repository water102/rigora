import type { AuthoringMesh } from "./authoring.js";

function clone(mesh: AuthoringMesh): AuthoringMesh {
  return {
    vertices: mesh.vertices.map((vertex) => ({
      id: vertex.id,
      position: { ...vertex.position },
    })),
    triangles: [...mesh.triangles],
    edges: mesh.edges.map(([a, b]) => [a, b]),
  };
}

/** Bounded snapshot history for topology edits; snapshots never alias caller data. */
export class TopologyHistory {
  readonly #limit: number;
  #current: AuthoringMesh;
  readonly #undo: AuthoringMesh[] = [];
  readonly #redo: AuthoringMesh[] = [];

  constructor(initial: AuthoringMesh, limit = 100) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error("TOPOLOGY_HISTORY_INVALID_LIMIT");
    this.#limit = limit;
    this.#current = clone(initial);
  }

  get mesh(): AuthoringMesh {
    return clone(this.#current);
  }

  get canUndo(): boolean {
    return this.#undo.length > 0;
  }

  get canRedo(): boolean {
    return this.#redo.length > 0;
  }

  commit(next: AuthoringMesh): AuthoringMesh {
    this.#undo.push(clone(this.#current));
    if (this.#undo.length > this.#limit) this.#undo.shift();
    this.#current = clone(next);
    this.#redo.length = 0;
    return this.mesh;
  }

  undo(): AuthoringMesh {
    const previous = this.#undo.pop();
    if (!previous) return this.mesh;
    this.#redo.push(clone(this.#current));
    this.#current = clone(previous);
    return this.mesh;
  }

  redo(): AuthoringMesh {
    const next = this.#redo.pop();
    if (!next) return this.mesh;
    this.#undo.push(clone(this.#current));
    this.#current = clone(next);
    return this.mesh;
  }
}
