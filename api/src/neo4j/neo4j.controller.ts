import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { Neo4jService } from './neo4j.service.js';
import { CypherQueryDto } from './dto/query.dto.js';

@Controller('neo4j')
export class Neo4jController {
  private readonly logger = new Logger(Neo4jController.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  // @Post('query')
  // async executeQuery(@Body() queryDto: CypherQueryDto) {
  //   this.logger.debug(`Executing Neo4j query: ${queryDto.query}`);
  //   try {
  //     const results = await this.neo4jService.runQuery(queryDto.query, queryDto.params || {});
  //     return { results };
  //   } catch (error) {
  //     this.logger.error(`Error executing Neo4j query: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }

  @Get('wallet/:address/connections')
  async getWalletConnections(@Param('address') address: string) {
    this.logger.debug(`Fetching connections for wallet: ${address}`);
    return this.neo4jService.getAllWalletFirstDegree(address);
  }
}
