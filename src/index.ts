import express from "express";
import { env } from "./config/env.js";
import cepRoutes from "./routes/cep.routes.js";
import { unavailableRoutes } from "./middlewares/unavailable-routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();
app.use(cepRoutes);
app.use(unavailableRoutes);
app.use(errorHandler);

app.listen(env.port, (error) => {
  if (error) {
    throw error;
  }

  console.log(`Server running on http://localhost:${env.port}`);
});
