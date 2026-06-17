// backend/src/modules/services/routes.ts

import { FastifyInstance } from 'fastify';
import { CategoryController } from './controllers/category.controller';
import { VendorController } from './controllers/vendor.controller';
import { SearchController } from './controllers/search.controller';

const categoryController = new CategoryController();
const vendorController = new VendorController();
const searchController = new SearchController();

export default async function servicesRoutes(fastify: FastifyInstance) {
  // ============ CATEGORY ROUTES ============
  
  // Public routes
  fastify.get('/categories', categoryController.getAllCategories.bind(categoryController));
  fastify.get('/categories/popular', categoryController.getPopularCategories.bind(categoryController));
  fastify.get('/categories/with-counts', categoryController.getCategoriesWithVendorCounts.bind(categoryController));
  fastify.get('/categories/:id', categoryController.getCategoryById.bind(categoryController));
  fastify.get('/categories/:id/subcategories', categoryController.getCategoryWithSubcategories.bind(categoryController));
  
  // Admin routes
  fastify.post('/categories', { preValidation: [fastify.authenticate] }, categoryController.createCategory.bind(categoryController));
  fastify.put('/categories/:id', { preValidation: [fastify.authenticate] }, categoryController.updateCategory.bind(categoryController));
  fastify.delete('/categories/:id', { preValidation: [fastify.authenticate] }, categoryController.deleteCategory.bind(categoryController));

  // ============ VENDOR ROUTES ============
  
  // Public routes
  fastify.get('/vendors', vendorController.searchVendors.bind(vendorController));
  fastify.get('/vendors/featured', vendorController.getFeaturedVendors.bind(vendorController));
  fastify.get('/vendors/top-rated', vendorController.getTopRatedVendors.bind(vendorController));
  fastify.get('/vendors/category/:categoryId', vendorController.getVendorsByCategory.bind(vendorController));
  fastify.get('/vendors/city/:city', vendorController.getVendorsByCity.bind(vendorController));
  fastify.get('/vendors/:id', vendorController.getVendorById.bind(vendorController));
  fastify.get('/vendors/:vendorId/portfolio', vendorController.getVendorPortfolio.bind(vendorController));
  fastify.get('/vendors/:vendorId/reviews', vendorController.getVendorReviews.bind(vendorController));
  
  // Protected routes (require auth)
  fastify.post('/vendors/:vendorId/lead', { preValidation: [fastify.authenticate] }, vendorController.createLead.bind(vendorController));
  fastify.post('/vendors/:vendorId/wishlist', { preValidation: [fastify.authenticate] }, vendorController.addToWishlist.bind(vendorController));
  fastify.delete('/vendors/:vendorId/wishlist', { preValidation: [fastify.authenticate] }, vendorController.removeFromWishlist.bind(vendorController));
  fastify.get('/wishlist', { preValidation: [fastify.authenticate] }, vendorController.getWishlist.bind(vendorController));

  // ============ SEARCH ROUTES ============
  
  fastify.get('/search', searchController.globalSearch.bind(searchController));
  fastify.get('/search/autocomplete', searchController.autocomplete.bind(searchController));
  fastify.get('/search/filters', searchController.getFilterOptions.bind(searchController));
  fastify.get('/search/location', searchController.searchByLocation.bind(searchController));
  fastify.get('/search/popular', searchController.getPopularSearches.bind(searchController));
}