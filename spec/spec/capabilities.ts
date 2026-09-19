export interface TargetCapabilities {
  target: string;
  physicsConstraint: boolean;
  ik: boolean;
  transformConstraint: boolean;
  pathConstraint: boolean;
  mesh: boolean;
  weightedMesh: boolean;
  linkedMesh: boolean;
  clipping: boolean;
  deform: boolean;
  events: boolean;
  drawOrder: boolean;
  twoColorTint: boolean;
}

export const SPINE_38_CAPABILITIES: TargetCapabilities = {
  target: "spine-3.8",
  physicsConstraint: false,
  ik: true,
  transformConstraint: true,
  pathConstraint: true,
  mesh: true,
  weightedMesh: true,
  linkedMesh: true,
  clipping: true,
  deform: true,
  events: true,
  drawOrder: true,
  twoColorTint: true,
};

export const SPINE_42_CAPABILITIES: TargetCapabilities = {
  ...SPINE_38_CAPABILITIES,
  target: "spine-4.2",
  physicsConstraint: true,
};

export const DRAGONBONES_55_CAPABILITIES: TargetCapabilities = {
  target: "dragonbones-5.5",
  physicsConstraint: false,
  ik: true,
  transformConstraint: false, // verify/extend per implementation profile
  pathConstraint: false,      // verify/extend per implementation profile
  mesh: true,
  weightedMesh: true,
  linkedMesh: true,
  clipping: true,
  deform: true,
  events: true,
  drawOrder: true,
  twoColorTint: false,
};
