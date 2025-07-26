const API_HOST: string = import.meta.env.VITE_API_HOST;
const DATA_API_HOST: string = import.meta.env.VITE_DATA_API_HOST;

export interface Config {
  apiHost: string;
  dataApiHost: string;
}

const localhost = {
  apiHost: API_HOST,
  dataApiHost: DATA_API_HOST,
};

// TODO: make these URLs configurable
const configMap = new Map<string, Config>([
  [
    'scan.scan.openlibra.world',
    {
      apiHost: 'https://api.scan.scan.openlibra.world',
      dataApiHost: 'https://data.scan.scan.openlibra.world',
    },
  ],
  [
    'canary.scan.openlibra.world',
    {
      apiHost: 'https://canary.api.scan.openlibra.world',
      dataApiHost: 'https://canary.data.scan.openlibra.world',
    },
  ],
  [
    '127.0.0.1',
    localhost
  ],
  [
    'localhost',
    localhost
  ],
]);

export const config = configMap.get(window.location.hostname) ?? configMap.get('scan.scan.openlibra.world')!;
