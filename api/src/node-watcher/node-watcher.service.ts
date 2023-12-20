import Bluebird from 'bluebird';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { OlService } from '../ol/ol.service.js';
import { NetworkAddresses } from '../ol/network-addresses.js';

@Injectable()
export class NodeWatcherService implements OnModuleInit {
  private readonly logger = new Logger(NodeWatcherService.name);

  public constructor(private readonly olService: OlService) {

  }

  public async onModuleInit() {
    this.logger.log('hello world!');
    this.getValidators();
  }

  private async getValidators() {

    // const fullnode_addresses = Buffer.from(
    //   "930d2d4d1978f45e16adf911b906e42f52768d196eb01f572c1d687c230a9bdb7b30ac4a8ee4968b28b63fc209594688",
    //   "hex"
    // );

    const network_addresses = Buffer.from(
      "012d0400bc286b6905241807201691a108495c157d4aaa0c95b7b3f704ca5d2aca7fe359ff82e435733e3216030800",
      "hex",
    );

    // console.log("fullnode_addresses", NetworkAddresses.fromBytes(fullnode_addresses)?.toString());
    console.log("network_addresses", NetworkAddresses.fromBytes(network_addresses)?.toString());


    // const validatorSet = await this.olService.getValidatorSet();
    // const ips = new Set<string>();

    // for (const validator of validatorSet.activeValidators) {
    //   const { fullnodeAddresses, networkAddresses } = validator.config;
    //   if (fullnodeAddresses) {
    //     const ip = fullnodeAddresses.split('/');
    //     ips.add(ip[2]);
    //   }

    //   if (networkAddresses) {
    //     const ip = networkAddresses.split('/');
    //     ips.add(ip[2]);
    //   }
    // }

    // await Promise.all(Array.from(ips.values()).map(async (ip) => {
    //     // axios({
    //     //   url: `http://${ip}:8080/v1`
    //     //   tim


    // }));

    // console.log(ips);
  }
}
