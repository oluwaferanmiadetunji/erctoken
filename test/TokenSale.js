const TokenSale = artifacts.require('TokenSale');
const Token = artifacts.require('Token');

contract('TokenSale', (accounts) => {
	let tokenSaleInstance;
	let tokenInstance;
	let tokenPrice = 1000000000000000;
	let buyer = accounts[1];
	let admin = accounts[0];
	let tokensAvavilable = 750000;
	let numberOfTokens = 10;

	it('initalizes the contract with the correct values', async () => {
		tokenSaleInstance = await TokenSale.deployed();

		const address = tokenSaleInstance.address;
		assert.notEqual(address, 0x0, 'has contract address');

		const contractAddress = tokenSaleInstance.tokenContract();
		assert.notEqual(contractAddress, 0x0, 'has token contract address');

		const price = await tokenSaleInstance.tokenPrice();

		assert.equal(price, tokenPrice, 'token price is correct');
	});

	it('it facilitates token buying', async () => {
		tokenInstance = await Token.deployed();

		tokenSaleInstance = await TokenSale.deployed();

		await tokenInstance.transfer(tokenSaleInstance.address, tokensAvavilable, { from: admin });

		const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, {
			from: buyer,
			value: numberOfTokens * tokenPrice,
		});

		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Sell', 'should be the Sell event');
		assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');

		const amount = await tokenSaleInstance.tokensSold();

		assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');

		const buyerBalance = await tokenInstance.balanceOf(buyer);

		assert.equal(
			buyerBalance.toNumber(),
			numberOfTokens,
			'checks that the buyer balance is equal to the number of tokens bought',
		);

		const balance = await tokenInstance.balanceOf(tokenSaleInstance.address);

		assert.equal(
			balance.toNumber(),
			tokensAvavilable - numberOfTokens,
			'checks that the contract balance has been reduced by the number of tokens bought',
		);

		return tokenSaleInstance
			.buyTokens(numberOfTokens, {
				from: buyer,
				value: 1,
			})
			.then(assert.fail)
			.catch((error) => {
				assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');

				return tokenSaleInstance.buyTokens(800000, {
					from: buyer,
					value: numberOfTokens * tokenPrice,
				});
			})
			.then(assert.fail)
			.catch((error) => {
				assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
			});
	});
});
