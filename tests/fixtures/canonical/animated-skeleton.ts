import { weightedMeshSkeleton } from "./weighted-mesh.js";
import type { SkeletonData } from "../../../packages/model/src/index.js";

/**
 * Returns a canonical skeleton with a 1-second "walk" animation
 * containing:
 * - bone-1 rotation (0 -> PI/2 -> 0)
 * - bone-2 translation ((0,0) -> (5, 5) -> (0,0))
 * - mesh-1 deform offsets
 * - slot-1 color fading (alpha 1 -> 0.5 -> 1)
 */
export function animatedMeshSkeleton(): {
  skeleton: SkeletonData;
  animationName: string;
} {
  const { skeleton } = weightedMeshSkeleton();
  const animationName = "walk";

  skeleton.animations = [
    {
      id: "anim-walk",
      name: animationName,
      duration: 1.0,
      timelines: [
        {
          id: "tl-rot-1",
          type: "bone.rotate",
          targetId: "bone-1",
          keyframes: [
            { time: 0.0, value: 0, curve: { type: "linear" } },
            { time: 0.5, value: Math.PI / 2, curve: { type: "linear" } },
            { time: 1.0, value: 0, curve: { type: "linear" } },
          ],
        },
        {
          id: "tl-trans-2",
          type: "bone.translate",
          targetId: "bone-2",
          keyframes: [
            { time: 0.0, value: { x: 0, y: 0 }, curve: { type: "linear" } },
            { time: 0.5, value: { x: 5, y: 5 }, curve: { type: "linear" } },
            { time: 1.0, value: { x: 0, y: 0 }, curve: { type: "linear" } },
          ],
        },
        {
          id: "tl-deform-1",
          type: "deform",
          targetId: "mesh-1",
          keyframes: [
            {
              time: 0.0,
              value: { offset: 0, values: [0, 0, 0, 0, 0, 0, 0, 0] },
              curve: { type: "linear" },
            },
            {
              time: 0.5,
              value: { offset: 2, values: [2, -2] },
              curve: { type: "linear" },
            },
            {
              time: 1.0,
              value: { offset: 0, values: [0, 0, 0, 0, 0, 0, 0, 0] },
              curve: { type: "linear" },
            },
          ],
        },
        {
          id: "tl-color-1",
          type: "slot.color",
          targetId: "slot-1",
          keyframes: [
            {
              time: 0.0,
              value: { r: 1, g: 1, b: 1, a: 1 },
              curve: { type: "linear" },
            },
            {
              time: 0.5,
              value: { r: 1, g: 0.5, b: 0.5, a: 0.5 },
              curve: { type: "linear" },
            },
            {
              time: 1.0,
              value: { r: 1, g: 1, b: 1, a: 1 },
              curve: { type: "linear" },
            },
          ],
        },
      ],
    },
  ];

  return { skeleton, animationName };
}
