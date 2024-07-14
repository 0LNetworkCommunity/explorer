import { ObjectType } from '@nestjs/graphql';

import { Movement } from './Movement.js';
import { Paginated, PageInfo } from './Paginated.js';

@ObjectType()
export class PaginatedMovements extends Paginated(Movement) {
  public constructor(totalCount: number, pageInfo: PageInfo, nodes: Movement[]) {
    super(totalCount, pageInfo, nodes, (movement: Movement) => movement.version.toString(10));
  }
}
