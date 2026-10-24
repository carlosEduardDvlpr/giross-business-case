import express from "express";
import cepRoutes from "./routes/cep.routes.js";
import { unavailableRoutesMiddleware } from "./middlewares/unavailable-routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(unavailableRoutesMiddleware);

app.use(cepRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
