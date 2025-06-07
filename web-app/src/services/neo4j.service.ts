import { config } from '../config';

export interface Neo4jNode {
  id: string;
  labels: string[];
  address?: string;
  [key: string]: any;
}

export interface Neo4jRelationship {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  [key: string]: any;
}

export interface Neo4jGraphData {
  nodes: Neo4jNode[];
  relationships: Neo4jRelationship[];
}

class Neo4jService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = `${config.apiHost}/neo4j`;
  }

  /**
   * Get all first-degree connections for a wallet
   * @param address The wallet address to query
   */
  async getWalletConnections(address: string): Promise<Neo4jGraphData> {
    try {
      const response = await fetch(`${this.apiUrl}/wallet/${encodeURIComponent(address)}/connections`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get wallet connections: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching wallet connections:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new Neo4jService();
