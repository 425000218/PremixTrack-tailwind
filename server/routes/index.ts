import { Router } from 'express';
import healthRoutes from './healthRoutes';
import masterDataRoutes from './masterDataRoutes';
import forecastRoutes from './forecastRoutes';
import inventoryRoutes from './inventoryRoutes';
import orderRoutes from './orderRoutes';
import positionRoutes from './positionRoutes';
import authRoutes from './authRoutes';
import aiRoutes from './aiRoutes';
import bootstrapRoutes from './bootstrapRoutes';

const router = Router();

router.use(healthRoutes);
router.use(bootstrapRoutes);
router.use(masterDataRoutes);
router.use(forecastRoutes);
router.use(inventoryRoutes);
router.use(orderRoutes);
router.use(positionRoutes);
router.use(authRoutes);
router.use(aiRoutes);

export default router;
