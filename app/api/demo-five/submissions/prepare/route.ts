import { handlePreparePhotoSubmission } from "@/lib/demo-five/photo-submission-service";

export async function POST(request: Request) {
  return handlePreparePhotoSubmission(request);
}
