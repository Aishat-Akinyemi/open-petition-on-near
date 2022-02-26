const CONTRACT_NAME = 'dev-1645520158922-84401134614929'; 

export const environment = {
  production: false,
  config: {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    contractName: CONTRACT_NAME,
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org'
  },
  call_methods: ['createPetition', 'sign'],
  view_methods: ['list', 'show', 'listSignatories']
};
