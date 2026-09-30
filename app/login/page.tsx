import { BrandLockup } from "@/components/BrandLockup";

export default function Login() {
  return (
    <main className="max-w-full px-3 py-8">
      <BrandLockup tone="theme" height={40} />
      <h1 className="mt-4 text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-gray-600">
        Configure OIDC with Keycloak/your IdP; this page will redirect to your provider.
      </p>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        OIDC_ISSUER_URL=https://idp.example.com/realms/muxon OIDC_CLIENT_ID=muxon-web
      </pre>
    </main>
  );
}
