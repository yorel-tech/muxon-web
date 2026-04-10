const apiBase =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8080';

export default {
  reactStrictMode: true,
  experimental: {
    // Proxied PUT uploads use up to 64 MiB per chunk (see lib/chunked-upload.ts).
    // Next defaults to 10MB and truncates the body, which breaks the backend stream.
    middlewareClientMaxBodySize: '128mb',
  },
  async rewrites() {
    // Use fallback so explicit app/api Route Handlers win; anything else under
    // /api/v1/* proxies to the backend. Array rewrites are afterFiles and can
    // run before App Router finishes matching, which produced 404 for paths
    // like /api/v1/tenants/current with no local route.ts.
    return {
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${apiBase}/api/v1/:path*`,
        },
        {
          source: '/swagger-ui',
          destination: `${apiBase}/swagger-ui.html`,
        },
        {
          source: '/swagger-ui/:path*',
          destination: `${apiBase}/swagger-ui/:path*`,
        },
        {
          source: '/v3/api-docs',
          destination: `${apiBase}/v3/api-docs`,
        },
        {
          source: '/v3/api-docs/:path*',
          destination: `${apiBase}/v3/api-docs/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:8080',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};
