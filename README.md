# re-coded.com

The Re:Coded website as plain static files: HTML, one stylesheet and one script, with no framework and no build step. It's made for GitHub Pages and works on any static host.

## What's here

| Path | Page |
|---|---|
| `index.html` | Home |
| `about/`, `impact/`, `blog/`, `contact/`, `donate/`, `partner/` | Main pages |
| `programs/source-code/` | Source Code Accelerator |
| `programs/resilient-futures-fellowship/` | Resilient Futures Fellowship |
| `policies/` | Privacy, Terms, Cookies, Safeguarding (tabs; links like `/policies/#terms` open the right one) |
| `blog/<post>/` | Blog posts. The alumni stories keep their old URLs, e.g. `/blog/abdullah/` |
| `404.html` | Not-found page |
| `about-us/`, `media-kit/`, `privacy-policy/` … | Redirects from old URLs to the new pages |
| `assets/css/site.css` | Fonts and shared styles |
| `assets/js/site.js` | Forms, donate flow, FAQs, blog filters, policy tabs, carousel, count-ups, cookie banner |
| `assets/img/`, `assets/docs/`, `assets/fonts/` | Images, downloadable PDFs, self-hosted fonts |
| `sitemap.xml`, `robots.txt`, `CNAME`, `.nojekyll` | Search engines, custom domain, GitHub Pages settings |

To change text, open the page's `index.html` and edit the words. Each page is self-contained.

## Go live on GitHub Pages

1. Create a repository (for example `re-coded/website`) and upload everything in this folder to the root of the `main` branch.
2. In the repository, go to **Settings → Pages → Build and deployment** and choose **Deploy from a branch**, then `main` and `/ (root)`.
3. Under **Custom domain**, enter `re-coded.com`. The `CNAME` file already contains it.
4. At your domain registrar, point the domain at GitHub:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www`: `<your-github-account>.github.io`
5. Once the certificate is issued (usually within an hour), tick **Enforce HTTPS**.

## After launch

- **Forms (Contact, Fellowship "notify me").** These send to ali@re-coded.com through FormSubmit, which needs no account. The first message triggers a one-time activation email to ali@re-coded.com, and messages arrive once the link in it is clicked. Send a test message from `/contact/` right after launch. If you'd rather not expose the address, FormSubmit gives you a random alias after activation. Swap it into `FORM_ENDPOINT` at the top of `assets/js/site.js`.
- **Stripe.** For each of the five payment links, set *After payment → Don't show confirmation page → Redirect to* `https://re-coded.com/donate/?thanks=1`. Donors then land on the thank-you message.
- **Google Search Console.** Add the domain and submit `https://re-coded.com/sitemap.xml`.
- **Cookie banner.** The site sets no analytics or marketing cookies, so the banner is switched off. If you add analytics later, set `COOKIE_BANNER = true` in `assets/js/site.js` and load the analytics script only after consent. Listen for the `rc:consent` event or call `window.rcConsent()`.

## Old URLs

The redirect pages cover the old links in `redirects.csv` (about-us, software-engineering, media-kit, us-financials, the policy pages, archived blog posts and so on). Anything under `/open-study-hub-category/` is sent to `/blog/` from the 404 page.
