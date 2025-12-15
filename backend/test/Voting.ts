import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

//First a function to deploy the Voting contract
async function setUpSmartContract() {
  const voting = await ethers.deployContract("Voting", {
    value: 10_000_000_000_000_000n, //0.01 ETH to fund the contract
  });
  //get the accounts provided by hardhat:
  const signersRegistered = await ethers.getSigners(); //Array of SignerWithAddress objects
  const signerNotRegistered = signersRegistered.pop()!; //remove the last address. this one will not be registered. And ! to tell TS that it is not undefined

  //const owner = await voting.owner(); //give the address of the owner not the signer object

  return { voting, signersRegistered, signerNotRegistered };
}


async function setUpAddALotOfVoters() {
  const { voting, signersRegistered, signerNotRegistered } = await setUpSmartContract();

  for (const a of signersRegistered) {
    await voting.addVoter(a.address);
  }

  return { voting, signersRegistered, signerNotRegistered };
}

async function setUpAddThreeProposals() {
  const { voting, signersRegistered, signerNotRegistered } = await setUpAddALotOfVoters();
  await voting.startProposalsRegistering();
  //Add three proposals from three different registered voters
  await voting.connect(signersRegistered[0]).addProposal("Proposal 1");
  await voting.connect(signersRegistered[1]).addProposal("Proposal 2");
  await voting.connect(signersRegistered[2]).addProposal("Proposal 3");

  return { voting, signersRegistered, signerNotRegistered };
}


describe("Voting  ", function () {

  let voting: any;

  let signersRegistered: any;
  let signerNotRegistered: any;



  describe("Deployment/Storage", function () {

    this.beforeEach(async function () {
      //Before each test, we deploy a new Voting contract    
      ({ voting, signersRegistered, signerNotRegistered } = await setUpSmartContract());
    });

    it("Should have the right owner", async function () {
      expect(await voting.owner()).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    });

    it("Should get 0.01ETH", async function () {
      //Object voting does not contain his own balance. Need t10000000000000000no access it from address with ethers.provider.getBalance
      expect(await ethers.provider.getBalance(voting.getAddress())).to.equal(10_000_000_000_000_000n); //0.01 ETH
    });

    it("Should deploy with workflowStatus = RegisteringVoters ", async function () {
      expect(await voting.workflowStatus()).to.equal(0); //0 = RegisteringVoters
    });

    it("Should have an empty winningProposalId", async function () {
      expect(await voting.winningProposalID()).to.equal(0);
    });
  });







  describe("addVoter", function () {
    this.beforeEach(async function () {
      //Before each test, we deploy a new Voting contract    
      ({ voting, signersRegistered, signerNotRegistered } = await setUpSmartContract());
    });

    it("Should emit \"VoterRegistered\" event when a voter is registered", async function () {
      const signers = await ethers.getSigners(); //Array of SignerWithAddress objects

      await expect(voting.addVoter(signers[1].address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(signers[1].address);
    });

    it("Should refuse to add a registered voter", async function () {
      const signers = await ethers.getSigners(); //Array of SignerWithAddress objects
      await voting.addVoter(signers[1].address);

      await expect(voting.addVoter(signers[1].address))
        .to.be.revertedWith("Already registered");
    });
    it("Should revert if the caller is not the owner.", async function () {

      //Check unregistred address
      await expect(voting
        .connect(signersRegistered[1]) //signersRegistered[1] is not the owner.
        .addVoter(signersRegistered[1].address))
        .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount"); //It is a custom error from OpenZeppelin Ownable contract

    });
    //Voters registration is  open 
    it("Should not emit \"Voters registration is not open yet\"", async function () {

      await expect(voting.addVoter(signersRegistered[1].address)).not.to.be.revertedWith("Voters registration is not open yet");

    });

  });


  ////////////////////// GET VOTER ////////////////////////

  describe("getVoter", function () {


    //Except the last one, all the signers are added to registered voters
    this.beforeEach(async function () {
      ({ voting, signersRegistered, signerNotRegistered } = await setUpAddALotOfVoters());
    });



    it("Should revert if the caller is not a voter.", async function () {

      //Check unregistred address
      await expect(voting
        .connect(signerNotRegistered) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getVoter(signersRegistered[1].address))
        .to.be.revertedWith("You're not a voter");

    });

    it("Should return an unregistered voter : the caller is a voter but requests an unregistered address.", async function () {

      const voter = await voting
        .connect(signersRegistered[1]) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getVoter(signerNotRegistered.address);//unregistered address

      expect(voter.isRegistered).to.be.equal(false);
    });

    it("Should return an registered voter : the caller is a voter and requests a registered address.", async function () {

      const voter = await voting
        .connect(signersRegistered[1]) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getVoter(signersRegistered[2].address);//voter 2 is registered

      expect(voter.isRegistered).to.be.equal(true);

    });
  });


  ////////////////////// GET PROPOSAL ////////////////////////

  describe("getOneProposal", function () {
    this.beforeEach(async function () {
      ({ voting, signersRegistered, signerNotRegistered } = await setUpAddThreeProposals());
    });

    /* not implemented in the contract
          it("Should revert if there is no proposal.", async function () {
    
            await expect(voting
              .connect(signersRegistered[1]) //"connect" to put signer in msg.sender for the modifier onlyVoters
              .getOneProposal(0)) //no proposal yet
              .to.be.revertedWith("Proposal not found");
          });*/

    it("Should revert if the caller is not a voter.", async function () {

      //Check unregistred address
      await expect(voting
        .connect(signerNotRegistered) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getOneProposal(0))
        .to.be.revertedWith("You're not a voter");
    });

    /* not implemented in the contract
    it("Should revert if the proposal id is >= proposals.length", async function () {

      await expect(voting
        .connect(signersRegistered[1]) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getOneProposal(10)) //no proposal yet
        .to.be.revertedWith("Proposal not found");
    });*/

    it("Should return the proposal", async function () {

      const proposal1 = await voting
        .connect(signersRegistered[2]) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .getOneProposal(1); //first proposal

      expect(proposal1.description).to.equal("Proposal 1");

    }



    );
  });

  ////////////////////// ADD PROPOSAL ////////////////////////

  describe("addProposal", function () {

    this.beforeEach(async function () {
      ({ voting, signersRegistered, signerNotRegistered } = await setUpAddALotOfVoters());
    });

    it("Should revert if the caller is not a voter.", async function () {

      await expect(voting
        .connect(signerNotRegistered) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .addProposal("Proposal 1"))
        .to.be.revertedWith("You're not a voter");
    });


    it("Should emit \"Proposal are not allowed yet\"", async function () {
      await expect(voting.connect(signersRegistered[1]).addProposal("Proposal 1")).to.be.revertedWith("Proposals are not allowed yet");
    });

    it("Should accept a proposal", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.connect(signersRegistered[1]).addProposal("Proposal 1")).to.emit(voting, "ProposalRegistered").withArgs(1);
    });

    it("Should refuse an empty proposal", async function () {
      await voting.startProposalsRegistering();
      await expect(voting.connect(signersRegistered[1]).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });


  });


  ////////////////////// SET VOTE ////////////////////////

  describe("setVote", function () {

    this.beforeEach(async function () {
      ({ voting, signersRegistered, signerNotRegistered } = await setUpAddThreeProposals());
      await voting.endProposalsRegistering();

    });


    //onlyVoter
    it("Should revert if the caller is not a voter.", async function () {
      await voting.startVotingSession();
      await expect(voting
        .connect(signerNotRegistered) //"connect" to put signer in msg.sender for the modifier onlyVoters
        .setVote(1))
        .to.be.revertedWith("You're not a voter");
    });


    //require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
    it("Should emit \"Voting session havent started yet\"", async function () {
      await expect(voting.connect(signersRegistered[1]).setVote(1)).to.be.revertedWith("Voting session havent started yet");
    });



    //  require(voters[msg.sender].hasVoted != true, 'You have already voted');
    it("Should emit \"You have already voted\" ", async function () {
      await voting.startVotingSession();
      await voting.connect(signersRegistered[1]).setVote(1);
      await expect(voting.connect(signersRegistered[1]).setVote(1)).to.be.revertedWith("You have already voted");
    });


    //  emit Voted(msg.sender, _id);
    it("Should accept a vote", async function () {
      await voting.startVotingSession();
      await expect(voting.connect(signersRegistered[1]).setVote(1)).to.emit(voting, "Voted").withArgs(signersRegistered[1].address, 1);
    });


    //  require(_id < proposalsArray.length, 'Proposal not found'); // pas obligé, et pas besoin du >0 car uint
    it("Should not accept an invalid proposal ID", async function () {
      await voting.startVotingSession();
      await expect(voting.connect(signersRegistered[1]).setVote(25)).to.be.revertedWith("Proposal not found");
    });
  });


  ////////////////////// STATE ////////////////////////

  describe("Workflow", function () {
    this.beforeEach(async function () {
      //Before each test, we deploy a new Voting contract    
      ({ voting, signersRegistered, signerNotRegistered } = await setUpSmartContract());
    });

    it("Should allow only the owner to change state", async function () {
      await expect(voting.connect(signersRegistered[1]).startProposalsRegistering()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
      await expect(voting.connect(signersRegistered[1]).endProposalsRegistering()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
      await expect(voting.connect(signersRegistered[1]).startVotingSession()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
      await expect(voting.connect(signersRegistered[1]).endVotingSession()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
      await expect(voting.connect(signersRegistered[1]).tallyVotes()).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });

    it("Should revert if the workflow order is not respected", async function () {

      await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
      await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
      await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");



      await voting.startProposalsRegistering();
      await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
      await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
      await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");


      await voting.endProposalsRegistering();
      await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
      await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
      await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");


      await voting.startVotingSession();
      await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
      await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
      await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
      await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");


      await voting.endVotingSession();
      await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now");
      await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
      await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
      await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");


    });

    it("Should go through all workflow steps", async function () {
      await expect(voting.startProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(0, 1);
      await expect(voting.endProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(1, 2);
      await expect(voting.startVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(2, 3);
      await expect(voting.endVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(3, 4);
      await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(4, 5);
    });
  });

  ////////////////////// TALLY VOTES ////////////////////////
  describe("tallyVotes", function () {

    this.beforeEach(async function () {
      ({ voting, signersRegistered, signerNotRegistered } = await setUpAddThreeProposals());
    });

    //onlyVoter: tested with workflow tests



    it("Should tally votes and declare the winner", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();

      //Four voters vote for three different proposals. Proposal 2 will win.
      await voting.connect(signersRegistered[0]).setVote(0); //voter 0 votes for proposal 0
      await voting.connect(signersRegistered[1]).setVote(1); //voter 1 votes for proposal 1
      await voting.connect(signersRegistered[2]).setVote(2); //voter 2 votes for proposal 2
      await voting.connect(signersRegistered[3]).setVote(2); //voter 3 votes for proposal 2

      await voting.endVotingSession();

      await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(4, 5);

      const winningProposalID = await voting.winningProposalID();
      //In this case of a tie, the winner is the proposal with the lowest ID
      expect(winningProposalID).to.equal(2);
    });

    it("Should tally votes and declare the first tied proposal as the winner", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();

      //Three voters vote for three different proposals. Proposals are tied.
      await voting.connect(signersRegistered[0]).setVote(0); //voter 0 votes for proposal 0
      await voting.connect(signersRegistered[1]).setVote(1); //voter 1 votes for proposal 1
      await voting.connect(signersRegistered[2]).setVote(2); //voter 2 votes for proposal 2

      await voting.endVotingSession();

      await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(4, 5);

      const winningProposalID = await voting.winningProposalID();
      //In this case of a tie, the winner is the proposal with the lowest ID
      expect(winningProposalID).to.equal(0);
    });

    it("Should return Genesis proposal if there is no vote", async function () {
      await voting.endProposalsRegistering();
      await voting.startVotingSession();
      await voting.endVotingSession();

      await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(4, 5);
      const winningProposalID = await voting.winningProposalID();
      expect(winningProposalID).to.equal(0);
    });
  });
});