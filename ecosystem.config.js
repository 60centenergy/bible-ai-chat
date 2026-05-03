module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      windowsHide: true
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      windowsHide: true
    }
  ]
};
