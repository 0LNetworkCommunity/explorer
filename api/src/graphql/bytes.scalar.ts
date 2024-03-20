import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("Bytes", (type) => Buffer)
export class BytesScalar implements CustomScalar<string, Buffer> {
  public readonly description = "Buffer";

  private static INVALID_HEX_REPRESENTATION =
    "Invalid bytes literal hex representation";

  private static checkLiteral(value: string) {
    if ((value.length & 1) === 1) {
      throw new Error(BytesScalar.INVALID_HEX_REPRESENTATION);
    }

    if (/^[0-9ABCDEF]*$/i.test(value) === false) {
      throw new Error(BytesScalar.INVALID_HEX_REPRESENTATION);
    }
  }

  public parseValue(value: string): Buffer {
    BytesScalar.checkLiteral(value);
    return Buffer.from(value, "hex");
  }

  public serialize(value: Buffer): string {
    return value.toString("hex").toUpperCase();
  }

  public parseLiteral(ast: ValueNode): Buffer {
    if (ast.kind === Kind.STRING) {
      BytesScalar.checkLiteral(ast.value);
      return Buffer.from(ast.value, "hex");
    }
    throw new Error(BytesScalar.INVALID_HEX_REPRESENTATION);
  }
}
