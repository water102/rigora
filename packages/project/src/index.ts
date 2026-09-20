import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  parseSkeletonSnapshot,
  serializeSkeletonSnapshot,
  type SkeletonData,
} from "@rigora/model";

export interface HboneManifest {
  format: "hnn-bones";
  formatVersion: 1;
  generator: string;
  createdAt: string;
  modifiedAt: string;
  skeletons: string[];
  assets: string[];
  checksums: Record<string, string>;
  provenance?: Record<string, string>;
  extensions?: Record<string, unknown>;
}

export interface HboneProject {
  manifest: HboneManifest;
  skeletons: Record<string, SkeletonData>;
  assets?: Record<string, Uint8Array>;
  editorState?: unknown;
  provenance?: Record<string, string>;
  extensions?: Record<string, unknown>;
}

export interface ProjectRepository {
  read(path: string): Promise<Uint8Array | undefined>;
  write(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  list(): Promise<string[]>;
}

export interface ProjectParseLimits {
  maxArchiveBytes?: number;
  maxFiles?: number;
  maxAssetBytes?: number;
  maxTotalAssetBytes?: number;
}

const DEFAULT_PARSE_LIMITS: Required<ProjectParseLimits> = {
  maxArchiveBytes: 256 * 1024 * 1024,
  maxFiles: 10_000,
  maxAssetBytes: 64 * 1024 * 1024,
  maxTotalAssetBytes: 192 * 1024 * 1024,
};

/** Deterministic repository used by browser adapters and tests. */
export class InMemoryProjectRepository implements ProjectRepository {
  readonly #files = new Map<string, Uint8Array>();
  async read(path: string): Promise<Uint8Array | undefined> {
    const bytes = this.#files.get(path);
    return bytes ? bytes.slice() : undefined;
  }
  async write(path: string, bytes: Uint8Array): Promise<void> {
    this.#files.set(path, bytes.slice());
  }
  async remove(path: string): Promise<void> {
    this.#files.delete(path);
  }
  async list(): Promise<string[]> {
    return [...this.#files.keys()].sort();
  }
}

export class ProjectLifecycle {
  #project: HboneProject | null = null;
  #path: string | null = null;
  #dirty = false;
  constructor(readonly repository: ProjectRepository) {}
  get project(): HboneProject | null {
    return this.#project;
  }
  get path(): string | null {
    return this.#path;
  }
  get isDirty(): boolean {
    return this.#dirty;
  }
  newProject(project: HboneProject, discard = false): void {
    if (this.#dirty && !discard) throw new Error("PROJECT_UNSAVED_CHANGES");
    this.#project = project;
    this.#path = null;
    this.#dirty = true;
  }
  markDirty(): void {
    if (this.#project) this.#dirty = true;
  }
  async open(path: string, discard = false): Promise<HboneProject> {
    if (this.#dirty && !discard) throw new Error("PROJECT_UNSAVED_CHANGES");
    const bytes = await this.repository.read(path);
    if (!bytes) throw new Error(`PROJECT_NOT_FOUND: ${path}`);
    const project = parseProject(bytes, { verifyChecksums: true });
    this.#project = project;
    this.#path = path;
    this.#dirty = false;
    return project;
  }
  async save(): Promise<void> {
    if (!this.#project) throw new Error("PROJECT_NOT_OPEN");
    if (!this.#path) throw new Error("PROJECT_SAVE_PATH_REQUIRED");
    const bytes = serializeProject(this.#project);
    // Validate the exact bytes before making them visible to readers.
    parseProject(bytes, { verifyChecksums: true });
    const temporaryPath = `${this.#path}.tmp`;
    await this.repository.write(temporaryPath, bytes);
    const persisted = await this.repository.read(temporaryPath);
    if (!persisted) throw new Error("PROJECT_TEMPORARY_WRITE_FAILED");
    parseProject(persisted, { verifyChecksums: true });
    await this.repository.write(this.#path, persisted);
    await this.repository.remove(temporaryPath);
    this.#dirty = false;
  }
  async saveAs(path: string): Promise<void> {
    if (!this.#project) throw new Error("PROJECT_NOT_OPEN");
    this.#path = path;
    await this.save();
  }
  close(discard = false): void {
    if (this.#dirty && !discard) throw new Error("PROJECT_UNSAVED_CHANGES");
    this.#project = null;
    this.#path = null;
    this.#dirty = false;
  }
}

export class AutosaveManager {
  constructor(
    readonly repository: ProjectRepository,
    readonly suffix = ".autosave",
  ) {}
  pathFor(projectPath: string): string {
    return `${projectPath}${this.suffix}`;
  }
  async save(projectPath: string, project: HboneProject): Promise<string> {
    const path = this.pathFor(projectPath);
    await this.repository.write(path, serializeProject(project));
    return path;
  }
  async recover(projectPath: string): Promise<HboneProject | undefined> {
    const result = await this.recoverDetailed(projectPath);
    return result.ok ? result.project : undefined;
  }
  async recoverDetailed(
    projectPath: string,
  ): Promise<
    { ok: true; project: HboneProject } | { ok: false; error: string }
  > {
    const bytes = await this.repository.read(this.pathFor(projectPath));
    if (!bytes) return { ok: false, error: "AUTOSAVE_NOT_FOUND" };
    try {
      return {
        ok: true,
        project: parseProject(bytes, { verifyChecksums: true }),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "AUTOSAVE_CORRUPT",
      };
    }
  }
  async clear(projectPath: string): Promise<void> {
    await this.repository.remove(this.pathFor(projectPath));
  }
}

export interface AutosaveControllerOptions {
  debounceMs?: number;
  intervalMs?: number;
}
export class AutosaveController {
  #timer: ReturnType<typeof setTimeout> | undefined;
  #interval: ReturnType<typeof setInterval> | undefined;
  #dirty = false;
  constructor(
    readonly manager: AutosaveManager,
    readonly projectPath: string,
    readonly getProject: () => HboneProject | undefined,
    readonly options: AutosaveControllerOptions = {},
  ) {}
  start(): void {
    this.stop();
    if (this.options.intervalMs !== undefined && this.options.intervalMs > 0)
      this.#interval = setInterval(
        () => void this.flush(),
        this.options.intervalMs,
      );
  }
  stop(): void {
    if (this.#timer) clearTimeout(this.#timer);
    if (this.#interval) clearInterval(this.#interval);
    this.#timer = undefined;
    this.#interval = undefined;
  }
  markDirty(): void {
    this.#dirty = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(
      () => void this.flush(),
      Math.max(0, this.options.debounceMs ?? 500),
    );
  }
  async flush(): Promise<void> {
    if (!this.#dirty) return;
    const project = this.getProject();
    if (!project) return;
    await this.manager.save(this.projectPath, project);
    this.#dirty = false;
    this.#timer = undefined;
  }
  get isDirty(): boolean {
    return this.#dirty;
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCrc32(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]!) & 0xff]!;
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

const text = (value: unknown) =>
  JSON.stringify(sortKeys(value), null, 2) + "\n";

export function createProject(
  skeletons: Record<string, SkeletonData>,
  optionsOrNow?:
    | string
    | {
        assets?: Record<string, Uint8Array>;
        editorState?: unknown;
        provenance?: Record<string, string>;
        extensions?: Record<string, unknown>;
        now?: string;
        generator?: string;
      },
): HboneProject {
  const options =
    typeof optionsOrNow === "string"
      ? { now: optionsOrNow }
      : (optionsOrNow ?? {});
  const now = options.now ?? new Date().toISOString();
  const skeletonIds = Object.keys(skeletons).sort();
  const assetPaths = Object.keys(options.assets ?? {}).sort();

  return {
    manifest: {
      format: "hnn-bones",
      formatVersion: 1,
      generator: options.generator ?? "Rigora",
      createdAt: now,
      modifiedAt: now,
      skeletons: skeletonIds,
      assets: assetPaths,
      checksums: {},
      ...(options.provenance ? { provenance: options.provenance } : {}),
      ...(options.extensions ? { extensions: options.extensions } : {}),
    },
    skeletons: Object.fromEntries(
      skeletonIds.map((id) => [id, skeletons[id]!]),
    ),
    ...(options.assets ? { assets: { ...options.assets } } : {}),
    ...(options.editorState !== undefined
      ? { editorState: options.editorState }
      : {}),
    ...(options.provenance ? { provenance: { ...options.provenance } } : {}),
    ...(options.extensions ? { extensions: { ...options.extensions } } : {}),
  };
}

export function serializeProject(project: HboneProject): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const checksums: Record<string, string> = {};

  // 1. Skeletons
  const skeletonIds = Object.keys(project.skeletons).sort();
  for (const id of skeletonIds) {
    const path = `skeletons/${id}.json`;
    const bytes = strToU8(serializeSkeletonSnapshot(project.skeletons[id]!));
    files[path] = bytes;
    checksums[path] = computeCrc32(bytes);
  }

  // 2. Assets
  const assetPaths = Object.keys(project.assets ?? {}).sort();
  for (const assetPath of assetPaths) {
    const fullPath = `assets/${assetPath}`;
    const bytes = project.assets![assetPath]!;
    files[fullPath] = bytes;
    checksums[fullPath] = computeCrc32(bytes);
  }

  // 3. Editor State
  if (project.editorState !== undefined) {
    const path = "editor/state.json";
    const bytes = strToU8(text(project.editorState));
    files[path] = bytes;
    checksums[path] = computeCrc32(bytes);
  }

  // 4. Provenance
  if (project.provenance) {
    const provKeys = Object.keys(project.provenance).sort();
    for (const key of provKeys) {
      const path = `provenance/${key}`;
      const bytes = strToU8(project.provenance[key]!);
      files[path] = bytes;
      checksums[path] = computeCrc32(bytes);
    }
  }

  // 5. Manifest
  const manifest: HboneManifest = {
    ...project.manifest,
    format: "hnn-bones",
    formatVersion: 1,
    generator: project.manifest.generator || "Rigora",
    createdAt: project.manifest.createdAt || new Date().toISOString(),
    modifiedAt: project.manifest.modifiedAt || project.manifest.createdAt,
    skeletons: skeletonIds,
    assets: assetPaths,
    checksums,
    ...(project.provenance ? { provenance: project.provenance } : {}),
    ...(project.extensions ? { extensions: project.extensions } : {}),
  };

  files["manifest.json"] = strToU8(text(manifest));

  return zipSync(files, { level: 6 });
}

export function parseProject(
  bytes: Uint8Array,
  options?: { verifyChecksums?: boolean; limits?: ProjectParseLimits },
): HboneProject {
  const limits = { ...DEFAULT_PARSE_LIMITS, ...(options?.limits ?? {}) };
  if (bytes.byteLength > limits.maxArchiveBytes) {
    throw new Error("NATIVE_ARCHIVE_TOO_LARGE");
  }
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("NATIVE_CORRUPT_ARCHIVE");
  }
  const fileEntries = Object.entries(files);
  if (fileEntries.length > limits.maxFiles)
    throw new Error("NATIVE_TOO_MANY_FILES");
  for (const [filePath] of fileEntries) {
    if (
      filePath.startsWith("/") ||
      filePath.includes("\\") ||
      filePath.split("/").some((part) => part === ".." || part === ".")
    ) {
      throw new Error(`NATIVE_UNSAFE_PATH: ${filePath}`);
    }
  }

  const manifestFile = files["manifest.json"];
  if (!manifestFile) {
    throw new Error("NATIVE_MISSING_MANIFEST");
  }

  let manifest: HboneManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestFile)) as HboneManifest;
  } catch {
    throw new Error("NATIVE_INVALID_MANIFEST");
  }

  if (manifest.format !== "hnn-bones" || manifest.formatVersion !== 1) {
    throw new Error("NATIVE_INVALID_PROJECT");
  }

  const skeletons: Record<string, SkeletonData> = {};
  for (const id of manifest.skeletons) {
    const file = files[`skeletons/${id}.json`];
    if (!file) {
      throw new Error(`NATIVE_MISSING_SKELETON: ${id}`);
    }
    skeletons[id] = parseSkeletonSnapshot(strFromU8(file));
  }

  const assets: Record<string, Uint8Array> = {};
  let totalAssetBytes = 0;
  for (const [filePath, content] of fileEntries) {
    if (filePath.startsWith("assets/")) {
      const assetKey = filePath.slice("assets/".length);
      if (!assetKey || content.byteLength > limits.maxAssetBytes) {
        throw new Error(`NATIVE_ASSET_TOO_LARGE: ${assetKey}`);
      }
      totalAssetBytes += content.byteLength;
      if (totalAssetBytes > limits.maxTotalAssetBytes) {
        throw new Error("NATIVE_ASSETS_TOO_LARGE");
      }
      assets[assetKey] = content;
    }
  }

  const editorFile = files["editor/state.json"];
  let editorState: unknown;
  if (editorFile) {
    try {
      editorState = JSON.parse(strFromU8(editorFile));
    } catch {
      editorState = undefined;
    }
  }

  const provenance: Record<string, string> = {};
  if (manifest.provenance) {
    Object.assign(provenance, manifest.provenance);
  }
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.startsWith("provenance/")) {
      const provKey = filePath.slice("provenance/".length);
      provenance[provKey] = strFromU8(content);
    }
  }

  if (options?.verifyChecksums && manifest.checksums) {
    for (const [filePath, expectedCrc] of Object.entries(manifest.checksums)) {
      const file = files[filePath];
      if (!file) {
        throw new Error(`NATIVE_CHECKSUM_FILE_MISSING: ${filePath}`);
      }
      const actualCrc = computeCrc32(file);
      if (actualCrc !== expectedCrc) {
        throw new Error(`NATIVE_CHECKSUM_MISMATCH: ${filePath}`);
      }
    }
  }

  return {
    manifest,
    skeletons,
    ...(Object.keys(assets).length > 0 ? { assets } : {}),
    ...(editorState !== undefined ? { editorState } : {}),
    ...(Object.keys(provenance).length > 0 ? { provenance } : {}),
    ...(manifest.extensions ? { extensions: manifest.extensions } : {}),
  };
}
