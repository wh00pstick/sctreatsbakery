# Draft posts — not linked, not indexed

Each file here is a finished post waiting for its publish date. `/drafts/*` is served
with `X-Robots-Tag: noindex` (see `_headers`) and every page carries a noindex meta tag.

| Publish on | File | Notes |
|---|---|---|
| 2026-10-01 | blog-halloween-cupcakes.html | Halloween 2026 is a Saturday; class parties Fri Oct 30 |
| 2026-11-10 | blog-christmas-cookie-trays.html | Replace "past menus" paragraph with this year's menu if Kelsey has it |
| 2027-01-10 | blog-valentines-treats.html | Valentine's 2027 is a Sunday; order-by Wed Feb 10 |
| 2027-02-20 | blog-easter-menu.html | Easter 2027 is March 28; order-by Wed Mar 24 |
| 2027-04-01 | blog-graduation-cakes.html | Links to the Williamstown town page |

To publish one:
1. `git mv drafts/<file> <file>`
2. Remove the `<meta name="robots" content="noindex, nofollow" />` line.
3. Root-relative links (`href="/shop.html"`) work from the root too — no change needed.
4. Add a card under "Occasions & Ideas" in blog.html, a `<url>` in sitemap.xml, and a line in llms.txt (copy the fall-flavors entries).
5. Confirm prices against shop.html before it goes live.
