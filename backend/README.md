# To deploy :
npx hardhat run scripts/deploy.ts

# To run test :
npx hardhat test


# Voting contract:
## Optimisation:

Avant optimisation

╔══════════════════════════════════════════════════════════════════════════════════╗
║                               Gas Usage Statistics                               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
╔══════════════════════════════════════════════════════════════════════════════════╗
║ contracts/Voting.sol:Voting                                                      ║
╟───────────────────────────┬─────────────────┬──────────┬────────┬───────┬────────╢
║ Function name             │ Min             │ Average  │ Median │ Max   │ #calls ║
╟───────────────────────────┼─────────────────┼──────────┼────────┼───────┼────────╢
║ addProposal               │ 59235           │ 59235    │ 59235  │ 59235 │ 31     ║
║ addVoter                  │ 50184           │ 50194.75 │ 50196  │ 50196 │ 326    ║
║ endProposalsRegistering   │ 30586           │ 30586    │ 30586  │ 30586 │ 10     ║
║ endVotingSession          │ 30520           │ 30520    │ 30520  │ 30520 │ 5      ║
║ getOneProposal            │ 31777           │ 31777    │ 31777  │ 31777 │ 1      ║
║ getVoter                  │ 29354           │ 29360    │ 29360  │ 29366 │ 2      ║
║ owner                     │ 23623           │ 23623    │ 23623  │ 23623 │ 1      ║
║ setVote                   │ 58073           │ 71660.11 │ 77985  │ 77985 │ 9      ║
║ startProposalsRegistering │ 95002           │ 95002    │ 95002  │ 95002 │ 14     ║
║ startVotingSession        │ 30541           │ 30541    │ 30541  │ 30541 │ 9      ║
║ tallyVotes                │ 37709           │ 48941    │ 46049  │ 65957 │ 4      ║
║ winningProposalID         │ 23534           │ 23534    │ 23534  │ 23534 │ 4      ║
║ workflowStatus            │ 23685           │ 23685    │ 23685  │ 23685 │ 1      ║
╟───────────────────────────┼─────────────────┼──────────┴────────┴───────┴────────╢
║ Deployment Cost           │ Deployment Size │                                    ║
╟───────────────────────────┼─────────────────┤                                    ║
║ 1974507                   │ 9229            │                                    ║
╚═══════════════════════════╧═════════════════╧════════════════════════════════════╝

1/  Pour que la struct Voter taille sur 1 slot, la taille de votedProposalId a été passée de 256 bits à 240 bits
 struct Voter {  
        bool isRegistered; //8 bits : 1 bytes
        bool hasVoted;      // 8 bits : 1 bytes
        uint240 votedProposalId; //il restait 240 bits dans le slot pour cette variable
    }
2/  struct Proposal {
        string description;  //casse le slot : ca créé un nouveau slot
        uint voteCount;
    }
    la structure prend 1 slot qui va etre occupé par description et elle aura besoin d'un autre slot pour voteCount.
    L'4'optimisation consiste à ne pas utiliser de string mais un bytes16 (16 bytes) et un unit32 (4bytes)
    Mais dans ce cas, la taille de la descriptio nsera probablemetn trop courte. Donc, on n'y touche aps.






# Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
