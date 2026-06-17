// backend/src/modules/services/controllers/category.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../schemas/category.schema';
import { Locale } from '../types';

const categoryService = new CategoryService();

export class CategoryController {
  /**
   * Get all service categories
   */
  async getAllCategories(
    request: FastifyRequest<{
      Querystring: { locale?: Locale; includeSubcategories?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { locale = 'en', includeSubcategories = 'false' } = request.query;
      const includeSub = includeSubcategories === 'true';

      const categories = await categoryService.findAll({
        locale,
        includeSubcategories: includeSub,
      });

      return reply.code(200).send({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch categories',
      });
    }
  }

  /**
   * Get category by ID or slug
   */
  async getCategoryById(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { locale?: Locale };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { locale = 'en' } = request.query;

      const category = await categoryService.findById(id, locale);

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: category,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch category',
      });
    }
  }

  /**
   * Get category with all subcategories
   */
  async getCategoryWithSubcategories(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { locale?: Locale };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { locale = 'en' } = request.query;

      const category = await categoryService.findWithSubcategories(id, locale);

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: category,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch category details',
      });
    }
  }

  /**
   * Create new category (Admin only)
   */
  async createCategory(
    request: FastifyRequest<{
      Body: CreateCategoryDto;
    }>,
    reply: FastifyReply
  ) {
    try {
      // Check admin role
      if (request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden: Admin access required',
        });
      }

      const category = await categoryService.create(request.body);

      return reply.code(201).send({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create category',
      });
    }
  }

  /**
   * Update category (Admin only)
   */
  async updateCategory(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateCategoryDto;
    }>,
    reply: FastifyReply
  ) {
    try {
      if (request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden: Admin access required',
        });
      }

      const { id } = request.params;
      const category = await categoryService.update(id, request.body);

      if (!category) {
        return reply.code(404).send({
          success: false,
          error: 'Category not found',
        });
      }

      return reply.code(200).send({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to update category',
      });
    }
  }

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(
    request: FastifyRequest<{
      Params: { id: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (request.user?.role !== 'ADMIN') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden: Admin access required',
        });
      }

      const { id } = request.params;
      await categoryService.delete(id);

      return reply.code(200).send({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to delete category',
      });
    }
  }

  /**
   * Get popular categories (featured on homepage)
   */
  async getPopularCategories(
    request: FastifyRequest<{
      Querystring: { locale?: Locale; limit?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { locale = 'en', limit = '8' } = request.query;
      const limitNum = parseInt(limit);

      const categories = await categoryService.findPopular(limitNum, locale);

      return reply.code(200).send({
        success: true,
        data: categories,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch popular categories',
      });
    }
  }

  /**
   * Get categories with vendor counts
   */
  async getCategoriesWithVendorCounts(
    request: FastifyRequest<{
      Querystring: { locale?: Locale };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { locale = 'en' } = request.query;
      const categories = await categoryService.findWithVendorCounts(locale);

      return reply.code(200).send({
        success: true,
        data: categories,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch categories with vendor counts',
      });
    }
  }
}