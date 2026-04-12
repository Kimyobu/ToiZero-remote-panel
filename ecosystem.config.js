module.exports = {
  apps: [
    {
      name: 'toizero-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
      watch: false, // watch is handled by tsx watch in npm dev
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'toizero-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
    }
  ]
};
