# SoulFrame QA Checklist

## Automated checks

Run `npm run verify` from the project root. This runs all Node regression tests and then the Vite production build. The same command runs in GitHub Actions on pushes to `main`, version branches (`v5-*`), and pull requests.

## Browser acceptance checklist (manual)

1. Open Product and confirm the Dashboard loads without a blank screen.
2. Open Analyze and load a real supported audio file. Confirm status becomes Ready, technical notes appear, and no upload to a cloud service is implied.
3. Open Report. Toggle Producer / Client, copy the report, and download both TXT formats.
4. Load the Before / After demo or analyze two versions; check that the case study only appears once both analyses are Ready.
5. Open Output; verify Delivery, Supporting Outputs, and Saved Projects sections.
6. Save a project and reload the page; confirm that project metadata and saved projects remain. Export a backup before testing imports.
7. Import that backup and confirm existing projects are preserved without duplicates.
8. Open Classic Demo, About, Walkthrough, How It Works, Share and Artifact Database; verify each lazy-loaded view opens.
9. Check Advanced's technical, UX, beta and release sections.
10. Check the browser console for errors and confirm `npm run build` emits separate ClassicDemo and SecondaryViews chunks.

## Coverage boundaries

- Node tests use synthetic decoded audio and fake localStorage; they check integration contracts, not real listening quality or artifact-detection accuracy.
- React page interactions, navigation, device-specific audio codecs, browser clipboard APIs and genuine LocalStorage behaviour still require browser testing.
- No live backend, hosted report links, authentication or PDF service is introduced by this release.
