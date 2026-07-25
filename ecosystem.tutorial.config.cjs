module.exports = {
  apps: [{
    name: process.env.PM2_APP || 'tutorial',
    cwd: process.env.PM2_CWD || __dirname,
    script: 'node_modules/next/dist/bin/next',
    args: `start -p ${process.env.PORT || '3014'} -H 127.0.0.1`,
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || '3014',
      PATH: '/home/actions-runner/.nvm/versions/node/v24.16.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin',
    },
    error_file: `${process.env.APP_ROOT || '/var/www/tutorial'}/logs/error.log`,
    out_file: `${process.env.APP_ROOT || '/var/www/tutorial'}/logs/out.log`,
    merge_logs: true,
    max_memory_restart: '768M',
  }],
};
