const Token = artifacts.require('Token');

contract('Token', (accounts) => {
	it('sets the total supply of token upon deployment', async () => {
		const instance = await Token.deployed();
		const totalSupply = await instance.totalSupply();

		assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
	});
});

