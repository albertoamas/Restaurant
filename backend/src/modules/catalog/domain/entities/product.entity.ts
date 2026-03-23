import { v4 as uuidv4 } from 'uuid';

export interface ProductProps {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export class Product {
  readonly id: string;
  readonly tenantId: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  readonly createdAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.categoryId = props.categoryId;
    this.name = props.name;
    this.price = props.price;
    this.imageUrl = props.imageUrl;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    tenantId: string;
    categoryId: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  }): Product {
    return new Product({
      id: uuidv4(),
      tenantId: props.tenantId,
      categoryId: props.categoryId,
      name: props.name,
      price: props.price,
      imageUrl: props.imageUrl ?? null,
      isActive: true,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }
}
