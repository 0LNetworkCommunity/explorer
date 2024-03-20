import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";
import { Decimal } from "decimal.js";

@Scalar("Decimal", (type) => Decimal)
export class DecimalScalar implements CustomScalar<string, Decimal> {
  public readonly description = "Decimal";

  public parseValue(value: string): Decimal {
    return new Decimal(value);
  }

  public serialize(value: Decimal): string {
    return value.toString();
  }

  public parseLiteral(ast: ValueNode): Decimal {
    if (ast.kind === Kind.STRING) {
      return new Decimal(ast.value);
    }
    throw new Error("Unable to parse Decimal. Literal must be a string.");
  }
}
