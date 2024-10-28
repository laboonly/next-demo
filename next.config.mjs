/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/404',
        destination: '/404', // Redirect to the custom 404 page
        permanent: false,
      },
    ];
  },
};

export default nextConfig;