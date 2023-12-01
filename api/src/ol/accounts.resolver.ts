import { Args, Query, Resolver } from "@nestjs/graphql";
import { OlService } from "./ol.service.js";
import { GqlAccount } from "./models/account.model.js";

@Resolver()
export class AccountsResolver {
  public constructor(private readonly olService: OlService) {}

}