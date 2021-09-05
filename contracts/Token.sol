// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Token {
    string public name = 'Token';

    string public symbol = 'Tok';

    string public standard = 'Token v1.0';

    uint256 public totalSupply;

    event Transfer (address indexed _from, address indexed _to, uint256 _value);

    mapping(address => uint256) public balanceOf;

    constructor(uint256 _initialSupply) public {
        balanceOf[msg.sender] = _initialSupply;
        totalSupply = _initialSupply;

    }

    function transfer(address _to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value);

        balanceOf[msg.sender] -= value;
        balanceOf[_to] += value;

        emit Transfer(msg.sender, _to, value);

        return true;
    }
}