import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { ERC20 } from "../typechain/ERC20";
import { ERC20__factory } from "../typechain/factories/ERC20__factory";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { provider } = waffle;

describe("erc20", function () {
  let token: ERC20;
  const [wallet] = provider.getWallets();
  let signers: SignerWithAddress[];

  before(async function () {
    signers = await ethers.getSigners();
    const deployer = new ERC20__factory(signers[0]);
    token = await deployer.deploy("token", "TKN");
    await token.mint(signers[0].address, ethers.utils.parseEther("100"));
  });

  describe("transfer functionality", async () => {
    it("transfers successfully", async () => {
      await token.transfer(signers[1].address, ethers.utils.parseEther("5"));
      expect(await token.balanceOf(signers[0].address)).to.be.eq(
        ethers.utils.parseEther("95")
      );
      expect(await token.balanceOf(signers[1].address)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("does not transfer more than balance", async () => {
      const tx = token.transfer(
        signers[1].address,
        ethers.utils.parseEther("500")
      );
      await expect(tx).to.be.revertedWith("ERC20: insufficient-balance");
    });
  });

  describe("transferFrom functionality", async () => {
    it("does not transfer since not approved", async () => {
      const tx = token.transferFrom(
        signers[1].address,
        signers[0].address,
        ethers.utils.parseEther("5")
      );
      await expect(tx).to.be.revertedWith("ERC20: insufficient-allowance");
    });

    it("transfersFrom successfully", async () => {
      await token
        .connect(signers[1])
        .approve(signers[0].address, ethers.utils.parseEther("4"));
      await token.transferFrom(
        signers[1].address,
        signers[0].address,
        ethers.utils.parseEther("2")
      );
      expect(await token.balanceOf(signers[0].address)).to.be.eq(
        ethers.utils.parseEther("97")
      );
      expect(await token.balanceOf(signers[1].address)).to.be.eq(
        ethers.utils.parseEther("3")
      );
    });

    it("transferFrom should fail", async () => {
      const tx = token.transferFrom(
        signers[1].address,
        signers[0].address,
        ethers.utils.parseEther("3")
      );

      //Had 5 tokens, and allowance was 4. Transfered 2 which worked, then fails to transfer 3
      await expect(tx).to.be.revertedWith("ERC20: insufficient-allowance");
    });
  });
});
