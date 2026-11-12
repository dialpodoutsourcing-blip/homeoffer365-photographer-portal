import { handleSubmission } from "@/lib/submissions/route-handler";

export async function POST(request: Request) {
  return handleSubmission(request);
}
