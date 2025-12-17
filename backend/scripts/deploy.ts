import { network } from "hardhat";

const { ethers, networkName  } = await network.connect({
  network: "localhost",
});

async function main(): Promise<void> {
  console.log('Déploiement en cours...');

  const Voting = await ethers.deployContract("Voting",
    {
      value: 10_000_000_000_000_000n,
    });// 0.01ETH


  await Voting.waitForDeployment(); // attendre que le contrat soit miné

  // Transaction de déploiement
  const deployTx = Voting.deploymentTransaction();
  if (!deployTx) {
    throw new Error("Deployment transaction introuvable");
  }

  // Receipt (contient le gas)
  const receipt = await deployTx.wait();

  const addr = await Voting.getAddress();
  console.log(`Contract déployé à ${addr} pour un cout de ${receipt?.gasUsed.toString()} gas  sur le réseau ${networkName}`);

  // Vérifier le solde du contrat
  const balance = await ethers.provider.getBalance(addr);
  console.log("Balance du contrat :", ethers.formatEther(balance), "ETH");

}



await main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});