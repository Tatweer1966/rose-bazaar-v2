// backend/src/modules/services/schemas/category.schema.js

const CreateCategoryDto = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', minLength: 2, maxLength: 100 },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    nameAr: { type: 'string', maxLength: 200 },
    slug: { type: 'string', maxLength: 100 },
    icon: { type: 'string', maxLength: 50 },
    color: { type: 'string', maxLength: 20 },
    displayOrder: { type: 'integer', minimum: 0 },
  },
};

const UpdateCategoryDto = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    nameAr: { type: 'string', maxLength: 200 },
    icon: { type: 'string', maxLength: 50 },
    color: { type: 'string', maxLength: 20 },
    displayOrder: { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
  },
};

module.exports = { CreateCategoryDto, UpdateCategoryDto };
