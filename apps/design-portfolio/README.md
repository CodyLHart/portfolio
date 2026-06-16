# Design Portfolio

This app represents Cody's graphic design portfolio. It is currently served by
the root portfolio shell at `/design-portfolio` so the existing Vercel
deployment keeps working while the repo moves toward independent app projects.

When the design portfolio needs its own build pipeline, promote this folder into
a full Next.js app and point the project registry entry in `src/data/projects.ts`
at its deployed URL.
