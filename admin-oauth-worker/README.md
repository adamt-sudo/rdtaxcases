# Login helper for the case editor

This is a very small Cloudflare Worker. It lets people sign in to the case
editor at `rdtaxcases.com/admin` with their GitHub account. The website itself
stays static; the Worker only does the one step that needs a secret. It
stores nothing.

It must sit in a Cloudflare account that belongs to the client's company, and
the GitHub OAuth app it uses is owned by the repository owner's GitHub account
(`adamt-sudo`; there is no organisation).

## What has to exist first

1. The repository `adamt-sudo/rdtaxcases` (public).
2. A Cloudflare account owned by the company.

## Set-up (about 30 minutes)

1. **Create the GitHub OAuth app.** The repository owner does this, signed in
   as `adamt-sudo`: Settings, Developer settings, OAuth Apps, New OAuth App.
   - Application name: `RDTAXCASES case editor`
   - Homepage URL: `https://rdtaxcases.com`
   - Authorization callback URL: `https://<worker address>/callback`
     (the address is shown after step 3; come back and fill it in)
   - Create it, then generate a client secret. Keep the client id and the
     secret.
2. **Put the client id in `wrangler.toml`** (`GITHUB_OAUTH_ID`). Optionally
   list the allowed GitHub user names in `ALLOWED_USERS`.
3. **Deploy**, from this folder:
   ```
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
   Paste the client secret when asked. The secret is held by Cloudflare. It
   is never written in the repository or in any file.
4. **Tell the site where the helper is.** Set `ADMIN_AUTH_URL` to the Worker's
   address and `ADMIN_REPO` to `owner/repository`, then rebuild
   (`npm run build`). The editor's settings file is generated from these.

## Who can use it

Signing in only proves who the person is. What they can do is decided by
GitHub: someone without access to the repository can sign in and then sees
nothing and can save nothing. Publishing needs the right to merge into the
main branch, which only the approvers should have.

## If something goes wrong

- "The login helper is not set up yet": the id, the secret or
  `ADMIN_ORIGIN` is missing.
- "This GitHub account is not allowed": the person's GitHub user name is not
  in `ALLOWED_USERS`.
- The sign-in window closes and nothing happens: the callback address in the
  GitHub OAuth app does not match the Worker's address.
