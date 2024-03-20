import { ObjectType } from "@nestjs/graphql";

import { GqlMovement } from "./GqlMovement.js";
import { Paginated, PageInfo } from "./Paginated.js";

@ObjectType()
export class PaginatedMovements extends Paginated(GqlMovement) {
  public constructor(
    totalCount: number,
    pageInfo: PageInfo,
    nodes: GqlMovement[],
  ) {
    super(totalCount, pageInfo, nodes, (movement: GqlMovement) =>
      movement.version.toString(10),
    );
  }
}
