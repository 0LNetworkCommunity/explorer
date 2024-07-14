import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(OrderDirection, { name: 'OrderDirection' });

export interface IEdgeType<T> {
  cursor: string;
  node: T;
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  totalCount: number;
  pageInfo: PageInfo;
}

@ObjectType('PageInfo')
export class PageInfo {
  @Field((type) => String, { nullable: true })
  public readonly prevCursor?: string;

  @Field((type) => Boolean)
  public readonly hasNextPage: boolean;

  public constructor(hasNextPage: boolean, prevCursor?: string) {
    this.prevCursor = prevCursor;
    this.hasNextPage = hasNextPage;
  }
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  class EdgeType {
    @Field((type) => String)
    public readonly cursor: string;

    @Field((type) => classRef)
    public readonly node: T;

    public constructor(cursor: string, node: T) {
      this.cursor = cursor;
      this.node = node;
    }
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field((type) => [EdgeType], { nullable: true })
    public readonly edges: EdgeType[];

    @Field((type) => Number)
    public readonly totalCount: number;

    @Field()
    public readonly pageInfo: PageInfo;

    public constructor(
      totalCount: number,
      pageInfo: PageInfo,
      nodes: T[],
      cursorExtractor: (node: T) => string,
    ) {
      this.totalCount = totalCount;
      this.pageInfo = pageInfo;
      this.edges = nodes.map((node) => new EdgeType(cursorExtractor(node), node));
    }
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
