module.exports = {
  apps: [
    {
      name: 'sur-explorer',
      script: 'npm',
      args: 'run preview -- --port 38001 --host',
      cwd: '/home/el/app/sur-explorer',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
