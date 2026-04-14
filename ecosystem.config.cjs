module.exports = {
  apps: [
    {
      name: "sport-app",
      script: "npm",
      args: "run start",
      cwd: "/var/www/sport-app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
