module.exports = {
  apps: [
    {
      name: 'ai-school-web',
      cwd: __dirname,
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
      max_restarts: 5,
      restart_delay: 2000,
    },
  ],
};
