/**
 * Application Entrypoint
 * Boots the HTTP & Socket.io server (defined in server.js)
 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

await import('./server.js');
