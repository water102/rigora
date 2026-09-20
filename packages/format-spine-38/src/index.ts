import { detectSpineVersion } from "@rigora/format-spine-common";
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
  pointer,
  type ImportOptions,
  type ObjectData,
} from "@rigora/format-common";
import type { JsonValue, SkinData, SlotData } from "@rigora/model";
const radians = Math.PI / 180;
function transform(item: ObjectData, path: string) {
  return {
    x: number(item["x"], path + "/x"),
    y: number(item["y"], path + "/y"),
    rotation: number(item["rotation"], path + "/rotation") * radians,
    scaleX: number(item["scaleX"], path + "/scaleX", 1),
    scaleY: number(item["scaleY"], path + "/scaleY", 1),
    shearX: number(item["shearX"], path + "/shearX") * radians,
    shearY: number(item["shearY"], path + "/shearY") * radians,
  };
}
function color(value: unknown, path: string) {
  const hex = string(value, path, "ffffffff");
  if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex))
    fail("SP38_INVALID_COLOR", "Expected RGB or RGBA hex.", path);
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
  };
}

export function importSpine38(text: string, options: ImportOptions) {
  return transaction(text, options, (source, diagnostics) => {
    const version = detectSpineVersion(source);
    if (version.exact === "3.8.75")
      diagnostics.push({
        code: "SP38_3875_KNOWN_VERSION_RISK",
        severity: "warning",
        message:
          "Exact 3.8.75 profile: no speculative repairs applied; compatibility goldens are required.",
        jsonPointer: "/skeleton/spine",
      });
    if (version.family !== "3.8")
      fail(
        version.code ?? "SP38_UNSUPPORTED_VERSION",
        "Expected Spine 3.8.x JSON.",
        "/skeleton/spine",
      );
    if (Array.isArray(source["ik"])) {
      const ikConstraints = source["ik"].map((item) => ({
        ...(item as Record<string, unknown>),
        type: "ik",
      }));
      source["constraints"] = [
        ...(Array.isArray(source["constraints"]) ? source["constraints"] : []),
        ...ikConstraints,
      ];
    }
    if (Array.isArray(source["path"])) {
      const pathConstraints = source["path"].map((item) => ({
        ...(item as Record<string, unknown>),
        type: "path",
      }));
      source["constraints"] = [
        ...(Array.isArray(source["constraints"]) ? source["constraints"] : []),
        ...pathConstraints,
      ];
    }
    fields(
      source,
      "skeleton bones slots skins animations events constraints ik path transform",
      "",
    );
    const meta = object(source["skeleton"], "/skeleton");
    const data = base(
      options.originalFile ?? "Spine skeleton",
      options.namespace,
      "spine",
      version.exact!,
      number(meta["fps"], "/skeleton/fps", 30),
      options,
    );
    const bones = list(source["bones"], "/bones").map((v, i) =>
      object(v, `/bones/${i}`),
    );
    const slots = list(source["slots"], "/slots").map((v, i) =>
      object(v, `/slots/${i}`),
    );
    const boneIds = names(bones, options.namespace, "bone", "/bones"),
      slotIds = names(slots, options.namespace, "slot", "/slots");
    data.bones = bones.map((bone, i) => {
      const path = `/bones/${i}`;
      fields(
        bone,
        "name parent length x y rotation scaleX scaleY shearX shearY transform inherit icon color skin",
        path,
      );
      const inheritance = bone["transform"] ?? bone["inherit"] ?? "normal";
      if (
        typeof inheritance !== "string" ||
        ![
          "normal",
          "onlyTranslation",
          "noRotationOrReflection",
          "noScale",
          "noScaleOrReflection",
        ].includes(inheritance)
      )
        fail(
          "SP38_UNSUPPORTED_INHERITANCE",
          "Unsupported source inheritance mode.",
          path + "/transform",
        );
      return {
        id: boneIds.get(String(bone["name"]))!,
        name: String(bone["name"]),
        ...(bone["parent"] === undefined
          ? {}
          : { parentId: reference(bone["parent"], boneIds, path + "/parent") }),
        setup: transform(bone, path),
        length: number(bone["length"], path + "/length"),
        inherit: inheritance as
          | "normal"
          | "onlyTranslation"
          | "noRotationOrReflection"
          | "noScale"
          | "noScaleOrReflection",
        ...(bone["skin"] === true ? { tags: ["skin"] } : {}),
        ...(bone["color"] === undefined
          ? {}
          : { color: color(bone["color"], path + "/color") }),
      };
    });
    data.slots = slots.map((slot, i): SlotData => {
      const path = `/slots/${i}`;
      fields(slot, "name bone attachment color dark blend", path);
      const blend = string(slot["blend"], path + "/blend", "normal");
      if (!["normal", "additive", "multiply", "screen"].includes(blend))
        fail("SP38_UNSUPPORTED_BLEND", "Unknown blend mode.", path + "/blend");
      const dark =
        slot["dark"] === undefined
          ? undefined
          : color(slot["dark"], path + "/dark");
      return {
        id: slotIds.get(String(slot["name"]))!,
        name: String(slot["name"]),
        boneId: reference(slot["bone"], boneIds, path + "/bone"),
        color: color(slot["color"], path + "/color"),
        ...(dark ? { darkColor: { r: dark.r, g: dark.g, b: dark.b } } : {}),
        blendMode: blend as SlotData["blendMode"],
        zIndex: i,
      };
    });
    const skins = list(source["skins"], "/skins").map((v, i) =>
      object(v, `/skins/${i}`),
    );
    const skinIds = names(skins, options.namespace, "skin", "/skins");
    const setup = new Map<string, string>();
    data.skins = skins.map((skin, i): SkinData => {
      const path = `/skins/${i}`;
      fields(skin, "name bones transform path attachments", path);
      const attachments: SkinData["attachments"] = Object.create(
        null,
      ) as SkinData["attachments"];
      for (const [slotName, raw] of Object.entries(
        object(skin["attachments"] ?? {}, path + "/attachments"),
      )) {
        const at = `${path}/attachments/${pointer(slotName)}`,
          slotId = reference(slotName, slotIds, at);
        attachments[slotId] = Object.entries(object(raw, at)).map(
          ([key, value], j) => {
            const loc = `${at}/${pointer(key)}`,
              item = object(value, loc);
            fields(
              item,
              "name path type x y rotation scaleX scaleY width height uvs vertices triangles hull weights parent skin inheritDeform edges end vertexCount color lengths closed constantSpeed sequence",
              loc,
            );
            const id = `${options.namespace}:attachment:${i}:${slotId}:${j}`;
            if (skin["name"] === "default") setup.set(`${slotId}\0${key}`, id);
            if (item["type"] === "clipping") {
              const vertices = list(item["vertices"], loc + "/vertices").map(
                (value, index) => number(value, `${loc}/vertices/${index}`),
              );
              return {
                type: "clipping" as const,
                id,
                name: string(item["name"], loc + "/name", key),
                vertices: vertices.reduce<{ x: number; y: number }[]>(
                  (result, value, index) =>
                    index % 2
                      ? result
                      : [...result, { x: value, y: vertices[index + 1] ?? 0 }],
                  [],
                ),
                ...(item["end"] === undefined
                  ? {}
                  : {
                      endSlotId: reference(item["end"], slotIds, loc + "/end"),
                    }),
              };
            }
            if (item["type"] === "boundingbox") {
              const vertices = list(item["vertices"], loc + "/vertices").map(
                (value, index) => number(value, `${loc}/vertices/${index}`),
              );
              return {
                type: "boundingBox" as const,
                id,
                name: string(item["name"], loc + "/name", key),
                vertices: vertices.reduce<{ x: number; y: number }[]>(
                  (result, value, index) =>
                    index % 2
                      ? result
                      : [...result, { x: value, y: vertices[index + 1] ?? 0 }],
                  [],
                ),
              };
            }
            if (item["type"] === "path") {
              diagnostics.push({
                code: "SP38_PATH_ATTACHMENT_PRESERVED",
                severity: "warning",
                message:
                  "Spine path attachment payload is preserved until weighted-vertex decoding is available.",
                jsonPointer: loc,
              });
              return {
                type: "unknownPreserved" as const,
                id,
                name: string(item["name"], loc + "/name", key),
                sourceFormat: "spine-3.8-path-attachment",
                payload: item as unknown as JsonValue,
              };
            }
            if (item["type"] === "mesh" || item["type"] === "linkedmesh") {
              const linkedIndex =
                item["parent"] === undefined
                  ? -1
                  : Object.entries(object(raw, at)).findIndex(
                      ([candidateKey, candidate]) =>
                        String(
                          object(candidate, "")["name"] ?? candidateKey,
                        ) === String(item["parent"]),
                    );
              const vertices = list(item["vertices"], loc + "/vertices").map(
                (value, index) => number(value, `${loc}/vertices/${index}`),
              );
              const uvs = list(item["uvs"], loc + "/uvs").map((value, index) =>
                number(value, `${loc}/uvs/${index}`),
              );
              const packedWeights =
                vertices.length !== uvs.length
                  ? (() => {
                      let cursor = 0;
                      const positions: number[] = [];
                      const weightedVertices: {
                        bindPosition: { x: number; y: number };
                        influences: {
                          boneId: string;
                          weight: number;
                          localPosition: { x: number; y: number };
                        }[];
                      }[] = [];
                      for (
                        let vertexIndex = 0;
                        vertexIndex < uvs.length / 2;
                        vertexIndex++
                      ) {
                        const influenceCount = Math.trunc(
                          number(vertices[cursor], `${loc}/vertices/${cursor}`),
                        );
                        cursor += 1;
                        const influences = [];
                        for (
                          let influenceIndex = 0;
                          influenceIndex < influenceCount;
                          influenceIndex++
                        ) {
                          const boneIndex = Math.trunc(
                            number(
                              vertices[cursor],
                              `${loc}/vertices/${cursor}`,
                            ),
                          );
                          const x = number(
                            vertices[cursor + 1],
                            `${loc}/vertices/${cursor + 1}`,
                          );
                          const y = number(
                            vertices[cursor + 2],
                            `${loc}/vertices/${cursor + 2}`,
                          );
                          const weight = number(
                            vertices[cursor + 3],
                            `${loc}/vertices/${cursor + 3}`,
                          );
                          cursor += 4;
                          influences.push({
                            boneId:
                              [...boneIds.values()][boneIndex] ??
                              `bone-${boneIndex}`,
                            weight,
                            localPosition: { x, y },
                          });
                        }
                        const weightSum = influences.reduce(
                          (sum, influence) => sum + influence.weight,
                          0,
                        );
                        if (weightSum > 0 && weightSum !== 1)
                          influences.forEach(
                            (influence) => (influence.weight /= weightSum),
                          );
                        const first = influences[0]?.localPosition ?? {
                          x: 0,
                          y: 0,
                        };
                        positions.push(first.x, first.y);
                        weightedVertices.push({
                          bindPosition: first,
                          influences,
                        });
                      }
                      if (cursor !== vertices.length)
                        fail(
                          "CORE_SOURCE_SCHEMA",
                          "Packed weighted mesh vertices contain trailing data.",
                          loc + "/vertices",
                        );
                      return { positions, weightedVertices };
                    })()
                  : undefined;
              const pair = (values: number[]) =>
                values.reduce<{ x: number; y: number }[]>(
                  (result, value, index) =>
                    index % 2
                      ? result
                      : [...result, { x: value, y: values[index + 1] ?? 0 }],
                  [],
                );
              const weights =
                item["weights"] === undefined
                  ? undefined
                  : list(item["weights"], loc + "/weights").map(
                      (value, index) =>
                        object(value, `${loc}/weights/${index}`),
                    );
              return {
                type: "mesh",
                id,
                name: string(item["name"], loc + "/name", key),
                vertices: pair(packedWeights?.positions ?? vertices),
                uvs: pair(uvs),
                triangles: list(item["triangles"], loc + "/triangles")
                  .map((value, index) =>
                    number(value, `${loc}/triangles/${index}`),
                  )
                  .map(Math.trunc),
                ...(linkedIndex >= 0
                  ? {
                      linkedMeshId: `${options.namespace}:attachment:${i}:${slotId}:${linkedIndex}`,
                      inheritDeform: item["inheritDeform"] === true,
                    }
                  : {}),
                ...(weights
                  ? {
                      weightedVertices: weights.map((weight, index) => ({
                        bindPosition: {
                          x: vertices[index * 2] ?? 0,
                          y: vertices[index * 2 + 1] ?? 0,
                        },
                        influences: list(
                          weight["influences"],
                          `${loc}/weights/${index}/influences`,
                        ).map((raw) => {
                          const influence = object(
                            raw,
                            `${loc}/weights/${index}/influences`,
                          );
                          const boneName = string(influence["boneId"], "");
                          return {
                            boneId: boneIds.get(boneName) ?? boneName,
                            weight: number(influence["weight"], ""),
                            ...(influence["localPosition"]
                              ? {
                                  localPosition: object(
                                    influence["localPosition"],
                                    "",
                                  ) as { x: number; y: number },
                                }
                              : {}),
                          };
                        }),
                      })),
                    }
                  : {}),
                ...(packedWeights
                  ? { weightedVertices: packedWeights.weightedVertices }
                  : {}),
              };
            }
            if (item["type"] === "point") {
              diagnostics.push({
                code: "SP38_POINT_ATTACHMENT_PRESERVED",
                severity: "warning",
                message:
                  "Spine point attachment is preserved until a canonical point attachment contract is available.",
                jsonPointer: loc,
              });
              return {
                type: "unknownPreserved" as const,
                id,
                name: string(item["name"], loc + "/name", key),
                sourceFormat: "spine-point-attachment",
                payload: item as unknown as JsonValue,
              };
            }
            if (item["type"] !== undefined && item["type"] !== "region")
              fail(
                "SP38_UNSUPPORTED_ATTACHMENT",
                "Batch 5 supports region attachments only.",
                loc + "/type",
              );
            const name = string(item["name"], loc + "/name", key),
              image = string(item["path"], loc + "/path", name);
            return {
              type: "region",
              id,
              name,
              transform: transform(item, loc),
              ...texture(
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
              ),
            };
          },
        );
      }
      return {
        id: skinIds.get(String(skin["name"]))!,
        name: String(skin["name"]),
        attachments,
        ...(skin["bones"] === undefined
          ? {}
          : {
              requiredBoneIds: [
                ...list(skin["bones"], path + "/bones"),
                ...list(skin["transform"], path + "/transform"),
              ].map((value, index) =>
                reference(value, boneIds, `${path}/requiredBoneIds/${index}`),
              ),
            }),
      };
    });
    slots.forEach((slot, i) => {
      if (slot["attachment"] === undefined || slot["attachment"] === null)
        return;
      const key = string(slot["attachment"], `/slots/${i}/attachment`);
      const id = setup.get(`${data.slots[i]!.id}\0${key}`);
      if (!id)
        fail(
          "CORE_INVALID_REFERENCE",
          "Setup attachment not found in default skin.",
          `/slots/${i}/attachment`,
        );
      data.slots[i]!.setupAttachmentId = id;
    });
    if (source["animations"] !== undefined) {
      const attachmentIds = new Map(
        data.skins.flatMap((skin) =>
          Object.values(skin.attachments).flatMap((attachments) =>
            attachments.map(
              (attachment) => [attachment.name, attachment.id] as const,
            ),
          ),
        ),
      );
      const animations = object(source["animations"], "/animations");
      data.animations = Object.entries(animations).map(
        ([name, raw], animationIndex) => {
          const channels = object(raw, `/animations/${pointer(name)}`);
          if (!Object.keys(channels).length) {
            diagnostics.push({
              code: "SP38_EMPTY_ANIMATION_PRESERVED",
              severity: "warning",
              message: "Empty animation is preserved without timelines.",
              jsonPointer: `/animations/${pointer(name)}`,
            });
          }
          const timelines = Object.entries(channels).map(
            ([type, channel], timelineIndex) => {
              if (Array.isArray(channel)) {
                diagnostics.push({
                  code: "SP38_ANIMATION_CHANNEL_PRESERVED",
                  severity: "warning",
                  message:
                    "Array-valued animation channel is preserved until a canonical evaluator is available.",
                  jsonPointer: `/animations/${pointer(name)}/${pointer(type)}`,
                });
                return {
                  id: `${options.namespace}:animation:${animationIndex}:${timelineIndex}`,
                  type: `spine.raw.${type}`,
                  keyframes: [
                    {
                      time: 0,
                      value: channel as unknown as JsonValue,
                      curve: { type: "linear" },
                    },
                  ],
                };
              }
              const item = object(
                channel,
                `/animations/${pointer(name)}/${pointer(type)}`,
              );
              const keys = list(
                item["keys"],
                `/animations/${pointer(name)}/${pointer(type)}/keys`,
              ).map((key, keyIndex) => {
                const value = object(
                  key,
                  `/animations/${pointer(name)}/${pointer(type)}/keys/${keyIndex}`,
                );
                return {
                  time: number(value["time"], "", 0),
                  value: (value["value"] ?? null) as JsonValue,
                  curve: (value["curve"] ?? { type: "linear" }) as any,
                };
              });
              return {
                id: `${options.namespace}:animation:${animationIndex}:${timelineIndex}`,
                type,
                ...(typeof item["target"] === "string" &&
                (boneIds.get(item["target"]) ??
                  attachmentIds.get(item["target"]))
                  ? {
                      targetId:
                        boneIds.get(item["target"]) ??
                        attachmentIds.get(item["target"]),
                    }
                  : {}),
                keyframes: keys,
              };
            },
          );
          return {
            id: `${options.namespace}:animation:${animationIndex}`,
            name,
            duration: Math.max(
              0,
              ...timelines.flatMap((timeline) =>
                timeline.keyframes.map((key) => key.time),
              ),
            ),
            timelines,
          };
        },
      );
    }
    if (source["events"] !== undefined) {
      data.events = Object.entries(object(source["events"], "/events")).map(
        ([name, value], index) => ({
          id: `${options.namespace}:event:${index}`,
          name,
          defaults: object(value, `/events/${pointer(name)}`) as any,
        }),
      );
    }
    if (source["constraints"] !== undefined) {
      data.constraints = list(source["constraints"], "/constraints").map(
        (raw, index) => {
          const item = object(raw, `/constraints/${index}`);
          const type = string(item["type"], `/constraints/${index}/type`);
          const name = string(
            item["name"],
            `/constraints/${index}/name`,
            `constraint-${index}`,
          );
          const order = number(
            item["order"],
            `/constraints/${index}/order`,
            index,
          );
          const bones = list(item["bones"], `/constraints/${index}/bones`).map(
            (value, boneIndex) =>
              reference(
                value,
                boneIds,
                `/constraints/${index}/bones/${boneIndex}`,
              ),
          );
          if (type === "ik")
            return {
              id: `${options.namespace}:constraint:${index}`,
              name,
              type,
              order,
              targetBoneId: reference(
                item["target"],
                boneIds,
                `/constraints/${index}/target`,
              ),
              boneIds: bones,
              mix: number(item["mix"], `/constraints/${index}/mix`, 1),
              bendDirection: item["bendPositive"] === false ? -1 : 1,
            } as any;
          if (type === "transform")
            return {
              id: `${options.namespace}:constraint:${index}`,
              name,
              type,
              order,
              targetBoneId: reference(
                item["target"],
                boneIds,
                `/constraints/${index}/target`,
              ),
              boneIds: bones,
              mixRotate: number(
                item["mixRotate"],
                `/constraints/${index}/mixRotate`,
                1,
              ),
              mixTranslateX: number(
                item["mixX"],
                `/constraints/${index}/mixX`,
                1,
              ),
              mixTranslateY: number(
                item["mixY"],
                `/constraints/${index}/mixY`,
                1,
              ),
              mixScaleX: number(
                item["mixScaleX"],
                `/constraints/${index}/mixScaleX`,
                0,
              ),
              mixScaleY: number(
                item["mixScaleY"],
                `/constraints/${index}/mixScaleY`,
                0,
              ),
              mixShearY: number(
                item["mixShearY"],
                `/constraints/${index}/mixShearY`,
                0,
              ),
              local: item["local"] === true,
              relative: item["relative"] === true,
            } as any;
          if (type === "path")
            return {
              id: `${options.namespace}:constraint:${index}`,
              name,
              type,
              order,
              targetSlotId: reference(
                item["target"],
                slotIds,
                `/constraints/${index}/target`,
              ),
              boneIds: bones,
              positionMode: "fixed",
              spacingMode: "fixed",
              rotateMode: "tangent",
              position: number(
                item["position"],
                `/constraints/${index}/position`,
                0,
              ),
              spacing: number(
                item["spacing"],
                `/constraints/${index}/spacing`,
                0,
              ),
              mixRotate: 1,
              mixX: 1,
              mixY: 1,
            } as any;
          fail(
            "SP38_UNSUPPORTED_CONSTRAINT",
            `Unsupported constraint type: ${type}`,
            `/constraints/${index}/type`,
          );
        },
      );
    }
    if (Array.isArray(source["transform"])) {
      diagnostics.push({
        code: "SP38_TRANSFORM_CONSTRAINT_PRESERVED",
        severity: "warning",
        message:
          "Spine transform constraints are preserved but not executed by the canonical runtime.",
        jsonPointer: "/transform",
      });
      data.constraints = [
        ...(data.constraints ?? []),
        ...source["transform"].map((raw, index) => ({
          id: `${options.namespace}:constraint:transform:${index}`,
          name: String(
            (raw as Record<string, unknown>)["name"] ?? `transform-${index}`,
          ),
          type: "unknownPreserved" as const,
          order: Number((raw as Record<string, unknown>)["order"] ?? index),
          sourceFormat: "spine-3.8-transform",
          payload: raw as unknown as JsonValue,
        })),
      ] as any;
    }
    return [data];
  });
}
