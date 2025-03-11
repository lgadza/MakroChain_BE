import listEndpoints from "express-list-endpoints";
import { Express } from "express";
import { Logger } from "winston";

interface FormattedEndpoint {
  method: string;
  path: string;
  middleware: string;
}

export const logEndpoints = (app: Express, logger: Logger): void => {
  try {
    const endpoints = listEndpoints(app);
    const formattedEndpoints: FormattedEndpoint[] = [];

    endpoints.forEach((endpoint) => {
      endpoint.methods.forEach((method) => {
        formattedEndpoints.push({
          method,
          path: endpoint.path,
          middleware: endpoint.middlewares.join(", "),
        });
      });
    });

    // Calculate column widths
    const methodWidth = Math.max(
      ...formattedEndpoints.map((e) => e.method.length),
      6
    );
    const pathWidth = Math.max(
      ...formattedEndpoints.map((e) => e.path.length),
      4
    );

    // Create header row
    const headerRow = `| ${"METHOD".padEnd(methodWidth)} | ${"PATH".padEnd(
      pathWidth
    )} |`;
    const separatorRow = `| ${"-".repeat(methodWidth)} | ${"-".repeat(
      pathWidth
    )} |`;

    // Log table header
    logger.info("\nAPI ENDPOINTS:");
    logger.info(headerRow);
    logger.info(separatorRow);

    // Log each endpoint
    formattedEndpoints.forEach((endpoint) => {
      const row = `| ${endpoint.method.padEnd(
        methodWidth
      )} | ${endpoint.path.padEnd(pathWidth)} |`;
      logger.info(row);
    });

    logger.info(`\nTotal: ${formattedEndpoints.length} endpoints\n`);
  } catch (error) {
    logger.error("Failed to log endpoints:", error);
  }
};
