export interface Configuration {
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptRounds: number;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  cors: {
    origin: string;
  };
  upload: {
    maxFileSize: number;
    destination: string;
  };
}
