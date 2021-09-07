const Token = artifacts.require('Token');
const TokenSale = artifacts.require('TokenSale');

module.exports = async (deployer) => {
	const tokenPrice = 1000000000000000;
	
	await deployer.deploy(Token, 1000000);
	await deployer.deploy(TokenSale, Token.address, tokenPrice);
};
