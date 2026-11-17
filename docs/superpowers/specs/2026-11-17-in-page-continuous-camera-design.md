# In-Page Continuous Camera Design

Replace the native file-capture picker with an HTTPS `getUserMedia()` camera overlay. After choosing a photo area, the homeowner opens the rear camera once, taps a shutter repeatedly, and each frame is converted to a JPEG `File`, passed through the existing preparation/persistence path, and acknowledged without closing the camera. Closing the overlay stops every media track. Permission denial, unavailable camera APIs, and capture errors show actionable messages; multi-file Upload Photos remains available.

The camera overlay includes a live video preview, saved-photo count/status, shutter button, and Close Camera button. It prevents overlapping shutter operations and stops the stream on close/unmount. The existing automatic metadata, category snapshot, local draft storage, and final submission behavior remain unchanged.
