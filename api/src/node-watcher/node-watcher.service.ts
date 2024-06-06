import fs from "node:fs";
import { Readable } from "node:stream";

import _ from "lodash";
import { Injectable, Logger } from "@nestjs/common";
import maxmind, { CityResponse } from "maxmind";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { OlService } from "../ol/ol.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { S3Service } from "../s3/s3.service.js";
import axios from "axios";

const LEDGER_VERSION_LIMIT = 30n;
const DEFAULT_UPSTREAMS = [
  "172.104.211.8",
  "160.202.129.29",
  "209.38.172.53",
  "38.242.137.192",
  "136.243.93.42",
  "65.109.80.179",
];

@Injectable()
export class NodeWatcherService {
  private readonly logger = new Logger(NodeWatcherService.name);

  public constructor(
    private readonly olService: OlService,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  public async getUpstreams(): Promise<string[]> {
    let nodes = await this.prisma.node.findMany({
      where: {
        isUp: true,
      },
    });

    // return the most up to date nodes
    if (nodes.length) {
      const lastVersion = _.maxBy(nodes, (node) => node.ledgerVersion);

      let limit = 0n;
      if (
        lastVersion &&
        lastVersion.ledgerVersion &&
        lastVersion.ledgerVersion >= LEDGER_VERSION_LIMIT
      ) {
        limit = lastVersion.ledgerVersion - LEDGER_VERSION_LIMIT;
      }

      return nodes
        .filter((node) => node.ledgerVersion! >= limit)
        .map((node) => node.ip);
    }

    // return all the nodes if nothing is up
    nodes = await this.prisma.node.findMany();
    if (nodes.length) {
      return nodes.map((node) => node.ip);
    }

    return DEFAULT_UPSTREAMS;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  private async downloadFile(bucket: string, key: string, dest: string) {
    const res = await this.s3Service.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    res.Body;

    return new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      file.on("close", () => {
        resolve();
      });

      file.on("error", (err) => {
        console.error(err);
        reject(err);
      });

      (res.Body as Readable).pipe(file);
    });
  }

  private async downloadGeoIpDb() {
    await fs.promises.mkdir(".geoip", { recursive: true });

    if (!(await this.fileExists(".geoip/GeoLite2-City.mmdb"))) {
      await this.downloadFile(
        "ol-data",
        "geoip/GeoLite2-City.mmdb",
        ".geoip/GeoLite2-City.mmdb",
      );
    }
  }

  public async updateValidatorLocations() {
    await this.downloadGeoIpDb();
    const res = await this.prisma.$queryRaw<{ ip: string }[]>`
      SELECT "validatorIp" as "ip"
      FROM "Validator"
      WHERE "validatorIp" IS NOT NULL
      GROUP BY "validatorIp"

      UNION DISTINCT

      SELECT "fullNodeIp" as "ip"
      FROM "Validator"
      WHERE "fullNodeIp" IS NOT NULL
      GROUP BY "fullNodeIp"
    `;
    const ips = res.map(({ ip }) => ip);
    const lookup = await maxmind.open<CityResponse>(
      ".geoip/GeoLite2-City.mmdb",
    );

    const nodes: {
      ip: string;
      latitude: number;
      longitude: number;
      city?: string;
      country?: string;
    }[] = [];

    for (const ip of ips) {
      const r = lookup.get(ip);
      if (r && r.location) {
        nodes.push({
          ip,
          latitude: r.location.latitude,
          longitude: r.location.longitude,
          city: r?.city?.names?.en,
          country: r?.country?.names?.en,
        });
      }
    }

    const placeholders = nodes.map(
      (_, i) =>
        `($${1 + i * 5}, $${2 + i * 5}, $${3 + i * 5}, $${4 + i * 5}, $${5 + i * 5})`,
    );

    const params = _.flatten(
      nodes.map((node) => [
        node.ip,
        node.latitude,
        node.longitude,
        node.city,
        node.country,
      ]),
    );
    const nodeIps = nodes.map((node) => node.ip);

    const query = `
      INSERT INTO "Node" ("ip", "latitude", "longitude", "city", "country")
      VALUES ${placeholders.join(",")}
      ON CONFLICT ("ip")
      DO UPDATE SET
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "city" = EXCLUDED."city",
        "country" = EXCLUDED."country"
    
    `;

    await this.prisma.$queryRawUnsafe(query, ...params);

    await this.prisma.$queryRawUnsafe(`
      DELETE FROM "Node"
      WHERE "ip" NOT IN (
        ${nodeIps.map((it) => `'${it}'`).join(",")}
      )
    `);
  }

  public async updateValidatorsList() {
    const validatorSet = await this.olService.getValidatorSet();
    const validators: {
      address: Buffer;
      validatorIp?: string;
      fullNodeIp?: string;
    }[] = [];

    for (const validator of validatorSet.activeValidators) {
      const { fullnodeAddresses, networkAddresses } = validator.config;

      let fullNodeIp: undefined | string;
      let validatorIp: undefined | string;

      if (fullnodeAddresses) {
        const ip = fullnodeAddresses.split("/");
        fullNodeIp = ip[2];
      }

      if (networkAddresses) {
        const ip = networkAddresses.split("/");
        validatorIp = ip[2];
      }

      validators.push({
        address: validator.addr,
        fullNodeIp,
        validatorIp,
      });
    }

    const placeholders = validators.map(
      (_, i) => `($${1 + i * 3}, $${2 + i * 3}, $${3 + i * 3})`,
    );
    const params = _.flatten(
      validators.map((validator) => [
        validator.address,
        validator.validatorIp,
        validator.fullNodeIp,
      ]),
    );
    const validatorAddresses = validators.map((validator) => validator.address);

    const query = `
      INSERT INTO "Validator" ("address", "validatorIp", "fullNodeIp")
      VALUES ${placeholders.join(",")}
      ON CONFLICT ("address")
      DO UPDATE SET
        "validatorIp" = EXCLUDED."validatorIp",
        "fullNodeIp" = EXCLUDED."fullNodeIp"
    `;

    await this.prisma.$queryRawUnsafe(query, ...params);

    await this.prisma.$queryRawUnsafe(`
      DELETE FROM "Validator"
      WHERE "address" NOT IN (
        ${validatorAddresses.map((it) => `'\\x${it.toString("hex")}'`).join(",")}
      )
    `);
  }

  public async checkNodes() {
    const nodes = await this.prisma.node.findMany({
      orderBy: {
        lastCheck: {
          sort: "asc",
          nulls: "first",
        },
      },
      take: 10,
    });
    await Promise.allSettled(nodes.map((node) => this.checkNode(node.ip)));
  }

  private async checkNode(ip: string) {
    const now = new Date();
    try {
      const res = await axios({
        method: "GET",
        url: `http://${ip}:8080/v1`,
        signal: AbortSignal.timeout(5000), //Aborts request after 5 seconds
        validateStatus: (status) => status === 200,
      });

      await this.prisma.node.update({
        where: {
          ip,
        },
        data: {
          isUp: true,
          lastCheck: now,
          ledgerVersion: res.data.ledger_version,
        },
      });
    } catch (error) {
      await this.prisma.node.update({
        where: {
          ip,
        },
        data: {
          isUp: false,
          lastCheck: now,
        },
      });
    }
  }
}
