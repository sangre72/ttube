/** @type {import('next').NextConfig} */
const nextConfig = {
  // 전자정부 프레임워크 호환성을 위한 설정
  webpack: (config, { isServer }) => {
    // jQuery 지원
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        jquery: 'jQuery',
      });
    }
    return config;
  },
  // 정적 파일 서빙 설정
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig 