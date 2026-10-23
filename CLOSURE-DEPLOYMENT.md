# Automatic Shabbos and Yom closure

Sorah authorized Chicago, Illinois with Hebcal defaults, subject to later changes.

## Timing

- GeoNames 4887398, verified by Hebcal as Chicago, Illinois, USA.
- America/Chicago, with date-specific UTC offsets and daylight saving.
- Diaspora festival schedule.
- Candle lighting 18 minutes before sunset.
- Havdalah at nightfall, sun 8.5 degrees below the horizon (Hebcal M=on).
- Calendar source: https://www.hebcal.com/home/195/jewish-calendar-rest-api
- Location source: https://www.hebcal.com/home/4912/specifying-a-location-for-jewish-calendar-apis
- Candle events open a closure interval; subsequent candle events keep it closed until the final havdalah. This covers adjacent Yom Tov and Shabbos dates. Ordinary Chol Hamoed weekdays remain open.
- Start is inclusive, end is exclusive. An invalid, mismatched, or expired server calendar fails closed for shopping, while leaving catalog and admin access available.

## Live frontend versus backend

The static publishing connection uploads public/ only. It cannot install server.js, closure.js, closure-config.json, or closure-seed.json, or restart the server. Zach must deploy the backend through his established server deployment process. Do not edit GitHub workflows or use the jailed design upload to attempt this.

The frontend can display the timed notice, disable outbound-shopping and phone-order controls, and reopen them using the generated calendar. Until backend deployment, this is UI control only. It is not proof of server-side checkout enforcement.

The current server has no order/payment/Stripe/checkout integration. The cart is a local saved shopping list followed by a phone call. No online payment is taken. No live financial transaction is used by the tests.

## Backend activation checklist for Zach

1. Deploy server.js, closure.js, closure-config.json, closure-seed.json, and public/ together using the existing server deployment process. Requires a Node version supporting fetch and AbortSignal.timeout (Node 20 or later is suitable).
2. Keep the existing .env, data/, product files, permissions and service configuration intact. Never replace product data with test fixtures.
3. Allow outbound HTTPS to www.hebcal.com. The server refreshes on startup and every six hours, keeps an atomic on-disk cache, and uses the approved seed while valid if the network is down.
4. Restart the existing server service and verify GET /api/store-status returns enabled true, Chicago timezone, correct current open/closed state and nextChange, with no-store caching.
5. Publish the generated HTML in this change so outbound shop links use /shop-out?to=... . This route checks the server clock on every request, rejects non-HTTPS and non-allowlisted destinations, and rejects redirects during closure.
6. Verify closed/open behavior in staging with injected clocks, including direct and encoded order/payment URLs. Do not change the production clock or create test customer payments.

## Future payment integration requirements

The request guard denies recognized checkout/order/payment and shopping-redirect routes before their handlers run. Every future order or payment creation handler must also call closure.status() and deny closed/unavailable states immediately before creating a durable order or contacting a payment provider. This must be reviewed again when Stripe or any other payment provider is added; a path list is not a substitute for guarding the actual business operation.

Do not publish reusable third-party payment links or create long-lived checkout sessions. A previously issued provider URL, a direct merchant URL, an already-open merchant tab, or a manually dialed phone number cannot be revoked by this site. The merchant controls those purchases. Any future hosted checkout must have provider-specific expiration/revocation plus server-side creation and confirmation guards. Signed payment webhooks need provider-specific handling; do not silently drop legitimate settlement notifications based on a route-name filter.

## Change city or convention

Edit closure-config.json. Use the new verified GeoNames ID and IANA timezone, set diaspora appropriately, set candleMinutes explicitly, and use havdalahMinutes null for the documented 8.5-degree nightfall or an explicitly requested positive minute offset. Then run node scripts/refresh-closure.cjs and python3 build-pages.py, test, deploy the backend config and publish the generated calendar. Changing the city label alone is insufficient.

## Validation

Run node --test tests/closure.cjs tests/closure-ui.cjs. Tests cover exact boundaries, spring/autumn DST, all 13 diaspora Yom Tov dates in 2026, Chol Hamoed, a three-day Pesach/Shabbos sequence, Rosh Hashanah, invalid calendars, direct/encoded server request rejection, and frontend automatic close/reopen. Test fixtures are outside public/ and never touch live payments.
