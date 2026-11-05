import { Upload, FolderOpen } from "lucide-react";
import { guideLinks } from "@/content/photographer-guide";
import { ResourceLink } from "./resource-link";

export function UploadSection() {
  return (
    <section id="upload" className="upload-section">
      <span className="upload-icon"><Upload size={27} aria-hidden="true" /></span>
      <div>
        <span className="eyebrow">THE FINAL STEP</span>
        <h2>Good work. Now send it our way.</h2>
        <p>Organize your photos and videos by property address and category. Report any missing or inaccessible areas.</p>
        <ResourceLink className="button primary" href={guideLinks.upload}>Open property workspace</ResourceLink>
        <p className="upload-note"><FolderOpen size={14} aria-hidden="true" />Use your private property link. No photographer account needed.</p>
      </div>
    </section>
  );
}
