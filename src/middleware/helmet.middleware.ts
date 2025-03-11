import express from "express";
import {
  contentSecurityPolicy,
  dnsPrefetchControl,
  frameguard,
  hidePoweredBy,
  hsts,
  ieNoOpen,
  noSniff,
  permittedCrossDomainPolicies,
  referrerPolicy,
  xssFilter,
} from "helmet";

/**
 * Configure and apply Helmet middleware for enhanced security
 * @param app Express application instance
 */
export const applyHelmetMiddleware = (app: express.Application): void => {
  // Apply individual Helmet middleware components
  app.use(contentSecurityPolicy());
  app.use(dnsPrefetchControl());
  // expectCt has been removed as it's deprecated in newer versions
  app.use(frameguard());
  app.use(hidePoweredBy());
  app.use(hsts());
  app.use(ieNoOpen());
  app.use(noSniff());
  app.use(permittedCrossDomainPolicies());
  app.use(referrerPolicy());
  app.use(xssFilter());
};
