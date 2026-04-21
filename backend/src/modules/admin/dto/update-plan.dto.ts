import { IsEnum } from 'class-validator';
import { SaasPlan } from '@pos/shared';

export class UpdatePlanDto {
  @IsEnum(SaasPlan)
  plan: SaasPlan;
}
