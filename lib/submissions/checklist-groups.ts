import { checklistGroups } from "../../content/photographer-guide.ts";

type ChecklistFormData = Pick<FormData, "get">;

export function checklistGroupsComplete(formData: ChecklistFormData): boolean {
  return checklistGroups.every((_, index) => formData.get(`checklistGroup-${index}`) === "on");
}
