export default async function handler(_req: Request) {
  return new Response(
    JSON.stringify({ error: "venue_retired", message: "Madison Theater event sync has been retired." }),
    { status: 410, headers: { "content-type": "application/json" } },
  );
}
