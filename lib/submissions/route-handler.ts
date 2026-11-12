import { createClient } from "@supabase/supabase-js";
import {
  createSubmission,
  type InsertSubmission,
  type SubmissionInput,
} from "./create-submission.ts";

type SubmissionEnvironment = {
  SUPABASE_URL?: string;
  SB_SECRET?: string;
};

type SubmissionDependencies = {
  env?: SubmissionEnvironment;
  insert?: InsertSubmission;
};

const invalidResponse = () => Response.json(
  { error: "Enter valid submission details." },
  { status: 400 },
);

function createSupabaseInsert(env: SubmissionEnvironment): InsertSubmission | null {
  const url = env.SUPABASE_URL;
  const secretKey = env.SB_SECRET;
  if (!url || !secretKey) return null;

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return async (submission: SubmissionInput) => {
    const { error } = await supabase.from("photographer_submissions").insert({
      photographer_name: submission.photographerName,
      email: submission.email,
      phone: submission.phone,
      property_address: submission.propertyAddress,
      drive_link: submission.driveLink,
      checklist_complete: submission.checklistComplete,
    });
    if (error) throw error;
  };
}

export async function handleSubmission(
  request: Request,
  dependencies: SubmissionDependencies = {},
): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return invalidResponse();
  }

  const environment = dependencies.env ?? {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SB_SECRET: process.env.SB_SECRET,
  };
  const insert = dependencies.insert ?? createSupabaseInsert(environment);
  if (!insert) return Response.json(
    { error: "Submissions are temporarily unavailable." },
    { status: 503 },
  );

  const result = await createSubmission(payload, insert);
  if (result.ok) return Response.json({ ok: true }, { status: 201 });
  if (result.reason === "invalid") return invalidResponse();

  return Response.json(
    { error: "We could not save your submission. Please try again." },
    { status: 500 },
  );
}
