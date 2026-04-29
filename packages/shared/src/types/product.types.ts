export interface CategoryDto {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  price?: number;
  imageUrl?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  sortOrder?: number;
}
