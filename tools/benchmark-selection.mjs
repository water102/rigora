import { performance } from "node:perf_hooks";
import {
  createAuthoringMesh,
  selectMeshByPolygon,
} from "../packages/authoring-mesh/dist/index.js";

const size = 100;
const points = [];
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) points.push({ x, y });
}
const mesh = createAuthoringMesh(points);
const polygon = [
  { x: 20, y: 20 },
  { x: 80, y: 20 },
  { x: 80, y: 80 },
  { x: 20, y: 80 },
];
const warmup = 5;
const samples = 30;
for (let i = 0; i < warmup; i++) selectMeshByPolygon(mesh, polygon, "vertex");
const start = performance.now();
let selected = 0;
for (let i = 0; i < samples; i++)
  selected = selectMeshByPolygon(mesh, polygon, "vertex").length;
const elapsedMs = performance.now() - start;
console.log(
  JSON.stringify({
    vertices: mesh.vertices.length,
    samples,
    selected,
    totalMs: Number(elapsedMs.toFixed(3)),
    averageMs: Number((elapsedMs / samples).toFixed(3)),
  }),
);
