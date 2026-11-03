# Publish VENDA on Render

[Deploy VENDA to Render](https://render.com/deploy?repo=https://github.com/panorago/Operations-Platform)

1. Sign in to Render and connect the GitHub account that can access `panorago/Operations-Platform`.
2. Follow the deployment link above. The repository's `render.yaml` creates the web app and a persistent disk. **This selects a paid Starter service and 1 GB disk. Render shows its current pricing before you confirm creation.** No Render resources have been created by the chat agent.
3. Confirm service creation and wait for the build/deployment status to become **Live**. Open the `onrender.com` URL shown on the service's dashboard. That is your live application link; its hostname is assigned by Render and cannot be known or verified beforehand.
4. On the Render service, open **Environment**, locate the automatically generated `SETUP_TOKEN`, and reveal/copy it securely. Enter it in VENDA's **Workspace setup key** field, then choose your administrator name, email, and password. The key prevents other visitors from claiming your workspace before you. Never post it in chat. Once the first account exists, setup is disabled and normal sign-in applies.

The same HTTPS service hosts the React UI and API. The database resides on `/var/data/venda`, backed by the attached disk. The public readiness endpoint is `/api/health` and must return `{ "status": "ok" }`. Deployments from `main` build with Node 24, use the committed lockfile, and start the application with secure cookies. Optional AI, email, and SMS credentials can be added later through Render's Environment settings; consult README.md. No provider credentials are needed just to view and use the seeded operations workflows.

If the repository is private, Render needs GitHub access to that specific repository. Do not change its visibility to work around missing authorisation. This configuration uses one service instance because it uses a local SQLite disk. Do not remove the disk or replace it with an ephemeral directory if you need to retain operational data.
