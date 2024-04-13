import { Query, ObjectType, Field, Float, Resolver } from "@nestjs/graphql";
import { PrismaService } from "../prisma/prisma.service.js";

@ObjectType("Node")
export class GqlNode {
  public constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  @Field(() => Float)
  public latitude: number;

  @Field(() => Float)
  public longitude: number;
}

@Resolver()
export class NodeResolver {
  public constructor(private readonly prismaService: PrismaService) {}

  @Query(() => [GqlNode], { nullable: true })
  public async nodes(): Promise<GqlNode[]> {
    const nodes = await this.prismaService.node.groupBy({
      by: ["latitude", "longitude"],
    });
    return nodes.map((node) => new GqlNode(node.latitude, node.longitude));
  }
}
