import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength } from 'class-validator';

export class LoadSuggestedCatalogDto {
  /** Nombres de las categorías de `SUGGESTED_EXPENSE_CATALOG` que el dueño eligió. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  categories!: string[];
}
