/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['localhost:3000', '100.83.84.62'],
  serverExternalPackages: ['anki-apkg-export'],
};

export default nextConfig;
