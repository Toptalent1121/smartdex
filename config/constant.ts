// global Constants for porject

/* These values is for dev env.
   When you update it into prod env, you have to change some values

   // For Mainnet Production

  API_URL: 'https://mainnet-api.herokuapp.com/api/v0',
  NETWORK_ID: 1,
  PUBLIC_NODE_URLS: 'https://mainnet.infura.io/QKt6Cz7nybWrpMH4xxLL',
  AUDIT_TRANSACTION_URL: 'https://etherscan.io/tx',

  // For Kovannet Production

  API_URL: 'https://api-smartdex.herokuapp.com/api/v0',
  NETWORK_ID: 42,
  PUBLIC_NODE_URLS: 'https://kovan.infura.io/QKt6Cz7nybWrpMH4xxLL',
  AUDIT_TRANSACTION_URL: 'https://kovan.etherscan.io/tx/',

  If you update the values, this project will works fine in  Maninnet

  https://api-smartdex.herokuapp.com/
*/
export const constant = {
  HOST_URL: 'http://localhost:4200',
  // API_URL: 'https://mainnet-api.herokuapp.com/api/v0',
  // NETWORK_ID: 1,
  // PUBLIC_NODE_URLS: 'https://mainnet.infura.io/QKt6Cz7nybWrpMH4xxLL',
  // AUDIT_TRANSACTION_URL: 'https://etherscan.io/tx',
  API_URL: 'http://localhost:42001/api/v0',
  // API_URL: 'https://api-exchange.evoai.tech/api/v0',
  NETWORK_ID: 42,
  PUBLIC_NODE_URLS: 'https://kovan.infura.io/QKt6Cz7nybWrpMH4xxLL',
  AUDIT_TRANSACTION_URL: 'https://kovan.etherscan.io/tx/',
  
  INFURA_API_KEY: 'QKt6Cz7nybWrpMH4xxLL',
  BASE_TOKEN: 'WETH',
  PRECISION: 5,
  GWEI_IN_WEI: 1000000000,
  DECIMAL_PLACES_ETH: 18,
  DECIMAL_PLACES_ZRX: 18,
  BASE_TOKEN_ADDRESS: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
  // kovan evot address
  QUOTE_TOKEN: '0x3924a197e09468ec0bf1ab46e359d1254d32724b',
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
  EtherscanAPI_KEY: 'VC86GVF92KYSDK8MR797Y5N45TAAH8NMIM',
  GasLimit: 21000,
  GasPrice: 1,
  FEE: 0.5,
  ErrMsg: {
    isEmptyConvertValue: 'please input amount you want to convert',
    ExceedConvertValue: 'Change amount cannot much more than current Balance',
    FailToWrapEther: 'Failed to wrap Ether!',
    FailToUnWrapEther: 'Failed to unWrap Ether',
    isEmptyTokenName: 'Token Name must be given',
    isEmptyTokenSymbol: 'Token Symbol must be given',
    isEmptyTokenAddress: 'Token Address must be given',
    isEmptyTokenDecimal: 'Token Decimal must be given',
  },
  GENESIS_ORDER_BLOCK_BY_NETWORK_ID: {
    1: 4145578,
    42: 3117574,
    50: 0,
    3: 1719261,
    4: 1570919,
} as { [networkId: number]: number }
};

