import express from "express";
import cepRoutes from "./routes/cep.routes.js";
import { unavailableRoutes } from "./middlewares/unavailable-routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cepRoutes);
app.use(unavailableRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
