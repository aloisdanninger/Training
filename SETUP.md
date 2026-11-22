# Einrichtung (einmalig)

## 1. GitHub
Repo: https://github.com/aloisdanninger/Training (privat empfohlen). `main` enthält Code und `docs/`.

## 2. Cloudflare Workers (Hosting, wie beim EMBA-Repo)
1. Cloudflare Dashboard → Workers & Pages → Create → **Import a repository** → `aloisdanninger/Training`.
2. Projektname `training`, Build-Befehl leer, Deploy-Befehl `npx wrangler deploy` (nutzt `wrangler.jsonc`, liefert `docs/` aus).
3. Ergebnis: `https://training.<dein-subdomain>.workers.dev`.

## 3. Cloudflare Access (Zugriffsschutz)
Zero Trust → Access → Applications → Add → Self-hosted:
- Application domain: `training.<dein-subdomain>.workers.dev`
- Policy „Allow“: Include → Emails → `alois.danninger@gmx.at`
- Login-Methode: One-time PIN (Code per E-Mail)

## 4. Sync-Token
GitHub → Settings → Developer settings → Fine-grained token, nur Repo `Training`, Permission *Contents: Read and write*.
In der App „🔑 GitHub-Sync“ → Token einfügen (pro Gerät/Browser; iPad-Home-Bildschirm-Verknüpfung hat eigenen Speicher).
Den Branch `progress` einmalig anlegen: `git push origin main:progress` (oder die App legt die Datei an, sobald der Branch existiert).
