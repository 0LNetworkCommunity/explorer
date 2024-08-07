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

const configMap = new Map<string, Config>([
  [
    '0l.fyi',
    {
      apiHost: 'https://api.0l.fyi',
      dataApiHost: 'https://data.0l.fyi',
    },
  ],
  [
    'canary.0l.fyi',
    {
      apiHost: 'https://canary.api.0l.fyi',
      dataApiHost: 'https://canary.data.0l.fyi',
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

export const config = configMap.get(window.location.hostname) ?? configMap.get('0l.fyi')!;
