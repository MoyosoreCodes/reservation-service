import { Router } from "express";

import reservationRoutes from "./reservation.routes";
import restaurantRoutes from "./restaurant.routes";
import tableRoutes from "./table.routes";

const router = Router();

router.use("/restaurants", restaurantRoutes);
router.use("/reservations", reservationRoutes);
router.use("/tables", tableRoutes);

export default router;
