// Login helper for the case editor (Decap CMS) at rdtaxcases.com/admin.
//
// The editor signs people in with GitHub. GitHub needs a small server-side
// step that holds a secret, so this tiny Cloudflare Worker does it and the
// website itself stays static. It stores nothing.
//
//   GET /auth      sends the person to GitHub to sign in
//   GET /callback  GitHub sends them back here; the Worker swaps the one-time
//                  code for a token and hands it to the editor window
//
// Settings (see wrangler.toml and README.md):
//   GITHUB_OAUTH_ID      the GitHub OAuth app's client id          (variable)
//   GITHUB_OAUTH_SECRET  the GitHub OAuth app's client secret      (SECRET)
//   ADMIN_ORIGIN         the editor's site, https://rdtaxcases.com (variable)
//   ALLOWED_USERS        optional, comma-separated GitHub user names that may
//                        sign in; empty means any GitHub user who can already
//                        write to the repository
//   GITHUB_SCOPE         optional, default "repo" (use "public_repo" for a
//                        public repository)

const COOKIE = "oauth_state";

function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });
}

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

function messagePage(origin, status, payload) {
  // Decap's popup handshake: tell the editor window we are here, wait for it
  // to answer, then hand over the result. The reply is only accepted from the
  // editor's own site.
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return html(`<!doctype html><meta charset="utf-8"><title>Signing in</title>
<p>Signing in. You can close this window if it does not close by itself.</p>
<script>
(function () {
  var allowed = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== allowed) return;
    window.removeEventListener("message", receive, false);
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
  }
  window.addEventListener("message", receive, false);
  window.opener.postMessage("authorizing:github", allowed);
})();
</script>`);
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const admin = (env.ADMIN_ORIGIN || "").replace(/\/$/, "");
    if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET || !admin) {
      return html("The login helper is not set up yet.", 500);
    }

    if (url.pathname === "/auth") {
      const state = randomState();
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.searchParams.set("client_id", env.GITHUB_OAUTH_ID);
      authorize.searchParams.set("redirect_uri", `${url.origin}/callback`);
      authorize.searchParams.set("scope", env.GITHUB_SCOPE || "repo");
      authorize.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          location: authorize.toString(),
          "set-cookie": `${COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const expected = readCookie(request, COOKIE);
      if (!code || !state || !expected || state !== expected) {
        return messagePage(admin, "error", { message: "The sign-in could not be verified. Please try again." });
      }

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "user-agent": "rdtaxcases-cms-login" },
        body: JSON.stringify({
          client_id: env.GITHUB_OAUTH_ID,
          client_secret: env.GITHUB_OAUTH_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const tokenJson = await tokenRes.json().catch(() => ({}));
      if (!tokenJson.access_token) {
        return messagePage(admin, "error", { message: "GitHub did not accept the sign-in. Please try again." });
      }

      const allowed = (env.ALLOWED_USERS || "")
        .split(",")
        .map((u) => u.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length) {
        const me = await fetch("https://api.github.com/user", {
          headers: {
            authorization: `Bearer ${tokenJson.access_token}`,
            accept: "application/vnd.github+json",
            "user-agent": "rdtaxcases-cms-login",
          },
        });
        const meJson = await me.json().catch(() => ({}));
        if (!meJson.login || !allowed.includes(String(meJson.login).toLowerCase())) {
          return messagePage(admin, "error", { message: "This GitHub account is not allowed to use the editor." });
        }
      }

      return messagePage(admin, "success", { token: tokenJson.access_token, provider: "github" });
    }

    return html("Not found", 404);
  },
};

export default worker;
