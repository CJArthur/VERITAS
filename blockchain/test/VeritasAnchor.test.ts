import { expect } from "chai";
import { ethers } from "hardhat";

describe("VeritasAnchor", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const VeritasAnchor = await ethers.getContractFactory("VeritasAnchor");
    const contract = await VeritasAnchor.deploy();
    return { contract, owner, other };
  }

  it("anchors a hash and emits event", async function () {
    const { contract, owner } = await deploy();
    const hash = ethers.id("diploma:test-123");
    await expect(contract.anchor(hash))
      .to.emit(contract, "DiplomaAnchored")
      .withArgs(hash, owner.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
  });

  it("rejects duplicate anchor", async function () {
    const { contract } = await deploy();
    const hash = ethers.id("diploma:duplicate");
    await contract.anchor(hash);
    await expect(contract.anchor(hash)).to.be.revertedWith("Already anchored");
  });

  it("verify returns false for unknown hash", async function () {
    const { contract } = await deploy();
    const hash = ethers.id("diploma:unknown");
    const [exists] = await contract.verify(hash);
    expect(exists).to.be.false;
  });

  it("verify returns true with correct data after anchor", async function () {
    const { contract, owner } = await deploy();
    const hash = ethers.id("diploma:verified");
    await contract.anchor(hash);
    const [exists, , issuerAddr] = await contract.verify(hash);
    expect(exists).to.be.true;
    expect(issuerAddr).to.equal(owner.address);
  });
});
