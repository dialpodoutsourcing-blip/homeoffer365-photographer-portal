# Camera Review Loop Design

## Intent

Keep the in-page camera open while giving homeowners a familiar check step after every shot.

## Interaction

The selected category opens the existing live rear-camera overlay. Tapping the shutter freezes that frame into an in-page preview without stopping the camera stream. The preview offers **Retake** and **Use Photo**.

- **Retake** discards the captured frame and immediately returns to the live camera without saving.
- **Use Photo** sends the captured file through the existing preparation and local-draft save pipeline. While saving, both actions are disabled. On success, the saved count updates and the live camera resumes for another shot.
- A save failure keeps the preview visible and allows another Use Photo attempt or Retake.
- **Close Camera** remains available from the live view and stops all camera tracks.

## Constraints

- Never open the phone's native file-camera picker.
- Never stop and request the camera stream between shots.
- Only approved frames are persisted.
- Upload Photos remains the fallback for permission or device problems.

## Approach

Use a three-state camera component: starting/live, reviewing, and saving. Capture creates an object URL for the JPEG preview. Retake and successful save revoke it; unmount cleanup revokes any remaining URL and stops the media stream. This preserves the existing camera and persistence boundaries with the smallest change.

## Verification

Tests cover shutter-to-review behavior, Retake without save, Use Photo exactly once, failed-save retry, disabled actions during save, preview URL cleanup, stream continuity, the full suite, and production build.
