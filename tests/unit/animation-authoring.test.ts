import { expect, it } from "vitest";
import {
  AnimationAuthoringStore,
  AuthoringHistory,
  EventAuthoringTrack,
  fromCanonicalAnimation,
  toCanonicalAnimation,
  createAutoKey,
} from "../../packages/animation/src/index.js";

it("authors clips, keys, selection and canonical round trips", () => {
  const store = new AnimationAuthoringStore();
  const clip = store.create("walk", 2, 30, "walk");
  const channel = store.addChannel({
    id: "root.rotate",
    kind: "bone",
    targetId: "root",
    property: "rotate",
  });
  store.upsertKey(channel.id, 0, 0);
  store.upsertKey(channel.id, 1, 45);
  store.syncRows();
  expect(store.selectKeysInBox(0, 1)).toHaveLength(2);
  const canonical = toCanonicalAnimation(store.active!);
  expect(canonical.timelines[0]!.keyframes).toHaveLength(2);
  expect(
    fromCanonicalAnimation(canonical, 30).channels[0]!.keys[1]!.value,
  ).toBe(45);
  expect(clip.id).toBe("walk");
});

it("applies auto-key policy and groups undoable gestures", () => {
  const channel = {
    id: "c",
    kind: "bone" as const,
    property: "x",
    keys: [] as Array<{
      id: string;
      time: number;
      value: number;
      curve: { type: "linear" };
    }>,
  };
  expect(
    createAutoKey({
      channel,
      time: 0,
      value: 2,
      mode: "off",
      propertyChanged: true,
      isFirstFrame: true,
      idFactory: () => "k",
    }),
  ).toBeUndefined();
  const key = createAutoKey({
    channel,
    time: 0,
    value: 2,
    mode: "first-frame",
    propertyChanged: false,
    isFirstFrame: true,
    idFactory: () => "k",
  });
  expect(key?.id).toBe("k");
  let value = 0;
  const history = new AuthoringHistory();
  history.begin("drag");
  history.execute({
    label: "a",
    do: () => {
      value += 1;
    },
    undo: () => {
      value -= 1;
    },
  });
  history.execute({
    label: "b",
    do: () => {
      value += 2;
    },
    undo: () => {
      value -= 2;
    },
  });
  history.commit();
  history.undo();
  expect(value).toBe(0);
  history.redo();
  expect(value).toBe(3);
});

it("authors event definitions and previews loop crossings", () => {
  const track = new EventAuthoringTrack<{ damage: number }>(1);
  track.addDefinition({ id: "hit", name: "Hit" });
  track.upsert("e", 0.75, "Hit", { damage: 10 });
  expect(track.preview(0, 1.9, true)).toHaveLength(2);
  track.remove("e");
  expect(track.events).toHaveLength(0);
});
