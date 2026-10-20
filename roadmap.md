## Landing sequence rebuild
- [x] Capture Enter before hydration, verify early and normal skipping and final-form typing without styling changes.
- [x] Replace the two-video sequence with the supplied single intro and immediate global-key/click skip.
- [x] Apply the latest sign-in styling while preserving the supplied background image.
- [x] Verify key/click skip and final-form input in the browser; verify completion handling in automated tests.
- [ ] Verify uninterrupted real-video playback and natural completion in the preview. Blocker: the test browser never loaded video data from the supplied URL, although the URL returned HTTP 200; completion handling passed tests and a browser ended-event check.
- [x] Field text ("Email", "Password") pure white at normal weight (not bold), field tone matching Google/SSO, supporting labels black — verified in the browser.

## Dashboard layout
- [x] "Bookings over time" and "Appointment reasons" graphs side by side on one row at the user's preview width — verified in the browser at 910x615.