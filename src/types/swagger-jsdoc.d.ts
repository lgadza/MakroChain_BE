declare module "swagger-jsdoc" {
  interface SwaggerDefinition {
    openapi?: string;
    swagger?: string;
    info: {
      title: string;
      version: string;
      description?: string;
      [key: string]: any;
    };
    host?: string;
    basePath?: string;
    schemes?: string[];
    consumes?: string[];
    produces?: string[];
    paths?: any;
    definitions?: any;
    components?: any;
    servers?: { url: string; description?: string }[];
    security?: any[];
    tags?: { name: string; description?: string }[];
    externalDocs?: { description: string; url: string };
    [key: string]: any;
  }

  interface SwaggerOptions {
    swaggerDefinition?: SwaggerDefinition;
    definition?: SwaggerDefinition;
    apis: string[];
    [key: string]: any;
  }

  function swaggerJsdoc(options: SwaggerOptions): any;

  export default swaggerJsdoc;
}
