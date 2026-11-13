import { handleFinalizePhotoSubmission } from "@/lib/demo-five/photo-submission-service";

export async function POST(request: Request) {
  return handleFinalizePhotoSubmission(request);
}
