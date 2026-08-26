/**
 * 商品路由
 * 
 * 挂载路径：/api/v1/products
 */

const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

// 商品列表
router.get('/', productController.getProducts);

// 推荐商品
router.get('/recommended', productController.getRecommendedProducts);

// 商品详情
router.get('/:id', productController.getProductById);

module.exports = router;
