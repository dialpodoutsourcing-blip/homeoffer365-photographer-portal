import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { validateSubmissionManifest, type PhotoMetadata, type PhotographerDetails, type PhotoSubmissionManifest, type NotApplicableSelection } from "./photo-workflow.ts";

type ExpectedPath = { clientPhotoId: string; objectPath: string };
type UploadedPhoto = PhotoMetadata & { objectPath: string };
type Photographer = PhotographerDetails & { id: string };
type UploadSession = {
  id: string;
  photographerId: string;
  propertyAddress: string;
  idempotencyKey: string;
  status: "prepared" | "finalized" | "failed" | "expired";
  expectedPaths: ExpectedPath[];
  preparedManifest: PhotoSubmissionManifest;
  notApplicable: NotApplicableSelection[];
  expiresAt: string;
};
type FinalizedSubmission = { submissionId: string; photographerId: string; photoCount: number };
export type PhotoSubmissionOperations = {
  consumeRateLimit(subjectHash: string, phase: "prepare" | "finalize", idempotencyKey: string | null): Promise<number>;
  findPhotographer(email: string): Promise<Photographer | null>;
  savePhotographer(details: PhotographerDetails, id: string | undefined, updatedAt: string): Promise<Photographer>;
  findSession(key: string): Promise<UploadSession | null>;
  createSession(session: UploadSession): Promise<UploadSession>;
  signUpload(path: string): Promise<string>;
  inspectObject(path: string): Promise<{ mimeType: string | undefined; byteSize: number | undefined } | null>;
  markTerminal(id: string, key: string, status: "failed" | "expired"): Promise<boolean>;
  removeObjects(paths: string[]): Promise<void>;
  finalize(session: UploadSession, photos: UploadedPhoto[], notApplicable: NotApplicableSelection[]): Promise<FinalizedSubmission>;
};
export type PhotoSubmissionDependencies = {
  env?: { SUPABASE_URL?: string; SB_SECRET?: string; VERCEL?: string };
  operations?: PhotoSubmissionOperations;
  now?: () => number;
  uuid?: () => string;
  logError?: (message: string) => void;
};

const BUCKET = "photographer-photos";
// Storage signed upload tokens have a fixed two-hour lifetime and cannot be
// configured through createSignedUploadUrl. Never enable overwrite on these tokens.
const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class SubmissionError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message); this.status = status; this.code = code;
  }
}
function fail(status: number, code: string, message: string): never { throw new SubmissionError(status, code, message); }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function errorCode(error: unknown): string | undefined { return record(error) && typeof error.code === "string" ? error.code : undefined; }
function uuidInput(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) fail(400, "INVALID_INPUT", "Valid session identifiers are required.");
  return value.toLowerCase();
}
function canonicalManifest(input: unknown): PhotoSubmissionManifest {
  const result = validateSubmissionManifest(input);
  if (!result.ok) fail(400, "INVALID_INPUT", result.error);
  result.value.photos.sort((a, b) => a.clientPhotoId < b.clientPhotoId ? -1 : a.clientPhotoId > b.clientPhotoId ? 1 : 0);
  result.value.notApplicable.sort((a, b) => `${a.category}:${a.photoType}` < `${b.category}:${b.photoType}` ? -1 : 1);
  return result.value;
}
function comparable(manifest: PhotoSubmissionManifest): string {
  return JSON.stringify({ ...manifest, photographer: { email: manifest.photographer.email } });
}
function sessionRow(row: Record<string, unknown>): UploadSession {
  return {
    id: row.id as string, photographerId: row.photographer_id as string,
    propertyAddress: row.property_address as string, idempotencyKey: row.idempotency_key as string,
    status: row.status as UploadSession["status"], expectedPaths: row.expected_paths as ExpectedPath[],
    preparedManifest: row.prepared_manifest as PhotoSubmissionManifest,
    notApplicable: row.not_applicable as NotApplicableSelection[], expiresAt: row.expires_at as string,
  };
}
function personRow(row: Record<string, unknown>): Photographer {
  return { id: row.id as string, name: row.name as string, email: row.email as string,
    phone: row.phone as string, paymentMethod: row.payment_method as string, paymentUrl: row.payment_url as string };
}

/** Supabase is used only on the server with a service-role key. The injectable
 * operations keep database/storage I/O outside validation and retry decisions. */
export function createPhotoSubmissionOperations(client: SupabaseClient): PhotoSubmissionOperations {
  return {
    async consumeRateLimit(subjectHash, phase, idempotencyKey) {
      const { data, error } = await client.rpc("consume_photographer_upload_rate_limit", {
        p_subject_hash: subjectHash, p_phase: phase, p_idempotency_key: idempotencyKey,
      });
      if (error) throw error;
      if (!Number.isInteger(data) || data < 0 || data > 900) throw new Error("Invalid rate limit response.");
      return data as number;
    },
    async findPhotographer(email) {
      // The owner's existing rows may contain whitespace. Escape LIKE's literal
      // characters, page candidates, then enforce the index's trim/lower semantics.
      const escaped = email.replace(/[\\%_]/g, "\\$&");
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await client.from("photographers").select("*")
          .ilike("email", `%${escaped}%`).order("id").range(offset, offset + 99);
        if (error) throw error;
        const match = data.find(row => typeof row.email === "string" && row.email.trim().toLowerCase() === email);
        if (match) return personRow(match);
        if (data.length < 100) return null;
      }
    },
    async savePhotographer(details, id, updatedAt) {
      const row = { name: details.name, email: details.email, phone: details.phone,
        payment_method: details.paymentMethod, payment_url: details.paymentUrl, updated_at: updatedAt };
      const table = client.from("photographers");
      const { data, error } = await (id ? table.update(row).eq("id", id) : table.insert(row)).select("*").single();
      if (error) throw error;
      return personRow(data);
    },
    async findSession(key) {
      const { data, error } = await client.from("photographer_upload_sessions").select("*").eq("idempotency_key", key).maybeSingle();
      if (error) throw error;
      return data ? sessionRow(data) : null;
    },
    async createSession(s) {
      const { data, error } = await client.from("photographer_upload_sessions").insert({
        id: s.id, photographer_id: s.photographerId, property_address: s.propertyAddress,
        idempotency_key: s.idempotencyKey, status: s.status, expected_paths: s.expectedPaths,
        prepared_manifest: s.preparedManifest, not_applicable: s.notApplicable, expires_at: s.expiresAt,
      }).select("*").single();
      if (error) throw error;
      return sessionRow(data);
    },
    async signUpload(path) {
      const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
      if (error) throw error;
      return data.token;
    },
    async inspectObject(path) {
      const { data, error } = await client.storage.from(BUCKET).info(path);
      if (error) {
        if (errorCode(error) === "NoSuchKey" || (error.status === 404 && !errorCode(error))) return null;
        throw error;
      }
      return { mimeType: data.contentType, byteSize: data.size };
    },
    async markTerminal(id, key, status) {
      // This conditional UPDATE locks the same session row as the finalize RPC.
      // A concurrent successful finalize therefore prevents cleanup of its files.
      const { data, error } = await client.from("photographer_upload_sessions").update({ status })
        .eq("id", id).eq("idempotency_key", key).eq("status", "prepared").select("id");
      if (error) throw error;
      return data.length === 1;
    },
    async removeObjects(paths) {
      const { error } = await client.storage.from(BUCKET).remove(paths);
      if (error) throw error;
    },
    async finalize(s, photos, notApplicable) {
      const { data, error } = await client.rpc("finalize_photographer_upload_session", {
        p_session_id: s.id, p_idempotency_key: s.idempotencyKey, p_photos: photos, p_not_applicable: notApplicable,
      });
      if (error) throw error;
      return data as FinalizedSubmission;
    },
  };
}

function resolveDependencies(dependencies: PhotoSubmissionDependencies) {
  const env = dependencies.env ?? { SUPABASE_URL: process.env.SUPABASE_URL, SB_SECRET: process.env.SB_SECRET };
  let operations = dependencies.operations;
  if (!operations) {
    if (!env.SUPABASE_URL || !env.SB_SECRET) fail(503, "UNAVAILABLE", "Photo submissions are temporarily unavailable.");
    operations = createPhotoSubmissionOperations(createClient(env.SUPABASE_URL, env.SB_SECRET, {
      auth: { persistSession: false, autoRefreshToken: false },
    }));
  }
  return { operations, now: dependencies.now ?? Date.now, uuid: dependencies.uuid ?? (() => crypto.randomUUID()),
    logError: dependencies.logError ?? ((message: string) => console.error(message)) };
}
type ResolvedDependencies = ReturnType<typeof resolveDependencies>;
async function cleanup(session: UploadSession, status: "failed" | "expired", deps: ResolvedDependencies) {
  try {
    if (!await deps.operations.markTerminal(session.id, session.idempotencyKey, status)) return;
    const prefix = `${session.photographerId}/${session.id}/`;
    const paths = session.expectedPaths.map(p => p.objectPath);
    if (paths.some(path => !path.startsWith(prefix) || path.slice(prefix.length).includes("/") || path.includes(".."))) {
      deps.logError("Photo submission cleanup rejected invalid stored paths."); return;
    }
    await deps.operations.removeObjects(paths);
  } catch { deps.logError("Photo submission cleanup failed."); }
}
async function checkSession(session: UploadSession, deps: ResolvedDependencies) {
  if (session.status === "finalized") return;
  if (session.status === "expired" || Date.parse(session.expiresAt) <= deps.now()) {
    await cleanup(session, "expired", deps);
    fail(410, "SESSION_EXPIRED", "The upload session expired. Prepare a new submission to try again.");
  }
  if (session.status !== "prepared") fail(409, "SESSION_FAILED", "This upload session cannot be completed. Prepare a new submission.");
}
async function runService<T>(dependencies: PhotoSubmissionDependencies, work: (deps: ResolvedDependencies) => Promise<T>): Promise<T> {
  try { return await work(resolveDependencies(dependencies)); }
  catch (error) {
    if (error instanceof SubmissionError) throw error;
    (dependencies.logError ?? console.error)("Photo submission operation failed.");
    fail(503, "RETRYABLE_FAILURE", "We could not complete the photo submission. Please try again.");
  }
}

export async function preparePhotoSubmission(input: unknown, dependencies: PhotoSubmissionDependencies = {}) {
  return runService(dependencies, async deps => {
    const manifest = canonicalManifest(input);
    const key = uuidInput(record(input) ? input.idempotencyKey : undefined);
    if (record(input) && Array.isArray(input.photos) && input.photos.some(p => record(p) && ("objectPath" in p || "blob" in p))) {
      fail(400, "INVALID_INPUT", "Send photo metadata without blobs or object paths.");
    }
    let session = await deps.operations.findSession(key);
    let reusedSession = session !== null;
    const validateRetry = async (s: UploadSession) => {
      if (!s.preparedManifest || comparable(canonicalManifest(s.preparedManifest)) !== comparable(manifest)) {
        fail(409, "MANIFEST_CHANGED", "This idempotency key belongs to a different photo manifest.");
      }
      await checkSession(s, deps);
    };
    if (session) await validateRetry(session);
    let photographer = await deps.operations.findPhotographer(manifest.photographer.email);
    try {
      photographer = await deps.operations.savePhotographer(manifest.photographer, photographer?.id, new Date(deps.now()).toISOString());
    } catch (error) {
      if (errorCode(error) !== "23505") throw error;
      photographer = await deps.operations.findPhotographer(manifest.photographer.email);
      if (!photographer) throw error;
      photographer = await deps.operations.savePhotographer(manifest.photographer, photographer.id, new Date(deps.now()).toISOString());
    }
    if (!session) {
      const id = deps.uuid();
      const newSession: UploadSession = {
        id, photographerId: photographer.id, propertyAddress: manifest.propertyAddress,
        idempotencyKey: key, status: "prepared", preparedManifest: manifest,
        notApplicable: manifest.notApplicable, expiresAt: new Date(deps.now() + SESSION_LIFETIME_MS).toISOString(),
        expectedPaths: manifest.photos.map(p => ({ clientPhotoId: p.clientPhotoId,
          objectPath: `${photographer.id}/${id}/${deps.uuid()}.${p.mimeType === "image/jpeg" ? "jpg" : "webp"}` })),
      };
      try { session = await deps.operations.createSession(newSession); }
      catch (error) {
        if (errorCode(error) !== "23505") throw error;
        session = await deps.operations.findSession(key);
        if (!session) throw error;
        reusedSession = true;
        await validateRetry(session);
      }
    }
    // Existing objects cannot receive a new non-upsert signed token. Verify
    // partial uploads before marking them complete; finalized sessions already
    // passed verification and must recover their committed result without uploads.
    const uploads = [];
    const metadata = new Map(manifest.photos.map(photo => [photo.clientPhotoId, photo]));
    for (const path of session.expectedPaths) {
      if (session.status === "finalized") {
        uploads.push({ ...path, alreadyUploaded: true, signedToken: null });
        continue;
      }
      const object = reusedSession ? await deps.operations.inspectObject(path.objectPath) : null;
      if (object) {
        const photo = metadata.get(path.clientPhotoId);
        if (!photo || object.mimeType !== photo.mimeType || object.byteSize !== photo.byteSize) {
          await cleanup(session, "failed", deps);
          fail(422, "OBJECT_MISMATCH", "An uploaded photo does not match its prepared type or size. Prepare a new submission.");
        }
        uploads.push({ ...path, alreadyUploaded: true, signedToken: null });
      } else {
        uploads.push({ ...path, alreadyUploaded: false, signedToken: await deps.operations.signUpload(path.objectPath) });
      }
    }
    return { sessionId: session.id, idempotencyKey: session.idempotencyKey, uploads };
  });
}

export async function finalizePhotoSubmission(input: unknown, dependencies: PhotoSubmissionDependencies = {}) {
  return runService(dependencies, async deps => {
    if (!record(input)) fail(400, "INVALID_INPUT", "An uploaded photo manifest is required.");
    const sessionId = uuidInput(input.sessionId), key = uuidInput(input.idempotencyKey);
    const session = await deps.operations.findSession(key);
    if (!session || session.id !== sessionId) fail(404, "SESSION_NOT_FOUND", "Upload session not found.");
    if (!session.preparedManifest) fail(409, "SESSION_FAILED", "Prepare a new submission.");
    const manifest = canonicalManifest({ ...session.preparedManifest, photos: input.photos, notApplicable: input.notApplicable });
    if (comparable(manifest) !== comparable(canonicalManifest(session.preparedManifest))) {
      fail(409, "MANIFEST_CHANGED", "Uploaded metadata does not match the prepared manifest.");
    }
    const submittedPaths = new Map((input.photos as Record<string, unknown>[]).map(p => [(p.clientPhotoId as string).trim(), p.objectPath]));
    const expected = new Map(session.expectedPaths.map(p => [p.clientPhotoId, p.objectPath]));
    if (expected.size !== manifest.photos.length || new Set(expected.values()).size !== expected.size ||
      manifest.photos.some(p => typeof submittedPaths.get(p.clientPhotoId) !== "string" || submittedPaths.get(p.clientPhotoId) !== expected.get(p.clientPhotoId))) {
      fail(409, "PATH_MISMATCH", "Uploaded paths do not match the upload session.");
    }
    const photos = manifest.photos.map(p => ({ ...p, objectPath: expected.get(p.clientPhotoId)! }));
    await checkSession(session, deps);
    if (session.status !== "finalized") {
      for (const photo of photos) {
        const object = await deps.operations.inspectObject(photo.objectPath);
        if (!object) fail(409, "UPLOAD_INCOMPLETE", "Some photos have not uploaded yet. Retry the missing uploads.");
        if (object.mimeType !== photo.mimeType || object.byteSize !== photo.byteSize) {
          await cleanup(session, "failed", deps);
          fail(422, "OBJECT_MISMATCH", "An uploaded photo does not match its prepared type or size. Prepare a new submission.");
        }
      }
    }
    try { return await deps.operations.finalize(session, photos, manifest.notApplicable); }
    catch (error) {
      if (["P0001", "23514", "23503", "22007", "22008", "22P02"].includes(errorCode(error) ?? "")) {
        await cleanup(session, "failed", deps);
        fail(422, "FINALIZE_REJECTED", "The photo submission could not be finalized. Prepare a new submission.");
      }
      throw error;
    }
  });
}

async function handle(request: Request, phase: "prepare" | "finalize", dependencies: PhotoSubmissionDependencies) {
  let input: unknown;
  try { input = await request.json(); }
  catch { return Response.json({ error: "Enter valid photo submission details.", code: "INVALID_INPUT" }, { status: 400 }); }
  try {
    const retryAfter = await runService(dependencies, async deps => {
      const env = dependencies.env ?? process.env;
      if (!env.SB_SECRET) fail(503, "UNAVAILABLE", "Photo submissions are temporarily unavailable.");
      // Only trust Vercel's platform-owned header when actually running there.
      // Missing/malformed IPs and non-Vercel deployments share a bounded bucket;
      // arbitrary forwarding headers never create attacker-controlled buckets.
      const forwarded = env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.trim() ?? "" : "";
      const family = forwarded.includes("%") ? 0 : isIP(forwarded);
      const address = family === 6 ? new URL(`http://[${forwarded}]/`).hostname : family === 4 ? forwarded : "unknown-client";
      const subjectHash = createHmac("sha256", env.SB_SECRET).update(`demo-five-rate-limit:${address}`).digest("hex");
      const key = record(input) && typeof input.idempotencyKey === "string" && UUID.test(input.idempotencyKey) ? input.idempotencyKey.toLowerCase() : null;
      return deps.operations.consumeRateLimit(subjectHash, phase, key);
    });
    if (retryAfter > 0) return Response.json({ error: "Too many photo submission attempts. Please wait and retry; your local photos are saved.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter) } });
    const result = await (phase === "prepare" ? preparePhotoSubmission(input, dependencies) : finalizePhotoSubmission(input, dependencies));
    return Response.json(result, { status: phase === "prepare" ? 201 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof SubmissionError)) throw error;
    return Response.json({ error: error.message, code: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
}
export function handlePreparePhotoSubmission(request: Request, dependencies: PhotoSubmissionDependencies = {}) { return handle(request, "prepare", dependencies); }
export function handleFinalizePhotoSubmission(request: Request, dependencies: PhotoSubmissionDependencies = {}) { return handle(request, "finalize", dependencies); }
