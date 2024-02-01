// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

module.exports = {
  webpack(config, options) {
    config.module.rules.push({
      test: /\.map$/,
      use: ['ignore-loader'],
    });

    return config;
  },
};
