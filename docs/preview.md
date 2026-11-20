# Dev and staging addresses

Every site has private addresses that show its drafts,
`<slug>.dev.timbrr.app` and `<slug>.staging.timbrr.app`. What they show and
who gets in is the studio's call (its `docs/sites.md`, "Dev and staging
addresses"); this is what the layer does.

- **`server/middleware/preview.js`** runs first on every request. On one of
  these addresses it sets the site from the hostname on that request's copy of
  the runtime config, marks the answer `noindex` and `no-store`, and asks the
  studio whether the visitor's token still opens the site. Anyone else is sent
  to the studio's gate. If the studio can't be asked, nothing is served. On any
  other host it does nothing.
- **`server/routes/__timbrr/enter.get.js`** is where the gate sends someone it
  let through: it swaps the one-time code for a token, server to server, and
  keeps it in an HttpOnly cookie on that host.
- **`server/utils/studio.js`** reads drafts instead of published pages on these
  addresses, with the token, and never keeps a copy.
- **`server/plugins/preview-banner.js`** adds the note saying it's a draft
  ("Preview, not live").
- **Live.** On these addresses a page the studio serves follows its draft:
  `useTimbrrPage` asks `/__timbrr/stamp?path=` every two seconds while the tab
  is showing, less often while nothing changes (4, 8, then every 15 seconds;
  back to two on a change or when the tab is shown again) (`server/routes/__timbrr/stamp.get.js`, which asks the studio
  with the visitor's token) and reads the page again only when the stamp
  changed, then writes the time into the note. The first answer is followed
  by one more read, since a save can land while the page loads or its tab is
  hidden. A read that fails keeps the page on screen and isn't counted as
  seen, so the next tick tries again (a 401 reloads, onto the studio's
  gate). It stops at a 401 or after 15 failures in a row. Off these addresses the route is a 404 and nothing asks.

The layer holds no secret and decides nothing: the studio checks the token on
every read.

**The shared Worker.** `make deploy-preview` ships the starter as
`timbrr-preview`, on the routes `*.dev.timbrr.app/*` and
`*.staging.timbrr.app/*`, with no `NUXT_PUBLIC_SITE`, so one Worker answers for
every site without code of its own.

**A site with its own code** adds its two hostnames to its own routes, which
win over those wildcards:

```jsonc
"routes": [
 { "pattern": "fernhill.com", "custom_domain": true },
 { "pattern": "fern-hill.dev.timbrr.app/*", "zone_name": "timbrr.app" },
 { "pattern": "fern-hill.staging.timbrr.app/*", "zone_name": "timbrr.app" }
]
```

With `NUXT_PUBLIC_SITE` set, a Worker answers only for that slug. A site's own
pages are behind the gate too. What's in `public/` and the built files aren't:
they're code, not content, so don't put anything private there.

`NUXT_TIMBRR_PREVIEW_DOMAIN` changes the domain, `localhost` in development.
