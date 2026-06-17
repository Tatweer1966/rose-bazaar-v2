// backend/src/modules/services/types/index.ts

export type Locale = 'en' | 'ar';

export interface ServiceCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  subcategories?: ServiceSubcategory[];
}

export interface ServiceSubcategory {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  category?: ServiceCategory;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  businessNameAr?: string;
  categoryId: string;
  subcategoryId?: string;
  description?: string;
  descriptionAr?: string;
  city?: string;
  cityAr?: string;
  priceMin?: number;
  priceMax?: number;
  planType: 'TOP' | 'PRO' | 'BASIC' | 'LITE';
  rating: number;
  reviewsCount: number;
  profileViews: number;
  isVerified: boolean;
  isFeatured: boolean;
  portfolio?: PortfolioItem[];
  reviews?: Review[];
}

export interface PortfolioItem {
  id: string;
  vendorId: string;
  imageUrl: string;
  caption?: string;
  captionAr?: string;
  displayOrder: number;
}

export interface Review {
  id: string;
  vendorId: string;
  userId: string;
  rating: number;
  comment?: string;
  commentAr?: string;
  isVerified: boolean;
  createdAt: Date;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  planType?: string;
  minRating?: number;
  sortBy?: 'best_match' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  vendors: VendorProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}