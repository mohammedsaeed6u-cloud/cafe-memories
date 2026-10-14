export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/go\/?/, '').trim();
  const baseUrl = url.origin || 'https://memories-c9w.pages.dev';

  const tableMatch = slug ? slug.match(/^table-(\d+)$/i) : null;
  const tableParam = tableMatch ? `&table=${tableMatch[1]}` : '';

  return Response.redirect(`${baseUrl}/c/stampy?ref=${slug || 'standee'}${tableParam}`, 302);
}
