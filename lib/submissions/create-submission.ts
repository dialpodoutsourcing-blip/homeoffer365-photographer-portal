export type SubmissionInput = {
  photographerName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  paymentMethod: "venmo" | "zelle";
  paymentLink: string;
  driveLink: string;
  checklistComplete: boolean;
};

export type InsertSubmission = (submission: SubmissionInput) => Promise<void>;

export type CreateSubmissionResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "persistence" };

const FIELD_LIMITS = {
  photographerName: 200,
  email: 320,
  phone: 50,
  propertyAddress: 500,
  paymentLink: 2048,
  driveLink: 2048,
} as const;

function requiredString(
  value: Record<string, unknown>,
  field: keyof typeof FIELD_LIMITS,
): string | null {
  const candidate = value[field];
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed && trimmed.length <= FIELD_LIMITS[field] ? trimmed : null;
}

export function validateSubmission(value: unknown): SubmissionInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const photographerName = requiredString(record, "photographerName");
  const email = requiredString(record, "email");
  const phone = requiredString(record, "phone");
  const propertyAddress = requiredString(record, "propertyAddress");
  const paymentLink = requiredString(record, "paymentLink");
  const driveLink = requiredString(record, "driveLink");
  const paymentMethod = record.paymentMethod;

  if (
    !photographerName ||
    !email ||
    !phone ||
    !propertyAddress ||
    !paymentLink ||
    !driveLink ||
    !["venmo", "zelle"].includes(paymentMethod as string) ||
    typeof record.checklistComplete !== "boolean" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) return null;

  try {
    const url = new URL(paymentLink);
    if (url.protocol !== "https:" || url.username || url.password) return null;
  } catch {
    return null;
  }

  try {
    const url = new URL(driveLink);
    if (
      url.protocol !== "https:" ||
      !["drive.google.com", "docs.google.com"].includes(url.hostname) ||
      url.username ||
      url.password
    ) return null;
  } catch {
    return null;
  }

  return {
    photographerName,
    email,
    phone,
    propertyAddress,
    paymentMethod: paymentMethod as "venmo" | "zelle",
    paymentLink,
    driveLink,
    checklistComplete: record.checklistComplete,
  };
}

export async function createSubmission(
  value: unknown,
  insert: InsertSubmission,
): Promise<CreateSubmissionResult> {
  const submission = validateSubmission(value);
  if (!submission) return { ok: false, reason: "invalid" };

  try {
    await insert(submission);
    return { ok: true };
  } catch {
    return { ok: false, reason: "persistence" };
  }
}
