// backend/src/modules/services/controllers/search.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export class SearchController {
  /**
   * Global search across all vendors
   */
  async globalSearch(
    request: FastifyRequest<{
      Querystring: {
        q: string;
        category?: string;
        city?: string;
        page?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        q,
        category,
        city,
        page = '1',
        limit = '20',
        locale = 'en',
      } = request.query;

      if (!q || q.length < 2) {
        return reply.code(400).send({
          success: false,
          error: 'Search query must be at least 2 characters',
        });
      }

      const result = await searchService.globalSearch(
        q,
        {
          category,
          city,
          page: parseInt(page),
          limit: parseInt(limit),
        },
        locale
      );

      return reply.code(200).send({
        success: true,
        data: result.results,
        pagination: result.pagination,
        query: q,
        filters: { category, city },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to perform search',
      });
    }
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(
    request: FastifyRequest<{
      Querystring: {
        q: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { q, limit = '10', locale = 'en' } = request.query;

      if (!q || q.length < 1) {
        return reply.code(400).send({
          success: false,
          error: 'Query parameter required',
        });
      }

      const suggestions = await searchService.autocomplete(
        q,
        parseInt(limit),
        locale
      );

      return reply.code(200).send({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get suggestions',
      });
    }
  }

  /**
   * Filter options (for sidebar)
   */
  async getFilterOptions(
    request: FastifyRequest<{
      Querystring: {
        category?: string;
        city?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { category, city, locale = 'en' } = request.query;

      const options = await searchService.getFilterOptions({ category, city }, locale);

      return reply.code(200).send({
        success: true,
        data: options,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get filter options',
      });
    }
  }

  /**
   * Search by location (map view)
   */
  async searchByLocation(
    request: FastifyRequest<{
      Querystring: {
        lat: string;
        lng: string;
        radius?: string;
        category?: string;
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        lat,
        lng,
        radius = '10',
        category,
        limit = '50',
        locale = 'en',
      } = request.query;

      const vendors = await searchService.searchByLocation(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius),
        category,
        parseInt(limit),
        locale
      );

      return reply.code(200).send({
        success: true,
        data: vendors,
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseFloat(radius),
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to search by location',
      });
    }
  }

  /**
   * Get search analytics (popular searches)
   */
  async getPopularSearches(
    request: FastifyRequest<{
      Querystring: {
        limit?: string;
        locale?: 'en' | 'ar';
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { limit = '10', locale = 'en' } = request.query;
      const searches = await searchService.getPopularSearches(parseInt(limit), locale);

      return reply.code(200).send({
        success: true,
        data: searches,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get popular searches',
      });
    }
  }
}