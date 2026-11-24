declare module '*.bundle.mjs' {
  const handler: { fetch(request: Request): Promise<Response> };
  export default handler;
}
