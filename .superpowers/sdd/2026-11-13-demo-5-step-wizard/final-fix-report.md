
## Final test coverage fix

- Changed the new-capture fixture ID from `photo-0` to `photo-new`, so it exercises append behavior.
- Added assertions that rendered category counts total 11 and the persisted draft contains 11 photos; the original draft object remains at 10 photos.
- Read the persisted IndexedDB draft and asserted the original first photo metadata and blob bytes are unchanged.
- Commands: `node --test tests/demo-five-photo-form.test.mjs` (25 passed, 0 failed); `npm test` (231 passed, 0 failed); `git diff --check` (passed).
- Commit: `1c036a75b0bfd8c170974cc0b6b3b0e3e538739c` (`test: cover new photo append behavior`).
- Self-review: only the targeted test file and this report changed. The tests emit existing Node module-type performance warnings; no failures or other concerns.
