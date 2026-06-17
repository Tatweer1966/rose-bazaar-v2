// backend/src/modules/services/controllers/vendor.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { VendorService } from '../services/vendor.service';
import { SearchFilters } from '../types';

const vendorService = new VendorService();

export class VendorController {
  /**
   * Search vendors with filters
   */
  async searchVendors(
    request: FastifyRequest<{
      Querystring: {
        category?: string;
        subcategory?: string;
        city?: string;
        minPrice?: string;
        maxPrice?: string;
        planType?: string;
        minRating?: string;
        sortBy?: string;
        page?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const filters: SearchFilters = {
        category: request.query.category,
        subcategory: request.query.subcategory,
        city: request.query.city,
        minPrice: request.query.minPrice ? parseFloat(request.query.minPrice) : undefined,
        maxPrice: request.query.maxPrice ? parseFloat(request.query.maxPrice) : undefined,
        planType: request.query.planType,
        minRating: request.query.minRating ? parseFloat(request.query.minRating) : undefined,
        sortBy: request.query.sortBy as any,
        page: request.query.page ? parseInt(request.query.page) : 1,
        limit: request.query.limit ? parseInt(request.query.limit) : 12,
      };

      const locale = request.query.locale || 'en';
      const result = await vendorService.search(filters, locale);

      return reply.code(200).send({
        success: true,
        data: result.vendors,
        pagination: result.pagination,
        filters: filters,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to search vendors',
      });
    }
  }

  /**
   * Get vendor by ID
   */
  async getVendorById(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { locale?: 'en' | 'ar' };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { locale = 'en' } = request.query;

      const vendor = await vendorService.findById(id, locale);

      if (!vendor) {
        return reply.code(404).send({
          success: false,
          error: 'Vendor not found',
        });
      }

      // Increment profile views asynchronously
      vendorService.incrementProfileViews(id).catch(err => {
        request.log.error('Failed to increment profile views:', err);
      });

      return reply.code(200).send({
        success: true,
        data: vendor,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch vendor',
      });
    }
  }

  /**
   * Get vendors by category
   */
  async getVendorsByCategory(
    request: FastifyRequest<{
      Params: { categoryId: string };
      Querystring: {
        page?: string;
        limit?: string;
        sortBy?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { categoryId } = request.params;
      const {
        page = '1',
        limit = '12',
        sortBy = 'best_match',
        locale = 'en',
      } = request.query;

      const result = await vendorService.findByCategory(
        categoryId,
        parseInt(page),
        parseInt(limit),
        sortBy as any,
        locale
      );

      return reply.code(200).send({
        success: true,
        data: result.vendors,
        pagination: result.pagination,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch vendors by category',
      });
    }
  }

  /**
   * Get vendors by city
   */
  async getVendorsByCity(
    request: FastifyRequest<{
      Params: { city: string };
      Querystring: {
        category?: string;
        page?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { city } = request.params;
      const {
        category,
        page = '1',
        limit = '12',
        locale = 'en',
      } = request.query;

      const result = await vendorService.findByCity(
        city,
        category,
        parseInt(page),
        parseInt(limit),
        locale
      );

      return reply.code(200).send({
        success: true,
        data: result.vendors,
        pagination: result.pagination,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch vendors by city',
      });
    }
  }

  /**
   * Get featured vendors
   */
  async getFeaturedVendors(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { limit = '6', locale = 'en' } = request.query;
      const vendors = await vendorService.findFeatured(parseInt(limit), locale);

      return reply.code(200).send({
        success: true,
        data: vendors,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch featured vendors',
      });
    }
  }

  /**
   * Get top-rated vendors
   */
  async getTopRatedVendors(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        category?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { limit = '10', category, locale = 'en' } = request.query;
      const vendors = await vendorService.findTopRated(
        parseInt(limit),
        category,
        locale
      );

      return reply.code(200).send({
        success: true,
        data: vendors,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch top-rated vendors',
      });
    }
  }

  /**
   * Get vendor portfolio
   */
  async getVendorPortfolio(
    request: FastifyRequest<{
      Params: { vendorId: string };
      Querystring: { locale?: 'en' | 'ar' };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { vendorId } = request.params;
      const { locale = 'en' } = request.query;

      const portfolio = await vendorService.getPortfolio(vendorId, locale);

      return reply.code(200).send({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch vendor portfolio',
      });
    }
  }

  /**
   * Get vendor reviews
   */
  async getVendorReviews(
    request: FastifyRequest<{
      Params: { vendorId: string };
      Querystring: {
        page?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { vendorId } = request.params;
      const {
        page = '1',
        limit = '10',
        locale = 'en',
      } = request.query;

      const result = await vendorService.getReviews(
        vendorId,
        parseInt(page),
        parseInt(limit),
        locale
      );

      return reply.code(200).send({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch vendor reviews',
      });
    }
  }

  /**
   * Create vendor lead/inquiry
   */
  async createLead(
    request: FastifyRequest<{
      Params: { vendorId: string };
      Body: {
        eventDate?: string;
        guestCount?: number;
        budgetMin?: number;
        budgetMax?: number;
        message?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      // Check if user is authenticated
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized: Please login to contact vendors',
        });
      }

      const { vendorId } = request.params;
      const userId = request.user.id;

      const lead = await vendorService.createLead(vendorId, userId, request.body);

      return reply.code(201).send({
        success: true,
        data: lead,
        message: 'Inquiry sent successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to send inquiry',
      });
    }
  }

  /**
   * Add vendor to wishlist
   */
  async addToWishlist(
    request: FastifyRequest<{
      Params: { vendorId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized: Please login to add to wishlist',
        });
      }

      const { vendorId } = request.params;
      const userId = request.user.id;

      const wishlist = await vendorService.addToWishlist(userId, vendorId);

      return reply.code(200).send({
        success: true,
        data: wishlist,
        message: 'Added to wishlist',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to add to wishlist',
      });
    }
  }

  /**
   * Remove vendor from wishlist
   */
  async removeFromWishlist(
    request: FastifyRequest<{
      Params: { vendorId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { vendorId } = request.params;
      const userId = request.user.id;

      await vendorService.removeFromWishlist(userId, vendorId);

      return reply.code(200).send({
        success: true,
        message: 'Removed from wishlist',
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to remove from wishlist',
      });
    }
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(
    request: FastifyRequest<{
      Querystring: {
        page?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const {
        page = '1',
        limit = '12',
        locale = 'en',
      } = request.query;

      const result = await vendorService.getWishlist(
        request.user.id,
        parseInt(page),
        parseInt(limit),
        locale
      );

      return reply.code(200).send({
        success: true,
        data: result.vendors,
        pagination: result.pagination,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch wishlist',
      });
    }
  }
}