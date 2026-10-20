# Running RetroQuest on the HostUp VPS

RetroQuest is a static web app: the build in `web/dist` is all there is. On the VPS at
`136.148.215.87` it is served at `https://retroquest.rmstdope.eu` by the server's shared **edge**
Caddy, which also forwards `dominos.rmstdope.eu` to the Dominos stack. The domain's DNS is at
HostUp.

Every green CI run on `main` is deployed by the **Deploy to VPS** workflow
(`.github/workflows/deploy-vps.yml`): it builds the app, copies `web/dist` to `/srv/retroquest` on
the server as the `deploy` user, and checks the site serves the new build. Running the workflow by
hand deploys `main` as it is now.

## Settings in GitHub

Repository → Settings → Secrets and variables → Actions:

| Kind     | Name              | Value                                      |
| -------- | ----------------- | ------------------------------------------ |
| secret   | `VPS_HOST`        | `136.148.215.87`                           |
| secret   | `VPS_SSH_KEY`     | the private key the `deploy` user accepts  |
| secret   | `VPS_KNOWN_HOSTS` | the output of `ssh-keyscan 136.148.215.87` |
| variable | `VPS_SITE`        | `https://retroquest.rmstdope.eu`           |

## The server

The `deploy` user, Docker and the firewall come from the Dominos setup (its `deploy/setup-vps.sh`
and `docs/deploy.md`).

1. **DNS**: `retroquest.rmstdope.eu` has an A record for `136.148.215.87`.
2. **The site's directory**, owned by the user the workflow copies as:

    ```sh
    install -d -o deploy -g deploy -m 755 /srv/retroquest
    ```

3. **The edge** holds ports 80 and 443. Its two files are in [`deploy/edge/`](../deploy/edge):

    ```sh
    install -d -o deploy -g deploy /opt/edge
    scp deploy/edge/compose.yaml deploy/edge/Caddyfile deploy@136.148.215.87:/opt/edge/
    ```

    Dominos must first give up the ports and serve plain HTTP behind the edge. In
    `/opt/dominos/.env`: `SITE=:80`, `HTTP_PORT=127.0.0.1:8080`, `HTTPS_PORT=127.0.0.1:8443`
    (see the Dominos repository, `docs/deploy.md`, section 6). Then:

    ```sh
    cd /opt/dominos && docker compose up -d --wait
    cd /opt/edge && docker compose up -d
    ```

    The edge gets both certificates on its first start. It joins Dominos's Docker network
    (`dominos_default`), so start Dominos first; if that network is ever recreated
    (`docker compose down` in `/opt/dominos`), restart the edge too.

## Running it

| To                      | On the server                                                        |
| ----------------------- | -------------------------------------------------------------------- |
| See the edge's logs     | `cd /opt/edge && docker compose logs -f`                             |
| Change a site's address | edit `deploy/edge/Caddyfile`, copy it up, `docker compose restart`   |
| Roll back the game      | revert the commit on `main`: CI tests the revert and this deploys it |

The game keeps its saves in each player's browser, so nothing on the server needs a backup.
