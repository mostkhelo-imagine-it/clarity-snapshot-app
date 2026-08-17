// Deprecated. Checkout now happens client-side via Paddle.js on the landing
// page (index.html), so this endpoint is no longer used. Kept as a harmless
// redirect for any old links.

export default async function handler(req, res) {
  res.writeHead(302, { Location: "/" });
  res.end();
}
