import {
  transaction,
  object,
  list,
  string,
  number,
  fields,
  names,
  reference,
  base,
  texture,
  fail,
  type ImportOptions,
} from "@rigora/format-common";
import type { JsonValue, SkinData, SlotData } from "@rigora/model";
import {
  detectDragonBonesVersion,
  inspectDragonBonesExtensions,
} from "./detection.js";
export {
  detectDragonBonesVersion,
  inspectDragonBonesExtensions,
} from "./detection.js";
export type {
  DragonBonesVersionDetection,
  DragonBonesFeatureDiagnostic,
} from "./detection.js";
const radians = Math.PI / 180;
type ImportDiagnostic = {
  code: string;
  severity: "info" | "warning" | "error" | "fatal";
  message: string;
  jsonPointer?: string;
};
function transform(value: unknown, path: string) {
  const item = value === undefined || value === null ? {} : object(value, path);
  fields(item, "x y skX skY scX scY", path);
  // Basis change C M C, C=diag(1,-1), converts source Y-down to canonical Y-up.
  return {
    x: number(item["x"], path + "/x"),
    y: -number(item["y"], path + "/y"),
    rotation: 0,
    shearX: -number(item["skY"], path + "/skY") * radians,
    shearY: -number(item["skX"], path + "/skX") * radians,
    scaleX: number(item["scX"], path + "/scX", 1),
    scaleY: number(item["scY"], path + "/scY", 1),
  };
}
function color(value: unknown, path: string, diagnostics: ImportDiagnostic[]) {
  const item = value === undefined || value === null ? {} : object(value, path);
  fields(item, "aM rM gM bM aO rO gO bO", path);
  for (const key of ["aO", "rO", "gO", "bO"])
    if (number(item[key], `${path}/${key}`) !== 0)
      diagnostics.push({
        code: "DB55_COLOR_OFFSET_PRESERVED",
        severity: "warning",
        message:
          "DragonBones color offsets are preserved in source diagnostics until the canonical color contract supports them.",
        jsonPointer: `${path}/${key}`,
      });
  return {
    a: number(item["aM"], path + "/aM", 100) / 100,
    r: number(item["rM"], path + "/rM", 100) / 100,
    g: number(item["gM"], path + "/gM", 100) / 100,
    b: number(item["bM"], path + "/bM", 100) / 100,
  };
}
export function importDragonBones55(text: string, options: ImportOptions) {
  return transaction(text, options, (source, diagnostics) => {
    const extensionDiagnostics = inspectDragonBonesExtensions(source);
    diagnostics.push(
      ...extensionDiagnostics.map((diagnostic) => ({
        ...diagnostic,
        ...(options.originalFile ? { sourcePath: options.originalFile } : {}),
      })),
    );
    const detection = detectDragonBonesVersion(source);
    if (detection.family === "6.0") {
      diagnostics.push({
        code: "DB60_UNSUPPORTED_VERSION",
        severity: "error",
        message:
          "DragonBones 6.0 is recognized; 5.5 normalization cannot be applied to this family.",
        jsonPointer: "/version",
        ...(options.originalFile ? { sourcePath: options.originalFile } : {}),
      });
      return [];
    }
    if (extensionDiagnostics.length) return [];
    const version = string(source["version"], "/version");
    if (!/^5\.(?:5|6)(?:\.\d+)?$/.test(version))
      fail(
        "DB55_UNSUPPORTED_VERSION",
        "Expected DragonBones 5.5 or 5.6 JSON.",
        "/version",
      );
    fields(
      source,
      "name version compatibleVersion frameRate armature userData isGlobal",
      "",
    );
    if (source["isGlobal"] !== undefined)
      diagnostics.push({
        code: "DB55_IS_GLOBAL_PRESERVED_AS_METADATA",
        severity: "warning",
        message:
          "DragonBones isGlobal metadata is not used by the canonical runtime.",
        jsonPointer: "/isGlobal",
      });
    if (
      source["compatibleVersion"] !== undefined &&
      source["compatibleVersion"] !== "5.5"
    )
      fail(
        "DB55_UNSUPPORTED_VERSION",
        "Unsupported compatibleVersion.",
        "/compatibleVersion",
      );
    const armatures = list(source["armature"], "/armature").map((v, i) =>
      object(v, `/armature/${i}`),
    );
    names(armatures, options.namespace, "armature", "/armature");
    return armatures.map((armature, armatureIndex) => {
      const root = `/armature/${armatureIndex}`,
        namespace = `${options.namespace}:armature:${armatureIndex}`;
      // DragonBones exports an optional armature AABB for preview/runtime
      // culling. It is metadata, not part of the canonical skeleton model.
      fields(
        armature,
        "name type frameRate bone slot skin userData ik aabb animation defaultActions",
        root,
      );
      if (armature["defaultActions"] !== undefined)
        diagnostics.push({
          code: "DB55_DEFAULT_ACTIONS_PRESERVED_AS_METADATA",
          severity: "warning",
          message: "Default actions are not executed by the canonical runtime.",
          jsonPointer: root + "/defaultActions",
        });
      if (armature["type"] !== undefined && armature["type"] !== "Armature")
        fail(
          "DB55_UNSUPPORTED_ARMATURE",
          "Only skeletal armatures are supported.",
          root + "/type",
        );
      const data = base(
        String(armature["name"]),
        namespace,
        "dragonbones",
        version,
        number(
          armature["frameRate"] ?? source["frameRate"],
          root + "/frameRate",
          24,
        ),
        options,
      );
      const bones = list(armature["bone"], root + "/bone").map((v, i) =>
        object(v, `${root}/bone/${i}`),
      );
      const slots = list(armature["slot"], root + "/slot").map((v, i) =>
        object(v, `${root}/slot/${i}`),
      );
      const boneIds = names(bones, namespace, "bone", root + "/bone"),
        slotIds = names(slots, namespace, "slot", root + "/slot");
      data.bones = bones.map((bone, i) => {
        const path = `${root}/bone/${i}`;
        fields(
          bone,
          "name parent length transform userData inheritScale inheritRotation",
          path,
        );
        const inheritScale = bone["inheritScale"] !== false;
        const inheritRotation = bone["inheritRotation"] !== false;
        return {
          id: boneIds.get(String(bone["name"]))!,
          name: String(bone["name"]),
          ...(bone["parent"] === undefined || bone["parent"] === null
            ? {}
            : {
                parentId: reference(bone["parent"], boneIds, path + "/parent"),
              }),
          setup: transform(bone["transform"], path + "/transform"),
          length: number(bone["length"], path + "/length"),
          inherit:
            inheritScale && inheritRotation
              ? "normal"
              : inheritScale
                ? "noRotationOrReflection"
                : inheritRotation
                  ? "noScale"
                  : "noScaleOrReflection",
        };
      });
      data.slots = slots.map((slot, i): SlotData => {
        const path = `${root}/slot/${i}`;
        fields(slot, "name parent displayIndex blendMode color userData", path);
        const blend =
          slot["blendMode"] === null
            ? "normal"
            : string(slot["blendMode"], path + "/blendMode", "normal");
        if (!["normal", "add", "multiply", "screen"].includes(blend))
          fail(
            "DB55_UNSUPPORTED_BLEND",
            "Unknown blend mode.",
            path + "/blendMode",
          );
        return {
          id: slotIds.get(String(slot["name"]))!,
          name: String(slot["name"]),
          boneId: reference(slot["parent"], boneIds, path + "/parent"),
          color: color(slot["color"], path + "/color", diagnostics),
          blendMode: (blend === "add"
            ? "additive"
            : blend) as SlotData["blendMode"],
          zIndex: i,
        };
      });
      const skins = list(armature["skin"], root + "/skin").map((v, i) =>
        object(v, `${root}/skin/${i}`),
      );
      const normalizedSkins = skins.map((skin, i) =>
        typeof skin["name"] !== "string" || skin["name"].length === 0
          ? {
              ...skin,
              name: i === 0 ? "default" : `skin-${i}`,
            }
          : skin,
      );
      const skinIds = names(normalizedSkins, namespace, "skin", root + "/skin");
      const defaultIndex = Math.max(
        0,
        normalizedSkins.findIndex((skin) => skin["name"] === "default"),
      );
      data.skins = normalizedSkins.map((skin, i): SkinData => {
        const path = `${root}/skin/${i}`;
        fields(skin, "name slot", path);
        const attachments: SkinData["attachments"] = Object.create(
          null,
        ) as SkinData["attachments"];
        const skinSlots = list(skin["slot"], path + "/slot").map((v, j) =>
          object(v, `${path}/slot/${j}`),
        );
        names(skinSlots, namespace, "skinSlot", path + "/slot");
        skinSlots.forEach((slot, j) => {
          const at = `${path}/slot/${j}`;
          fields(slot, "name display", at);
          const slotId = reference(slot["name"], slotIds, at + "/name");
          attachments[slotId] = list(slot["display"], at + "/display").map(
            (value, k) => {
              const loc = `${at}/display/${k}`,
                item = object(value, loc);
              fields(
                item,
                "name path type transform pivot width height vertices uvs triangles edges userEdges",
                loc,
              );
              if (item["type"] === "armature") {
                diagnostics.push({
                  code: "DB55_NESTED_ARMATURE_PRESERVED",
                  severity: "warning",
                  message:
                    "Nested DragonBones armature displays are preserved until skeleton linking is available.",
                  jsonPointer: loc,
                });
                return {
                  type: "unknownPreserved" as const,
                  id: `${namespace}:attachment:${i}:${j}:${k}`,
                  name: string(item["name"], loc + "/name"),
                  sourceFormat: "dragonbones-5.5-armature-display",
                  payload: item as any,
                };
              }
              if (
                item["type"] !== undefined &&
                item["type"] !== "image" &&
                item["type"] !== "mesh"
              )
                fail(
                  "DB55_UNSUPPORTED_DISPLAY",
                  "Only image and mesh displays are supported.",
                  loc + "/type",
                );
              const name = string(item["name"], loc + "/name");
              const image =
                item["path"] === null
                  ? name
                  : string(item["path"], loc + "/path", name);
              const region = texture(
                image,
                item["width"] === undefined
                  ? undefined
                  : number(item["width"], loc + "/width"),
                item["height"] === undefined
                  ? undefined
                  : number(item["height"], loc + "/height"),
                options,
                diagnostics,
                loc,
              );
              const pivot =
                item["pivot"] === undefined || item["pivot"] === null
                  ? {}
                  : object(item["pivot"], loc + "/pivot");
              fields(pivot, "x y", loc + "/pivot");
              const px = number(pivot["x"], loc + "/pivot/x", 0.5),
                py = number(pivot["y"], loc + "/pivot/y", 0.5);
              const local = transform(item["transform"], loc + "/transform");
              if (item["type"] === "mesh") {
                const vertices = list(item["vertices"], loc + "/vertices").map(
                  (value, index) => number(value, `${loc}/vertices/${index}`),
                );
                const uvs = list(item["uvs"], loc + "/uvs").map(
                  (value, index) => number(value, `${loc}/uvs/${index}`),
                );
                const pair = (values: number[]) =>
                  values.reduce<{ x: number; y: number }[]>(
                    (result, value, index) =>
                      index % 2
                        ? result
                        : [...result, { x: value, y: values[index + 1] ?? 0 }],
                    [],
                  );
                return {
                  type: "mesh" as const,
                  id: `${namespace}:attachment:${i}:${j}:${k}`,
                  name,
                  textureId: region.textureId,
                  vertices: pair(vertices),
                  uvs: pair(uvs),
                  triangles: list(item["triangles"], loc + "/triangles").map(
                    (value, index) =>
                      Math.trunc(number(value, `${loc}/triangles/${index}`)),
                  ),
                };
              }
              // Convert source normalized pivot to a centered canonical region by shifting its local origin.
              const dx = (0.5 - px) * region.width,
                dy = (py - 0.5) * region.height;
              local.x +=
                Math.cos(local.shearX) * local.scaleX * dx -
                Math.sin(local.shearY) * local.scaleY * dy;
              local.y +=
                Math.sin(local.shearX) * local.scaleX * dx +
                Math.cos(local.shearY) * local.scaleY * dy;
              return {
                type: "region",
                id: `${namespace}:attachment:${i}:${j}:${k}`,
                name,
                ...region,
                transform: local,
              };
            },
          );
        });
        const skinName = string(skin["name"], `${path}/name`);
        return {
          id: skinIds.get(String(skin["name"])) ?? `${namespace}:skin:${i}`,
          name: skinName,
          attachments,
        };
      });
      slots.forEach((slot, i) => {
        const path = `${root}/slot/${i}/displayIndex`,
          index = number(slot["displayIndex"], path);
        if (!Number.isInteger(index) || index < -1)
          fail(
            "DB55_INVALID_DISPLAY_INDEX",
            "Expected -1 or a nonnegative integer.",
            path,
          );
        if (index === -1) return;
        const displays =
          data.skins[defaultIndex]?.attachments[data.slots[i]!.id];
        if (!displays?.length && slot["displayIndex"] === undefined) return;
        const selected = displays?.[index];
        if (!selected)
          fail(
            "DB55_INVALID_DISPLAY_INDEX",
            "Display index is outside default skin displays.",
            path,
          );
        data.slots[i]!.setupAttachmentId = selected.id;
      });
      data.constraints = list(armature["ik"], root + "/ik").map(
        (raw, index) => {
          const item = object(raw, `${root}/ik/${index}`);
          const bones = list(item["bone"], `${root}/ik/${index}/bone`).map(
            (value, boneIndex) =>
              reference(
                value,
                boneIds,
                `${root}/ik/${index}/bone/${boneIndex}`,
              ),
          );
          return {
            id: `${namespace}:constraint:${index}`,
            name: string(item["name"], `${root}/ik/${index}/name`),
            type: "ik",
            order: index,
            targetBoneId: reference(
              item["target"],
              boneIds,
              `${root}/ik/${index}/target`,
            ),
            boneIds: bones,
            mix: number(item["weight"], `${root}/ik/${index}/weight`, 1),
            bendDirection: item["bendPositive"] === false ? -1 : 1,
          };
        },
      ) as any;
      if (armature["animation"] !== undefined) {
        const animations = list(armature["animation"], root + "/animation").map(
          (value, i) => object(value, `${root}/animation/${i}`),
        );
        data.animations = animations.map((animation, i) => ({
          id: `${namespace}:animation:${i}`,
          name: string(animation["name"], `${root}/animation/${i}/name`),
          duration:
            number(animation["duration"], `${root}/animation/${i}/duration`) /
            number(armature["frameRate"], root + "/frameRate", 24),
          timelines: [
            {
              id: `${namespace}:animation:${i}:raw`,
              type: "dragonbones.raw",
              keyframes: [
                {
                  time: 0,
                  value: animation as unknown as JsonValue,
                  curve: { type: "linear" },
                },
              ],
              metadata: { source: "dragonbones", preserved: true },
            },
          ],
        }));
      }
      return data;
    });
  });
}
