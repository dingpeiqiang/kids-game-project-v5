module.exports = {
  mount: {
    public: '/',
    src: '/dist',
  },
  exclude: [
    '**/_*.{sass,scss}',
    '**.d.ts',
    '**/node_modules/rot-js/**',
  ],
  devOptions: {
    port: 8000,
    open: 'none',
  },
  buildOptions: {
    out: '_build',
  },
  optimize: {
    bundle: true,
    minify: true,
    sourcemap: false,
  },
}
