import { UserRole } from '@pos/shared';
import { v4 as uuidv4 } from 'uuid';

export class User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;

  static create(props: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: UserRole;
  }): User {
    const user = new User();
    user.id = uuidv4();
    user.tenantId = props.tenantId;
    user.email = props.email;
    user.passwordHash = props.passwordHash;
    user.name = props.name;
    user.role = props.role;
    user.isActive = true;
    user.createdAt = new Date();
    return user;
  }
}
