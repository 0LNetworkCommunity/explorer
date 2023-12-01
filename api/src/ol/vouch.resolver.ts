import { Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { OlService } from "./ol.service.js";
import { GqlValidator, GqlVouch } from "./models/validator.model.js";
import { GqlAccount } from "./models/account.model.js";

@Resolver(GqlVouch)
export class VouchResolver {
  public constructor(private readonly olService: OlService) {}

  @ResolveField(() => GqlAccount)
  public account(@Parent() validator: GqlValidator): GqlAccount {
    return new GqlAccount(validator.address);
  }
}