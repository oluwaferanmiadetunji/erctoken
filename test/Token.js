const Token = artifacts.require('Token');

contract('Token', (accounts) => {
	it('initalizes the contract with the correct values', async () => {
		const tokenInstance = await Token.deployed();
		const name = await tokenInstance.name();

		assert.equal(name, 'Token', 'has the correct name');

		const symbol = await tokenInstance.symbol();

		assert.equal(symbol, 'Tok', 'has the correct symbol');

		const standard = await tokenInstance.standard();

		assert.equal(standard, 'Token v1.0', 'has the correct standard');
	});

	it('allocates the total supply of token upon deployment', async () => {
		const tokenInstance = await Token.deployed();
		const totalSupply = await tokenInstance.totalSupply();

		assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');

		const adminBalance = await tokenInstance.balanceOf(accounts[0]);

		assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin');
	});

	it('transfers ownership of a token', async () => {
		return Token.deployed()
			.then((instance) => {
				tokenInstance = instance;
				return tokenInstance.transfer.call(accounts[1], 999999999);
			})
			.then(assert.fail)
			.catch((error) => {
				assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
				return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
			})
			.then((success) => {
				assert.equal(success, true, 'it returns true');
				return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
			})
			.then((receipt) => {
				assert.equal(receipt.logs.length, 1, 'triggers one event');
				assert.equal(receipt.logs[0].event, 'Transfer', 'should be the event');
				assert.equal(
					receipt.logs[0].args._from,
					accounts[0],
					'logs the account the tokens are transferred from',
				);
				assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
				assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
				return tokenInstance.balanceOf(accounts[1]);
			})
			.then((balance) => {
				assert.equal(balance.toNumber(), 250000, 'it adds the amount to the receiving account');
				return tokenInstance.balanceOf(accounts[0]);
			})
			.then((balance) => {
				assert.equal(balance.toNumber(), 750000, 'it deducts the amount from the sending account');
			});
	});
});
