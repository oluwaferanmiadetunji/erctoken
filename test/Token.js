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
				assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
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

	it('it approves token for delegated transfer', async () => {
		const tokenInstance = await Token.deployed();
		const success = await tokenInstance.approve.call(accounts[1], 100);

		assert.equal(success, true, 'it returns true');

		const receipt = await tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Approval', 'should be the Approval event');
		assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
		assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
		assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');

		const allowance = await tokenInstance.allowance(accounts[0], accounts[1]);

		assert.equal(allowance, 100, 'stores the allowance for the delegated transfer');
	});

	it('it handles delegated transfer', async () => {
		const tokenInstance = await Token.deployed();
		const fromAccount = accounts[2];
		const toAccount = accounts[3];
		const spendingAccount = accounts[4];

		await tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });

		tokenInstance.approve(spendingAccount, 10, { from: fromAccount });

		await tokenInstance
			.transferFrom(fromAccount, toAccount, 20000000, { from: spendingAccount })
			.then(assert.fail)
			.catch((error) => {
				assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
			});

		await tokenInstance
			.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount })
			.then(assert.fail)
			.catch((error) => {
				assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
			});

		const success = await tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });

		assert.equal(success, true, 'it returns true');

		const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });

		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the transfer event');
		assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
		assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
		assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');

		const fromBalance = await tokenInstance.balanceOf(fromAccount);

		assert.equal(fromBalance.toNumber(), 90, 'it  deducts the amount from the sending account');

		const toBalance = await tokenInstance.balanceOf(toAccount);

		assert.equal(toBalance.toNumber(), 10, 'it  adds the amount to the receiving account');

		const allowance = await tokenInstance.allowance(fromAccount, spendingAccount);

		assert.equal(allowance.toNumber(), 0, 'it deducts the amount from the allowance');
	});
});
