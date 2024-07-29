interface PublicWalletInfo {
  name: string;
}

export const publicWallets = new Map<string, PublicWalletInfo>([
  [
    'F57D3968D0BFD5B3120FDA88F34310C70BD72033F77422F4407FBBEF7C24557A',
    {
      name: '0lswap OTC',
    },
  ],
  [
    '7153A13691E832EC5C5E2F0503FB7D228FBB7C87DD0C285C29D3F1D9F320CD5C',
    {
      name: 'Osmosis Bridge',
    },
  ],
  [
    '8D57A33412C4625289E35F2843E1D36EA19FA6BDE7816B1E3607C694926F01AE',
    {
      name: 'Base Bridge',
    },
  ],
]);
