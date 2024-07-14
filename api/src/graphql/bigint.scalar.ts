import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import BN from 'bn.js';

@Scalar('BigInt', (type) => BN)
export class BigIntScalar implements CustomScalar<string, BN> {
  public readonly description = 'BigInt';

  private static INVALID_BIGINT_REPRESENTATION =
    'Invalid bigint literal representation. Must be base 10 number';

  private static checkLiteral(value: string) {
    if (/^[0-9]*$/i.test(value) === false) {
      throw new Error(BigIntScalar.INVALID_BIGINT_REPRESENTATION);
    }
  }

  public parseValue(value: string): BN {
    BigIntScalar.checkLiteral(value);
    return new BN(value, 10);
  }

  public serialize(value: BN): string {
    return value.toString(10);
  }

  public parseLiteral(ast: ValueNode): BN {
    if (ast.kind === Kind.STRING) {
      BigIntScalar.checkLiteral(ast.value);
      return new BN(ast.value, 10);
    }
    throw new Error(BigIntScalar.INVALID_BIGINT_REPRESENTATION);
  }
}
