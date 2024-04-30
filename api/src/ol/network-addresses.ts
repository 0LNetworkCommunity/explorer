import { BCS } from "aptos";

const PUBLIC_KEY_SIZE = 32;

interface INetworkProtocol {
  toString(): string;
}

class Ip4Protocol implements INetworkProtocol {
  public constructor(public readonly ip: Uint8Array) {
    if (ip.length !== 4) {
      throw new Error('invalid length');
    }
  }

  public toString(): string {
    return `/ip4/${this.ip.join('.')}`;
  }
}

// An IPv6 address.
// IPv6 addresses are defined as 128-bit integers in IETF RFC 4291.
// They are usually represented as eight 16-bit segments.
class Ip6Protocol implements INetworkProtocol {
  public constructor(public readonly ip: Uint16Array) {
    if (ip.length !== 8) {
      throw new Error('invalid length');
    }
  }

  public toString(): string {
    const ip = Array.from(this.ip).map((it) =>  it.toString(16));
    return `/ip6/${ip.join(':')}`;
  }
}

class DnsProtocol implements INetworkProtocol {
  public constructor(public readonly name: string) {
  }

  public toString(): string {
    return `/dns/${this.name}`;
  }
}

class TcpProtocol implements INetworkProtocol {
  public constructor(public readonly port: number) {
    if (port < 0 || port > 0xFFFF) {
      throw new Error('invalid port');
    }
  }

  public toString(): string {
    return `/tcp/${this.port}`;
  }
}

// human-readable x25519::PublicKey is lower-case hex encoded
class NoiseIKProtocol implements INetworkProtocol {
  public constructor(public readonly publicKey: Uint8Array) {
    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      throw new Error('invalid length');
    }
  }

  public toString(): string {
    return `/noise-ik/0x${Buffer.from(this.publicKey).toString('hex')}`;
  }
}

class HandshakeProtocol implements INetworkProtocol {
  public constructor(public readonly version: number) {
    if (version < 0 || version > 0xFF) {
      throw new Error('invalid length');
    }
  }

  public toString(): string {
    return `/handshake/${this.version}`;
  }
}

type NetworkProtocol =
  | Ip4Protocol
  | Ip6Protocol
  | TcpProtocol
  | NoiseIKProtocol
  | HandshakeProtocol
  | DnsProtocol;

type ProtocolDeserializer = (deserializer: BCS.Deserializer) => NetworkProtocol;

export class NetworkAddresses {
  private static protocolDeserializers: ProtocolDeserializer[] = [
    function ip4(deserializer: BCS.Deserializer): Ip4Protocol {
      return new Ip4Protocol(new Uint8Array([
        deserializer.deserializeU8(),
        deserializer.deserializeU8(),
        deserializer.deserializeU8(),
        deserializer.deserializeU8(),
      ]));
    },

    function ip6(deserializer: BCS.Deserializer): Ip6Protocol {
      return new Ip6Protocol(new Uint16Array([
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
        deserializer.deserializeU16(),
      ]));
    },

    function dns(deserializer: BCS.Deserializer) {
      const name = deserializer.deserializeStr();
      return new DnsProtocol(name);
    },

    function dns4(deserializer: BCS.Deserializer) {
      throw new Error('dns4 unimplemented');
    },

    function dns6(deserializer: BCS.Deserializer) {
      throw new Error('dns6 unimplemented');
    },

    function tcp(deserializer: BCS.Deserializer) {
      return new TcpProtocol(deserializer.deserializeU16());
    },

    function memory(deserializer: BCS.Deserializer) {
      throw new Error('memory unimplemented');
    },

    function noiseIK(deserializer: BCS.Deserializer) {
      const publicKey = deserializer.deserializeBytes();
      return new NoiseIKProtocol(publicKey);
    },

    function handshake(deserializer: BCS.Deserializer) {
      const version = deserializer.deserializeU8();
      return new HandshakeProtocol(version);
    },
  ];

  public static fromBytes(bytes: Uint8Array): NetworkAddresses | null {
    const deserializer = new BCS.Deserializer(bytes);

    const isSet = deserializer.deserializeBool();
    if (!isSet) {
      return null;
    }

    const length = deserializer.deserializeU8();
    if (bytes.length !== length + 2) {
      throw new Error('invalid buffer length');
    }

    const protocolCount = deserializer.deserializeU8();

    const protocols = new Array<NetworkProtocol>(protocolCount);

    for (let i = 0; i < protocolCount; ++i) {
      const proto = deserializer.deserializeU8();

      if (proto >= NetworkAddresses.protocolDeserializers.length) {
        throw new Error(`unsupported protocol 0x${proto.toString(16)}`);
      }

      protocols[i] = NetworkAddresses.protocolDeserializers[proto](deserializer);
    }

    return new NetworkAddresses(protocols);
  }

  private constructor(public readonly protocols: NetworkProtocol[]) {}

  public toString(): string {
    return this.protocols.map((protocol) => protocol.toString()).join('');
  }
}