import { permanentRedirect } from "next/navigation";

export default function LegacyDemoFivePage() {
  permanentRedirect("/photographers/homeowners");
}
