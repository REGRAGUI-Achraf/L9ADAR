// Settings come from environment variables. Defaults are for local development only.
const config = {
  port: Number(process.env.PORT ?? 3000),
  publicOrigin: process.env.PUBLIC_ORIGIN ?? 'https://localhost',
  mediaDir: process.env.MEDIA_DIR ?? '/app/media',
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB ?? 5),
};

module.exports = { config };
