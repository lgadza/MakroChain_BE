declare module "express-list-endpoints" {
  import { Express } from "express";

  interface Endpoint {
    path: string;
    methods: string[];
    middlewares: string[];
  }

  function listEndpoints(app: Express): Endpoint[];

  export default listEndpoints;
}
