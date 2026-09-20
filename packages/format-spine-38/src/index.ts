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
    fields(source, "skeleton bones slots skins animations", "");
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
        "name parent length x y rotation scaleX scaleY shearX shearY transform color",
        path,
      );
      if (bone["transform"] !== undefined && bone["transform"] !== "normal")
        fail(
          "SP38_UNSUPPORTED_INHERITANCE",
          "Non-normal source inheritance requires source-specific normalization fixtures.",
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
        inherit: "normal",
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
      fields(skin, "name attachments", path);
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
              "name path type x y rotation scaleX scaleY width height",
              loc,
            );
            if (item["type"] !== undefined && item["type"] !== "region")
              fail(
                "SP38_UNSUPPORTED_ATTACHMENT",
                "Batch 5 supports region attachments only.",
                loc + "/type",
              );
            const name = string(item["name"], loc + "/name", key),
              image = string(item["path"], loc + "/path", name);
            const id = `${options.namespace}:attachment:${i}:${slotId}:${j}`;
            if (skin["name"] === "default") setup.set(`${slotId}\0${key}`, id);
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
      const animations = object(source["animations"], "/animations");
      data.animations = Object.entries(animations).map(
        ([name, raw], animationIndex) => {
          const channels = object(raw, `/animations/${pointer(name)}`);
          if (!Object.keys(channels).length)
            fail(
              "CORE_UNSUPPORTED_SOURCE_FIELD",
              "Animation has no supported timelines.",
              `/animations/${pointer(name)}`,
            );
          const timelines = Object.entries(channels).map(
            ([type, channel], timelineIndex) => {
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
                boneIds.get(item["target"])
                  ? { targetId: boneIds.get(item["target"]) }
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
    return [data];
  });
}
