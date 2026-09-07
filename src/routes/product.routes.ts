/**
 * Product Routes - Thin routing layer.
 * All business logic lives in the ProductService; handlers delegate to controllers.
 */

import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { sensitiveRateLimiter } from '../middleware/rateLimiter';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductMovements,
  getProductSalesHistory,
  getProductPriceHistory,
} from '../controllers/product.controller';

const router = Router();

// 🔒 All product routes require authentication
router.use(protect);

// GET /products - List all products
router.get('/', getAllProducts);

// GET /products/:id - Get single product
router.get('/:id', getProductById);

// ✅ AUDIT: Support both endpoint conventions for frontend compatibility
router.get('/:id/movements', getProductMovements);
router.get('/:id/stock-movements', getProductMovements);

// ✅ NEW: GET /products/:id/price-history (Prevents 404 error in console)
router.get('/:id/price-history', getProductPriceHistory);

// ✅ SALES HISTORY: Invoices list for this product
router.get('/:id/sales-history', getProductSalesHistory);

// POST /products - Create new product
router.post('/', sensitiveRateLimiter, createProduct);

// PUT /products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /products/:id - Delete product (Admin only)
router.delete('/:id', authorize('ADMIN'), deleteProduct);

// POST /products/:id/stock - Update stock (Admin/Manager)
router.post('/:id/stock', authorize('ADMIN', 'MANAGER'), updateProductStock);

export default router;