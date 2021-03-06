# Dai Alchemix + Yearn Strategy

Strategy to deposit DAI in Alchemix, borrow alUSD &amp; deposit in Curve Pool and then deposit LP tokens in Yearn's Curve alUSD vault.

### What the contract does:

1. Deposits DAI in Alchemix V2
2. Mints alUSD from Alchemix V2
3. Deposits alUSD in the [Curve Factory USD Metapool alUSD3CRV](https://etherscan.io/address/0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c).
5. Deposits Curve LP Token to [Yearn's Curve alUSD vault](https://yearn.finance/#/vault/0xA74d4B67b3368E83797a35382AFB776bAAE4F5C8) in the name of the sender.

### How to test it in your local blockchain

As Alchemix V2 only allows the interaction of whitelisted contracts (apart from all EOAs, we must first whitelist our contract in the Whitelist in our local blockchain.

1. Install hardhat & dependencies
2. Run local blockchain using [mainnet forking](https://hardhat.org/hardhat-network/guides/mainnet-forking.html)
3. Run [scripts/deploy](https://github.com/fadingflea/dai_alchemix_strategy/blob/master/scripts/deploy.js) in localhost
4. Create .env file and fill out their variables as in [.env.example](https://github.com/fadingflea/dai_alchemix_strategy/blob/master/.env.example)
5. Run [scripts/contractSetup](https://github.com/fadingflea/dai_alchemix_strategy/blob/master/scripts/contractSetup.js) in localhost
7. Earn :)



#### This is unadited code and for experimental purposes. Use it at your own risk. 
