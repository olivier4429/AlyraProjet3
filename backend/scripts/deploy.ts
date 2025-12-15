import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "localhost",
});

async function main(): Promise<void> {
    console.log('Déploiement en cours...');

    const Voting = await ethers.deployContract("Voting", 
      {  value: 10_000_000_000_000_000n, 
    });// 0.01ETH


    await Voting.waitForDeployment(); // attendre que le contrat soit miné

    const addr = await Voting.getAddress();
    console.log(`Contract déployé à ${addr}`);

    // Vérifier le solde du contrat
    const balance = await ethers.provider.getBalance(addr);
    console.log("Balance du contrat :", ethers.formatEther(balance), "ETH");

}



await main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});