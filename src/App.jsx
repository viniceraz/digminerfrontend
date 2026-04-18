import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { ethers } from "ethers";
import { MINERPOOL_ABI, PATHUSD_ABI, CONTRACTS } from "./contracts";

const RARITIES = [
  { id:0, name:"Common",    chance:"30%", dailyMin:18, dailyMax:20, nftAge:19, repair:0.24, color:"#9E9E9E", bg:"#3a3a3a" },
  { id:1, name:"UnCommon",  chance:"30%", dailyMin:21, dailyMax:23, nftAge:17, repair:0.40, color:"#4CAF50", bg:"#1b3a1b" },
  { id:2, name:"Rare",      chance:"18%", dailyMin:24, dailyMax:26, nftAge:15, repair:0.60, color:"#2196F3", bg:"#1a2940" },
  { id:3, name:"Super Rare",chance:"8%",  dailyMin:27, dailyMax:30, nftAge:14, repair:0.80, color:"#E91E63", bg:"#3a1a2a" },
  { id:4, name:"Legendary", chance:"4%",  dailyMin:31, dailyMax:35, nftAge:13, repair:1.00, color:"#FF9800", bg:"#3a2a10" },
  { id:5, name:"Mythic",    chance:"2%",  dailyMin:36, dailyMax:42, nftAge:11, repair:1.50, color:"#9C27B0", bg:"#2a1a3a" },
];
const BOX_PRICE=300; const BOX_10_PRICE=2850; const DIG_RATE=100; const PLAY_ALL_FEE=5;
const FUSE_COST=50;
const LAND_BOX_PRICE=300; const LAND_BOX_10_PRICE=2550;
const AUTO_PICKAXE_PRICE=3000; const AUTO_PICKAXE_MAX=500;
const LAND_RARITIES=[
  {id:0,name:"Common",    chance:"35%",boostPercent:5, minerSlots:2,color:"#9E9E9E",bg:"#3a3a3a"},
  {id:1,name:"UnCommon",  chance:"28%",boostPercent:10,minerSlots:3,color:"#4CAF50",bg:"#1b3a1b"},
  {id:2,name:"Rare",      chance:"18%",boostPercent:15,minerSlots:4,color:"#2196F3",bg:"#1a2940"},
  {id:3,name:"Super Rare",chance:"10%",boostPercent:20,minerSlots:5,color:"#E91E63",bg:"#3a1a2a"},
  {id:4,name:"Legendary", chance:"6%", boostPercent:25,minerSlots:6,color:"#FF9800",bg:"#3a2a10"},
  {id:5,name:"Mythic",    chance:"3%", boostPercent:35,minerSlots:8,color:"#9C27B0",bg:"#2a1a3a"},
];
const LAND_IMGS=["/landsimgs/land1.png","/landsimgs/land2.png","/landsimgs/land3.png","/landsimgs/land4.png","/landsimgs/land5.png","/landsimgs/land6.png"];

const LangCtx = createContext('en');
const T = {
  en:{
    tabAccount:"My Account",tabNft:"My NFT",tabShop:"Shop",tabCalc:"Calculator",tabHow:"How It Works",tabAdmin:"⚙️ Admin",
    marketplace:"🏪 Marketplace",marketplaceSoon:"SOON",marketplaceNotify:"Marketplace coming soon! Stay tuned.",
    connect:"Connect",connecting:"Connecting...",connectWallet:"CONNECT WALLET",connectingWallet:"CONNECTING...",
    connectSubtitle:"Mine. Earn. Withdraw. Powered by Tempo.",connectRequires:"Requires MetaMask + Tempo Mainnet",disconnectTitle:"Disconnect wallet",
    langBtn:"🇨🇳 中文",
    statsPool:"pathUSD Pool",statsNft:"Miners",statsPlayers:"Players",statsWithdrawn:"Withdrawn",statsNetwork:"Tempo Mainnet",
    walletAddress:"Wallet Address",pathUSDBalance:"pathUSD Balance",digcoinBalance:"DIGCOIN Balance",miners:"Miners",
    idle:"idle",mining:"mining",ready:"ready",starting:"Starting...",claiming:"Claiming...",
    mineAllBtn:(n)=>`⛏️ Mine All (${n})`,claimAllBtn:(n)=>`💎 Claim All (${n})`,
    referralLink:"Your Referral Link",referralCopied:"Referral link copied!",
    depositTitle:"Deposit pathUSD",depositDesc:"Approve + deposit on Tempo blockchain → DIGCOIN credited",
    withdrawTitle:"Withdraw",withdrawFee:"(6% fee)",withdrawDesc:"Backend signs → you receive pathUSD on-chain",
    processing:"Processing...",deposit:"Deposit",withdraw:"Withdraw",
    withdrawCooldownMsg:"⏳ 1 withdraw per 24h — next in",
    txHistory:"Transaction History",refresh:"Refresh",noTx:"No transactions yet",
    colDate:"Date",colType:"Type",colDetail:"Detail",colAmount:"Amount",
    all:"All",noMiners:"No miners yet. Buy a Box in the Shop!",
    fuseMiners:"🔥 Fuse Miners",cancelFuse:"✕ Cancel Fuse",fuseModeTitle:"🔥 Fuse Mode — Select 2 Same-Rarity Miners",
    fuseModeDesc:(c)=>`Cost: ${c} DC · Same rarity only · Result = +1 tier with boosted daily · One-time fusion`,
    fusingNow:(c)=>`🔥 Fuse Now (${c} DC)`,fusing:"Fusing...",selectedOf2:(n)=>`${n}/2 selected`,
    cantFuseMining:"Can't fuse a miner that is currently mining. Claim first.",
    cantFuseFused:"This miner has already been fused and cannot be fused again.",
    cantFuseDiffRarity:(r)=>`Both miners must be the same rarity. First selected is ${r}.`,
    cantFuseMythic:"Mythic miners are already the highest tier and cannot be fused.",
    fusedBadge:"FUSED",
    selectExactly2:"Select exactly 2 miners to fuse.",needDCToFuse:(c)=>`Need ${c} DIGCOIN to fuse.`,
    mcMining:"MINING",mcReady:"READY",mcIdle:"IDLE",mcRepair:"REPAIR",
    mcMine:"⛏️ Mine",mcClaim:"💎 Claim",mcRepairBtn:"🔧 Repair",mcLifespan:"Lifespan",mcDaily:"Daily",
    mcMiningState:"Mining...",mcClaimingState:"Claiming...",mcRepairingState:"Repairing...",mcCyclesLeft:"cycles left",
    buyBox:"Buy Mystery Box",opening:"Opening...",discount5:"(5% OFF)",balance:"Balance:",
    nftStats:"NFT Stats",colNft:"NFT",colDaily:"Daily",colRoi:"ROI",colAge:"Age",colRepair:"Repair",colDays:"days",
    farmStats:"📊 Your Farm Stats",farmStatsDesc:(n)=>`${n} active miners · 100 DC = 1 pathUSD`,
    noActiveMiners:"No active miners yet. Buy boxes in the Shop!",
    dailyIncome:"Daily Income",weeklyIncome:"Weekly Income",monthlyIncome:"Monthly Income",
    calcMiner:"Miner",calcRarity:"Rarity",calcDailyDC:"Daily DC",calcDailyUSD:"Daily USD",
    calcMonthlyDC:"Monthly DC",calcMonthlyUSD:"Monthly USD",calcLifespan:"Lifespan Left",calcRemaining:"Total Remaining",
    calcTotal:"TOTAL",calcAcross:(n)=>`across ${n} miners`,
    simulator:"🧮 Miner Simulator",simulatorDesc:"Simulate how much you would earn with any combination of miners.",
    simResult:"Simulation Result",simDaily:"Daily",simWeekly:"Weekly",simMonthly:"Monthly",
    boxCost:"Box Cost",roiLabel:"ROI",totalReturn:"Total Return",addMiners:"Add miners above to see the simulation",
    revealGetting:"Getting ready...",fusionResult:"⚗️ FUSION RESULT",revealNew:"NEW MINER UNLOCKED!",
    revealRarity:"Rarity",revealDaily:"Daily",revealLifespan:"Lifespan",revealCycles:"cycles",revealClose:"Awesome!",fusingAnim:"FUSING...",
    notifyMining:"⛏️ Mining started! Come back in 24h to claim.",
    notifyMiners:(n,f)=>`⛏️ ${n} miners started! Fee: ${f} DC. Claim in 24h.`,
    notifyClaimed:(dc)=>`💎 +${dc} DIGCOIN claimed!`,
    notifyClaimedAll:(net,cnt,fee)=>`💎 Claimed! +${net} DC net | ${cnt} miners | fee: ${fee} DC`,
    notifyRepaired:(dc)=>`Repaired! -${dc} DIGCOIN`,
    maintenance:"Under Maintenance",maintenanceDesc:"We're upgrading the game to bring you something even better.",maintenanceSoon:"Come back soon — it won't take long!",
    roadmap:"Roadmap",footer:"DigMiner © 2026 • Powered by Tempo Blockchain",
    adminMaintTitle:"🔧 Maintenance Mode",adminMaintDesc:"When enabled, all game actions are blocked for every player.",
    gameDown:"⚠️ GAME IS DOWN",gameLive:"✅ Game is Live",updating:"Updating...",bringOnline:"🟢 Bring Game Back Online",putMaintenance:"🔴 Put Game in Maintenance",
    sendDigcoin:"💸 Send DIGCOIN",sendDesc:"Send DIGCOIN directly to any wallet — for giveaways, influencers, or payments.",
    walletAddr:"Wallet Address",amountDigcoin:"Amount (DIGCOIN)",reasonOptional:"Reason (optional)",sending:"Sending...",sendBtn:"Send 💸",
    recentSends:"Recent Sends",adminWallet:"Wallet",adminAmount:"Amount",adminReason:"Reason",adminTime:"Time",
    allPlayers:"👥 All Players",top100:"Top 100 by DIGCOIN balance",loadPlayers:"Load Players",clickLoad:'Click "Load Players" to view',
    colWallet:"Wallet",colBalance:"Balance (DC)",colDeposited:"Deposited ($)",colEarned:"Earned (DC)",colBoxes:"Boxes",colJoined:"Joined",
    roadmapTitle:"🗺️ DigMiner Roadmap",roadmapSubtitle:"What we've built — and what's coming next.",roadmapDisclaimer:"Roadmap is subject to change. Follow us for updates.",
    howNavIntro:"Introduction",howNavStart:"Quick Start",howNavBoxes:"Mystery Boxes",howNavRarities:"Rarities",
    howNavMining:"Mining Cycle",howNavLifespan:"Lifespan & Repair",howNavFusion:"Fusion",howNavLands:"Lands",
    howNavWithdraw:"Withdrawals",howNavReferral:"Referrals",howNavRoi:"ROI Table",howNavFaq:"FAQ",howNavAutoPickaxe:"Auto Pickaxe",
    howIntroTitle:"What is DigMiner?",howIntroP1:"DigMiner is a Click-to-Earn game running on the Tempo Mainnet blockchain. You deposit real pathUSD, buy NFT miners, run 24-hour mining cycles, and withdraw your earnings.",howIntroP2:"The core loop: Deposit → Buy Boxes → Mine → Claim → Withdraw. The rarer your miner, the more it earns and the longer it lasts.",howIntroTip:"You don't pay gas fees to mine or claim. Only deposits and withdrawals touch the blockchain — everything else is instant and free.",
    howStatExchange:"Exchange Rate",howStatBox:"Box Price",howStatBulk:"Bulk (10x)",howStatFee:"Withdraw Fee",howStatRef:"Referral Bonus",howStatBatch:"Batch Fee",
    howStartTitle:"Quick Start Guide",howStartSteps:[["Connect your wallet","Click Connect Wallet and approve in MetaMask or Rabby. No gas needed."],["Switch to Tempo Mainnet","The app will prompt you to add and switch to the Tempo network automatically."],["Sign the auth message","Sign a free off-chain message to prove wallet ownership. Valid for 24 hours."],["Deposit pathUSD","My Account → Deposit. Approve the token and confirm. DIGCOIN appears instantly."],["Buy a Mystery Box","Shop → Buy Box. 300 DC for 1, or 2850 DC for 10 (5% discount)."],["Start Mining","In My NFT tab, click ⛏️ Mine on your miner. Return in 24 hours."],["Claim & Withdraw","Click 💎 Claim after 24h. When ready, withdraw from My Account → Withdraw."]],
    howBoxesTitle:"Mystery Boxes",howBoxesP1:"Each Mystery Box contains 1 random NFT miner. Rarity is determined at opening — you cannot choose which one you get.",howBoxesP2:"After purchase, an animation reveals your miner. It appears immediately in the NFT tab, ready to mine.",howBoxesSingle:"SINGLE BOX",howBoxesBulk:"x10 BOXES",howBoxesBestValue:"BEST VALUE",howBoxesSingleSub:"= 3 pathUSD",howBoxesBulkSub:"5% discount — saves 150 DC",howBoxesTip:"Each box roll is independent. Buying 10 boxes does not guarantee any specific rarity — you get 10 separate random outcomes.",
    howRaritiesTitle:"Miner Rarities",howRaritiesP:"There are 6 rarity tiers. Rarer miners earn more DIGCOIN per day and have longer lifespans, but lower drop chances.",howRaritiesChance:"chance",howRaritiesDay:"DC/day",howRaritiesDays:"day lifespan",howRaritiesWarn:"A Mythic miner earns ~39 DC/day but only lasts 11 cycles (429 DC total). A Common earns ~19 DC/day over 19 cycles (361 DC total). Mythic yields about 19% more total DIGCOIN — the real advantage is the higher daily rate, which pays back the box cost much faster.",
    howMiningTitle:"The Mining Cycle",howMiningP:"Every miner moves through a simple 3-state cycle. Mastering this loop is the key to maximizing daily earnings.",howMiningStates:[["💤","Idle","Miner is waiting. Click ⛏️ Mine to start the 24-hour cycle.","#888"],["⛏️","Mining","Countdown running. Come back when the timer hits 0.","#4CAF50"],["✅","Ready to Claim","Mining complete! Click 💎 Claim to collect your reward.","#FF9800"]],howMiningBatchTitle:"⚡ Mine All & Claim All",howMiningBatchP:"Manage all your miners at once with the batch buttons on the My NFT tab.",howMiningBatchTip:"Convenience fee: 5 DIGCOIN per miner for batch actions. With 5 miners, Mine All or Claim All costs 25 DC. Fee is deducted before processing.",howMiningBatchNote:"After claiming, each miner returns to Idle. You must click Mine again to start the next cycle — earnings don't accumulate passively.",
    howLifespanTitle:"Lifespan & Repair",howLifespanP:"Each miner has a finite lifespan in mining cycles. Every successful claim decreases the lifespan counter by 1.",howLifespanWhenTitle:"📉 When lifespan hits 0",howLifespanWhenItems:"• The miner stops mining\n• A ⚠️ icon appears on the card\n• Repair it to restore full lifespan\n• Or let it retire permanently",howLifespanRepairTitle:"🔧 Repair Cost by Rarity",howLifespanTip:"Repair resets to the original full lifespan. You can repair unlimited times — a miner never permanently dies unless you choose not to repair it.",
    howFusionTitle:"Fusion",howFusionP:"Fusion lets you sacrifice 2 same-rarity miners to forge a stronger one at the next tier. Both originals are permanently destroyed. The result keeps the parents' lifespan and earns 20% more than both parents combined.",howFusionWarn:(c)=>`Cost: ${c} DIGCOIN per fusion · Same rarity only · Both miners must be Idle · Fused miners cannot be fused again`,howFusionRuleTitle:"⚗️ Fusion Formula",howFusionTableTitle:"📈 All Possible Outcomes",howFusionColA:"Miner A",howFusionColB:"Miner B",howFusionColResult:"Result",howFusionColDaily:"Daily (example)",howFusionColLifespan:"Lifespan",howFusionHowTitle:"🔥 How to Fuse",howFusionSteps:[["Go to My NFT tab","Make sure the 2 miners you want to fuse are both Idle (not mining)."],["Click 🔥 Fuse Miners","A purple banner appears. Only idle, non-fused miners of the same rarity can be selected."],["Select 2 same-rarity miners","Click 2 cards of the same rarity — they highlight with a purple border."],["Click 🔥 Fuse Now (50 DC)","50 DC is deducted, both miners are destroyed, and a stronger one is created."],["Watch the reveal animation","A special ⚗️ Fusion Result screen shows your new miner's boosted stats."]],howFusionTip:"Best strategy: fuse miners with high daily rolls to maximize the boosted output. Two Common miners rolling 20 DC each will produce an UnCommon at 48 DC/day — more than double a normal UnCommon.",
    howWithdrawTitle:"Withdrawals",howWithdrawP:"Convert your DIGCOIN to pathUSD and withdraw to your wallet. Withdrawals are signed by the server and executed on-chain via the MinerPool smart contract.",howWithdrawExTitle:"💸 Example — Withdrawing 1000 DIGCOIN",howWithdrawRows:[["You request","1000 DIGCOIN",false],["Converted to","10 pathUSD",false],["6% protocol fee","−0.60 pathUSD",false],["You receive","9.40 pathUSD",true]],howWithdrawWarn:"Rules: 24h cooldown between withdrawals • Minimum 100 DIGCOIN (1 pathUSD) • 6% fee on every withdrawal. Fee stays in the reward pool.",
    howReferralTitle:"Referral Program",howReferralP:"Share your unique referral link and earn 4% of every deposit your referred friends make — instantly credited to your DIGCOIN balance.",howReferralYourLink:"Your Referral Link",howReferralFindLink:"Find your personalized link in the My Account tab after connecting.",howReferralSteps:[["1","Share your link","Post on social media, groups, or send to friends directly"],["2","Friend deposits","They connect and deposit pathUSD into the game"],["3","You earn 4%","Auto-credited to your DIGCOIN balance instantly"]],howReferralTip:"No cap on referrals. Every deposit your referrals make earns you 4% — indefinitely, with no extra effort required.",
    howRoiTitle:"ROI & Full Statistics",howRoiP:"Complete breakdown of all 6 miner types — earnings, returns, and ROI based on a single box price of 300 DC.",howRoiCols:["Miner","Chance","Daily Range","Avg/Day","ROI","Lifespan","Total Return","Repair"],howRoiTip:"ROI is calculated from the box price (300 DC). After ROI, all further earnings are pure profit until the miner retires.",howRoiPortTitle:"📈 Example 10-Box Portfolio",howRoiPortItems:"Avg luck: 3 Common, 3 UnCommon, 2 Rare, 1 Super Rare, 1 Legendary\nDaily income: ~255 DC/day ≈ 2.55 pathUSD\nInvestment: 2850 DC (bulk)\nEstimated ROI: ~12 days\nProfit over full lifespan: ~9000–12000 DC",
    howFaqTitle:"Frequently Asked Questions",howFaqItems:[["Do I pay gas to mine or claim?","No. Mining and claiming are off-chain. Gas only applies to deposits and withdrawals on Tempo."],["What if I forget to claim for more than 24h?","Nothing happens. Rewards stay pending indefinitely. The miner only loses 1 lifespan day per successful claim, not per day elapsed."],["Can I own multiple miners of the same rarity?","Yes. Own as many as you want — all mine independently and simultaneously."],["Is there a limit to how many boxes I can buy?","No limit. Buy as many as your DIGCOIN balance allows."],["What is pathUSD?","pathUSD is a USD-pegged stablecoin on the Tempo blockchain. 1 pathUSD ≈ $1 USD."],["Can I use Rabby Wallet?","Yes. Rabby is fully compatible — it uses the same window.ethereum interface as MetaMask."],["What happens if I switch accounts in MetaMask?","The game logs you out automatically for security. Connect and sign again with the new wallet."],["Is the 6% withdraw fee negotiable?","No. The fee is fixed and goes back into the reward pool to sustain the game economy."],["Can I repair a miner more than once?","Yes, unlimited times. Repair always resets to the original full lifespan."],["Why do I need to sign a message on login?","The signature proves you own the wallet without spending gas. Only you can modify your account."]],
    howFooter:"DigMiner © 2026 • Powered by Tempo Blockchain",
    landBoxTitle:"Mystery Land Box",landBoxDesc:"Own a plot of land to permanently boost your miners' daily DIGCOIN production. Each land has a rarity that determines the boost and number of miner slots.",
    landSaleCountdown:(h,m,s)=>`Sale opens in: ${h}h ${m}m ${s}s`,landSaleOpen:"🌍 Land Sale is OPEN!",
    landBuyBtn:(n)=>`Buy Land Box (${n} DC)`,
    colLand:"Land",colBoost:"Farm Boost",colSlots:"Miner Slots",colLandChance:"Chance",
    landStatsTitle:"Land Stats",myLands:"My Lands",
    noLands:"No lands yet. Buy a Land Box in the Shop!",
    landAssignBtn:"Assign Miner",landUnassignBtn:"Unassign",landSlotFree:"Empty Slot",
    landAssignTitle:"Select an idle miner to assign:",landAssignCancel:"Cancel",landAssignNoIdle:"No idle unassigned miners available.",
    landAssigning:"Assigning...",landUnassigning:"Unassigning...",
    howLandsTitle:"Lands",
    howLandsP:"Lands are permanent plots that boost your miners' daily DIGCOIN income. Assign idle miners to your land and the boost is applied automatically every time you claim.",
    howLandsSteps:[["Buy a Land Box in the Shop","Go to the Shop tab and buy a Land Box for 400 DC. Rarity is random — same chances as mystery boxes."],["Assign Idle Miners to Your Land","In My NFT tab, open your land card and click Assign Miner. Only IDLE miners can be assigned."],["Mine and Claim as Normal","Start mining and claim rewards as usual. The land boost is applied automatically at claim time."],["Unassign Anytime (Idle Only)","Move miners between lands freely — but only when they are IDLE (not actively mining)."]],
    howLandsTip:"A miner assigned to a Mythic Land earns 35% more per claim. Multiple lands let you boost all your miners simultaneously.",
    howLandsTableTitle:"📊 All Land Rarities",howLandsColRarity:"Rarity",howLandsColBoost:"Boost",howLandsColSlots:"Slots",howLandsColChance:"Chance",
    howLandsWarn:(p)=>`Land boost is applied at claim time. Example: a 25 DC/day miner on a 20% Legendary Land earns ${(25*1.2).toFixed(1)} DC per claim.`,
    howAutoPickaxeTitle:"Auto Pickaxe",
    howAutoPickaxeP:"The Auto Pickaxe is a one-time lifetime tool that fully automates your mining operation. Once active, the server automatically claims all your ready miners and restarts them every cycle — no app required.",
    howAutoPickaxeHowTitle:"⚙️ How It Works",
    howAutoPickaxeSteps:[
      ["Buy Once in the Shop","Go to the Shop tab and purchase the Auto Pickaxe for 3,000 DC. Supply is limited to 500 units total."],
      ["Activate the Toggle","In your My NFT tab, a banner appears with an ON/OFF toggle. Switch it ON to enable full automation."],
      ["Server Does Everything","Every hour the server checks all active Auto Pickaxe holders. If your miners are ready (24h passed) it claims them and restarts mining immediately."],
      ["Toggle OFF Anytime","Want to manage manually? Just toggle OFF. Fees apply again when OFF, exactly like normal play."],
    ],
    howAutoPickaxePerksTitle:"⚡ Perks at a Glance",
    howAutoPickaxePerks:[
      ["🤖","Full Automation","Claims and restarts all miners automatically every cycle. You never need to open the app."],
      ["💸","Zero Fees Forever","Mine All & Claim All fees are permanently waived while the toggle is ON. Saves 10 DC per miner per cycle."],
      ["🔁","Full Control","Toggle ON/OFF at any time from the My NFT tab. Your choice, always."],
      ["♾️","Lifetime Access","One-time purchase — no subscriptions, no renewals, works as long as you play."],
      ["🔒","Exclusive Supply","Only 500 ever available. Once sold out it cannot be purchased again."],
    ],
    howAutoPickaxeTip:"With 30 miners and the Auto Pickaxe active, you save 300 DC in fees every single day — that's 9,000 DC/month back in your pocket.",
    howAutoPickaxeWarn:"The Auto Pickaxe automates the cycle but does not extend miner lifespan. Miners still retire normally after their lifespan ends.",
  },
  zh:{
    tabAccount:"我的账户",tabNft:"我的NFT",tabShop:"商店",tabCalc:"计算器",tabHow:"玩法说明",tabAdmin:"⚙️ 管理",
    marketplace:"🏪 市场",marketplaceSoon:"即将上线",marketplaceNotify:"市场即将上线！敬请期待。",
    connect:"连接钱包",connecting:"连接中...",connectWallet:"连接钱包",connectingWallet:"连接中...",
    connectSubtitle:"挖矿。赚取。提现。由 Tempo 驱动。",connectRequires:"需要 MetaMask + Tempo 主网",disconnectTitle:"断开钱包",
    langBtn:"🇺🇸 EN",
    statsPool:"pathUSD 奖池",statsNft:"Miners",statsPlayers:"玩家",statsWithdrawn:"已提现",statsNetwork:"Tempo 主网",
    walletAddress:"钱包地址",pathUSDBalance:"pathUSD 余额",digcoinBalance:"DIGCOIN 余额",miners:"矿工",
    idle:"空闲",mining:"挖矿中",ready:"可领取",starting:"启动中...",claiming:"领取中...",
    mineAllBtn:(n)=>`⛏️ 全部挖矿 (${n})`,claimAllBtn:(n)=>`💎 全部领取 (${n})`,
    referralLink:"你的推荐链接",referralCopied:"推荐链接已复制！",
    depositTitle:"充值 pathUSD",depositDesc:"授权并在 Tempo 区块链充值 → 即时到账 DIGCOIN",
    withdrawTitle:"提现",withdrawFee:"（6%手续费）",withdrawDesc:"后端签名 → 链上到账 pathUSD",
    processing:"处理中...",deposit:"充值",withdraw:"提现",
    withdrawCooldownMsg:"⏳ 每24小时提现1次 — 下次可提：",
    txHistory:"交易记录",refresh:"刷新",noTx:"暂无交易记录",
    colDate:"日期",colType:"类型",colDetail:"详情",colAmount:"金额",
    all:"全部",noMiners:"还没有矿工，去商店购买盲盒！",
    fuseMiners:"🔥 合成矿工",cancelFuse:"✕ 取消合成",fuseModeTitle:"🔥 合成模式 — 选择2个相同稀有度矿工",
    fuseModeDesc:(c)=>`费用：${c} DC · 仅限相同稀有度 · 结果 = 高一阶+收益加成 · 仅可合成一次`,
    fusingNow:(c)=>`🔥 立即合成 (${c} DC)`,fusing:"合成中...",selectedOf2:(n)=>`${n}/2 已选`,
    cantFuseMining:"无法合成正在挖矿的矿工，请先领取。",
    cantFuseFused:"该矿工已经合成过，无法再次合成。",
    cantFuseDiffRarity:(r)=>`两个矿工必须是相同稀有度。第一个选择的是 ${r}。`,
    cantFuseMythic:"神秘矿工已是最高等级，无法合成。",
    fusedBadge:"已合成",
    selectExactly2:"请选择恰好2个矿工进行合成。",needDCToFuse:(c)=>`需要 ${c} DIGCOIN 才能合成。`,
    mcMining:"挖矿中",mcReady:"可领取",mcIdle:"空闲",mcRepair:"需修复",
    mcMine:"⛏️ 挖矿",mcClaim:"💎 领取",mcRepairBtn:"🔧 修复",mcLifespan:"寿命",mcDaily:"日收益",
    mcMiningState:"挖矿中...",mcClaimingState:"领取中...",mcRepairingState:"修复中...",mcCyclesLeft:"剩余次数",
    buyBox:"购买神秘盒子",opening:"开箱中...",discount5:"（95折）",balance:"余额：",
    nftStats:"NFT 数据",colNft:"NFT",colDaily:"日收益",colRoi:"回报周期",colAge:"寿命",colRepair:"修复费",colDays:"天",
    farmStats:"📊 我的农场数据",farmStatsDesc:(n)=>`${n} 个活跃矿工 · 100 DC = 1 pathUSD`,
    noActiveMiners:"暂无活跃矿工，去商店购买盲盒！",
    dailyIncome:"日收益",weeklyIncome:"周收益",monthlyIncome:"月收益",
    calcMiner:"矿工",calcRarity:"稀有度",calcDailyDC:"日 DC",calcDailyUSD:"日 USD",
    calcMonthlyDC:"月 DC",calcMonthlyUSD:"月 USD",calcLifespan:"剩余寿命",calcRemaining:"剩余总收益",
    calcTotal:"合计",calcAcross:(n)=>`共 ${n} 个矿工`,
    simulator:"🧮 矿工模拟器",simulatorDesc:"模拟任意矿工组合的收益。",
    simResult:"模拟结果",simDaily:"日",simWeekly:"周",simMonthly:"月",
    boxCost:"盲盒成本",roiLabel:"回本周期",totalReturn:"总回报",addMiners:"在上方添加矿工以查看模拟结果",
    revealGetting:"准备中...",fusionResult:"⚗️ 合成结果",revealNew:"解锁新矿工！",
    revealRarity:"稀有度",revealDaily:"日收益",revealLifespan:"寿命",revealCycles:"次",revealClose:"太棒了！",fusingAnim:"合成中...",
    notifyMining:"⛏️ 开始挖矿！24小时后回来领取。",
    notifyMiners:(n,f)=>`⛏️ ${n}个矿工已启动！手续费：${f} DC。24小时后领取。`,
    notifyClaimed:(dc)=>`💎 +${dc} DIGCOIN 已领取！`,
    notifyClaimedAll:(net,cnt,fee)=>`💎 已领取！净得+${net} DC | ${cnt}个矿工 | 手续费：${fee} DC`,
    notifyRepaired:(dc)=>`修复完成！-${dc} DIGCOIN`,
    maintenance:"系统维护中",maintenanceDesc:"我们正在升级游戏，为您带来更好的体验。",maintenanceSoon:"请稍后回来——不会太久的！",
    roadmap:"路线图",footer:"DigMiner © 2026 • 由 Tempo 区块链驱动",
    adminMaintTitle:"🔧 维护模式",adminMaintDesc:"启用后，所有玩家的游戏操作将被阻止。",
    gameDown:"⚠️ 游戏已停机",gameLive:"✅ 游戏运行中",updating:"更新中...",bringOnline:"🟢 恢复游戏在线",putMaintenance:"🔴 进入维护模式",
    sendDigcoin:"💸 发送 DIGCOIN",sendDesc:"直接向任意钱包发送 DIGCOIN — 用于抽奖、推广或支付。",
    walletAddr:"钱包地址",amountDigcoin:"数量（DIGCOIN）",reasonOptional:"原因（可选）",sending:"发送中...",sendBtn:"发送 💸",
    recentSends:"最近发送",adminWallet:"钱包",adminAmount:"数量",adminReason:"原因",adminTime:"时间",
    allPlayers:"👥 所有玩家",top100:"按 DIGCOIN 余额前100名",loadPlayers:"加载玩家",clickLoad:"点击「加载玩家」查看",
    colWallet:"钱包",colBalance:"余额(DC)",colDeposited:"充值($)",colEarned:"已赚(DC)",colBoxes:"盲盒",colJoined:"加入时间",
    roadmapTitle:"🗺️ DigMiner 路线图",roadmapSubtitle:"我们已完成的 — 以及接下来的计划。",roadmapDisclaimer:"路线图可能会有所调整，请关注我们获取最新动态。",
    howNavIntro:"游戏介绍",howNavStart:"快速开始",howNavBoxes:"神秘盒子",howNavRarities:"稀有等级",
    howNavMining:"挖矿循环",howNavLifespan:"寿命与修复",howNavFusion:"合成",howNavLands:"土地",
    howNavWithdraw:"提现",howNavReferral:"推荐计划",howNavRoi:"ROI 表格",howNavFaq:"常见问题",
    howIntroTitle:"什么是 DigMiner？",howIntroP1:"DigMiner 是一款运行在 Tempo 主网区块链上的点击赚钱游戏。您充值真实的 pathUSD，购买 NFT 矿工，开启24小时挖矿循环，并提取收益。",howIntroP2:"核心玩法：充值 → 购买盲盒 → 挖矿 → 领取 → 提现。矿工越稀有，收益越高，寿命越长。",howIntroTip:"挖矿和领取无需支付 Gas 费用。只有充值和提现才会触发区块链交易 — 其他操作即时且免费。",
    howStatExchange:"汇率",howStatBox:"盲盒价格",howStatBulk:"批量 (10个)",howStatFee:"提现手续费",howStatRef:"推荐奖励",howStatBatch:"批量手续费",
    howStartTitle:"快速开始指南",howStartSteps:[["连接钱包","点击连接钱包并在 MetaMask 或 Rabby 中确认，无需 Gas 费用。"],["切换到 Tempo 主网","应用会自动提示您添加并切换到 Tempo 网络。"],["签署验证消息","签署一条免费的链下消息以证明钱包所有权，有效期24小时。"],["充值 pathUSD","我的账户 → 充值。授权代币并确认，DIGCOIN 即时到账。"],["购买神秘盒子","商店 → 购买盲盒。单个300 DC，或10个2850 DC（95折）。"],["开始挖矿","在我的NFT标签中，点击矿工上的 ⛏️ 挖矿。24小时后回来。"],["领取并提现","24小时后点击 💎 领取。准备好后，在我的账户 → 提现。"]],
    howBoxesTitle:"神秘盒子",howBoxesP1:"每个神秘盒子包含1个随机 NFT 矿工。稀有度在开箱时决定 — 您无法选择获得哪种矿工。",howBoxesP2:"购买后，动画将展示您的矿工。它会立即出现在 NFT 标签中，随时可以开始挖矿。",howBoxesSingle:"单个盲盒",howBoxesBulk:"10个盲盒",howBoxesBestValue:"最优惠",howBoxesSingleSub:"= 3 pathUSD",howBoxesBulkSub:"95折 — 节省150 DC",howBoxesTip:"每次开箱结果独立。购买10个盲盒不保证获得特定稀有度 — 您将获得10个独立的随机结果。",
    howRaritiesTitle:"矿工稀有等级",howRaritiesP:"共有6个稀有等级。越稀有的矿工每天赚取越多 DIGCOIN，寿命越长，但掉落概率越低。",howRaritiesChance:"概率",howRaritiesDay:"DC/天",howRaritiesDays:"天寿命",howRaritiesWarn:"神秘矿工每天约赚取39 DC，但寿命仅11次（总计429 DC）。普通矿工每天约赚取19 DC，寿命19次（总计361 DC）。神秘矿工总 DIGCOIN 约多19% — 真正的优势在于更高的日收益率，能更快回本。",
    howMiningTitle:"挖矿循环",howMiningP:"每个矿工经历简单的3状态循环。掌握这个循环是最大化每日收益的关键。",howMiningStates:[["💤","空闲","矿工等待中，点击 ⛏️ 挖矿开启24小时循环。","#888"],["⛏️","挖矿中","倒计时进行中，计时器归零后回来。","#4CAF50"],["✅","可领取","挖矿完成！点击 💎 领取收集奖励。","#FF9800"]],howMiningBatchTitle:"⚡ 全部挖矿 & 全部领取",howMiningBatchP:"通过我的NFT标签上的批量按钮一次管理所有矿工。",howMiningBatchTip:"批量操作便利费：每个矿工10 DIGCOIN。5个矿工时，全部挖矿或全部领取花费50 DC，费用在处理前扣除。",howMiningBatchNote:"领取后，每个矿工回到空闲状态。您必须再次点击挖矿开始下一个循环 — 收益不会被动累积。",
    howLifespanTitle:"寿命与修复",howLifespanP:"每个矿工的寿命以挖矿次数计算。每次成功领取会将寿命计数器减少1。",howLifespanWhenTitle:"📉 寿命归零时",howLifespanWhenItems:"• 矿工停止挖矿\n• 卡片上出现 ⚠️ 图标\n• 修复以恢复完整寿命\n• 或让其永久退役",howLifespanRepairTitle:"🔧 各稀有度修复费用",howLifespanTip:"修复会重置为原始完整寿命。您可以无限次修复 — 矿工永远不会永久死亡，除非您选择不修复它。",
    howFusionTitle:"合成",howFusionP:"合成允许您牺牲2个相同稀有度的矿工，锻造一个更高阶的更强矿工。两个原始矿工永久销毁，结果矿工保留父矿工的寿命，日收益比两个父矿工合计多20%。",howFusionWarn:(c)=>`费用：${c} DIGCOIN · 仅限相同稀有度 · 两个矿工必须处于空闲状态 · 合成矿工不可再次合成`,howFusionRuleTitle:"⚗️ 合成公式",howFusionTableTitle:"📈 所有可能结果",howFusionColA:"矿工 A",howFusionColB:"矿工 B",howFusionColResult:"结果",howFusionColDaily:"日收益（示例）",howFusionColLifespan:"寿命",howFusionHowTitle:"🔥 如何合成",howFusionSteps:[["前往我的NFT标签","确保要合成的2个矿工均处于空闲状态（未在挖矿）。"],["点击 🔥 合成矿工","出现紫色横幅，仅空闲、相同稀有度、未合成过的矿工可被选择。"],["选择2个相同稀有度矿工","点击2张相同稀有度的卡片 — 它们将以紫色边框高亮。"],["点击 🔥 立即合成（50 DC）","扣除50 DC，两个矿工被销毁，更强的矿工被创建。"],["观看展示动画","特殊的 ⚗️ 合成结果界面将显示您新矿工的强化属性。"]],howFusionTip:"最佳策略：合成日收益高的矿工以最大化加成输出。两个日收益20 DC的普通矿工合成后将产出48 DC/天的非普通矿工——是普通非普通矿工的两倍多。",
    howWithdrawTitle:"提现",howWithdrawP:"将您的 DIGCOIN 转换为 pathUSD 并提取到您的钱包。提现由服务器签署，通过 MinerPool 智能合约在链上执行。",howWithdrawExTitle:"💸 示例 — 提现 1000 DIGCOIN",howWithdrawRows:[["您请求","1000 DIGCOIN",false],["换算为","10 pathUSD",false],["6% 协议手续费","−0.60 pathUSD",false],["您收到","9.40 pathUSD",true]],howWithdrawWarn:"规则：提现之间24小时冷却 · 最低100 DIGCOIN（1 pathUSD）· 每次提现6%手续费，手续费留在奖励池中。",
    howReferralTitle:"推荐计划",howReferralP:"分享您的专属推荐链接，赚取每位被推荐好友存款的4% — 即时计入您的 DIGCOIN 余额。",howReferralYourLink:"您的推荐链接",howReferralFindLink:"连接后，在我的账户标签中找到您的个性化链接。",howReferralSteps:[["1","分享您的链接","在社交媒体、群组中发布或直接发给好友"],["2","好友充值","他们连接并向游戏充值 pathUSD"],["3","您赚取4%","自动即时计入您的 DIGCOIN 余额"]],howReferralTip:"推荐无上限。您的被推荐人每次存款都能让您赚取4% — 永久有效，无需额外努力。",
    howRoiTitle:"ROI 与完整数据",howRoiP:"基于单个盲盒价格300 DC，对6种矿工类型的完整收益、回报和ROI分析。",howRoiCols:["矿工","概率","日收益范围","平均/天","ROI","寿命","总回报","修复费"],howRoiTip:"ROI 基于盲盒价格（300 DC）计算。回本后，所有进一步收益均为纯利润，直到矿工退役。",howRoiPortTitle:"📈 示例：10个盲盒投资组合",howRoiPortItems:"平均运气：3普通、3非普通、2稀有、1超级稀有、1传说\n日收益：约255 DC/天 ≈ 2.55 pathUSD\n投资额：2850 DC（批量购买）\n预计回本：约12天\n全寿命利润：约9000–12000 DC",
    howFaqTitle:"常见问题",howFaqItems:[["挖矿或领取需要支付 Gas 费吗？","不需要。挖矿和领取均为链下操作。Gas 仅适用于在 Tempo 上的充值和提现。"],["如果我超过24小时忘记领取会怎样？","没有任何影响。奖励会无限期保持待领取状态。矿工每次成功领取只减少1次寿命，而不是按天计算。"],["我可以拥有多个相同稀有度的矿工吗？","可以。想拥有多少就拥有多少 — 所有矿工独立且同时挖矿。"],["购买盲盒有数量限制吗？","没有限制。只要您的 DIGCOIN 余额足够，可以购买任意数量。"],["什么是 pathUSD？","pathUSD 是 Tempo 区块链上与美元挂钩的稳定币，1 pathUSD ≈ 1 美元。"],["可以使用 Rabby 钱包吗？","可以。Rabby 完全兼容 — 它使用与 MetaMask 相同的 window.ethereum 接口。"],["在 MetaMask 中切换账户会发生什么？","为了安全，游戏会自动退出登录。用新钱包重新连接并签署即可。"],["6% 的提现手续费可以协商吗？","不可以。手续费固定，并返回奖励池以维持游戏经济。"],["矿工可以修复多次吗？","可以，无限次。修复始终重置为原始完整寿命。"],["为什么登录时需要签署消息？","签名证明您拥有该钱包，无需花费 Gas 费。只有您才能修改您的账户。"]],
    howFooter:"DigMiner © 2026 • 由 Tempo 区块链驱动",
    landBoxTitle:"土地盒子",landBoxDesc:"拥有一块土地，永久提升矿工的每日DIGCOIN产量。每块土地的稀有度决定加成幅度和矿工格位数量。",
    landSaleCountdown:(h,m,s)=>`开售倒计时：${h}时${m}分${s}秒`,landSaleOpen:"🌍 土地销售已开启！",
    landBuyBtn:(n)=>`购买土地盒子 (${n} DC)`,
    colLand:"土地",colBoost:"农场加成",colSlots:"矿工格",colLandChance:"概率",
    landStatsTitle:"土地统计",myLands:"我的土地",
    noLands:"还没有土地。去商店购买土地盒子！",
    landAssignBtn:"分配矿工",landUnassignBtn:"取消分配",landSlotFree:"空闲格",
    landAssignTitle:"选择空闲矿工进行分配：",landAssignCancel:"取消",landAssignNoIdle:"没有空闲且未分配的矿工。",
    landAssigning:"分配中...",landUnassigning:"取消中...",
    howLandsTitle:"土地",
    howLandsP:"土地是永久地块，可提升矿工的每日DIGCOIN收入。将空闲矿工分配到土地上，每次领取时自动应用加成。",
    howLandsSteps:[["在商店购买土地盒子","前往商店标签，以400 DC购买土地盒子。稀有度随机揭示。"],["将空闲矿工分配到土地","在我的NFT标签中打开土地卡片，点击分配矿工。只有空闲矿工可以被分配。"],["正常挖矿和领取","正常开始挖矿并领取，领取时自动应用土地加成。"],["随时取消分配（仅空闲时）","在土地之间自由移动矿工——但只能在空闲时。"]],
    howLandsTip:"分配给神话土地的矿工每次领取多赚35%。拥有多块土地可同时提升所有矿工。",
    howLandsTableTitle:"📊 所有土地稀有度",howLandsColRarity:"稀有度",howLandsColBoost:"加成",howLandsColSlots:"格位",howLandsColChance:"概率",
    howLandsWarn:(p)=>`土地加成在领取时应用。示例：日收益25 DC的矿工在20%传说土地上每次获得${(25*1.2).toFixed(1)} DC。`,
    howNavAutoPickaxe:"自动镐",
    howAutoPickaxeTitle:"自动镐",
    howAutoPickaxeP:"自动镐是一次性终身工具，可完全自动化您的挖矿操作。激活后，服务器会自动在每个周期领取所有就绪矿工并重新启动它们——无需打开应用。",
    howAutoPickaxeHowTitle:"⚙️ 使用方法",
    howAutoPickaxeSteps:[
      ["在商店一次性购买","前往商店标签，以3,000 DC购买自动镐。总供应量仅限500个。"],
      ["激活切换开关","在我的NFT标签中出现带有开/关切换的横幅。切换为开以启用全自动化。"],
      ["服务器处理一切","服务器每小时检查所有激活自动镐的持有者。如果您的矿工已就绪（24小时已过），它会立即领取并重新开始挖矿。"],
      ["随时切换关闭","想手动管理？直接切换为关。关闭时手续费照常收取。"],
    ],
    howAutoPickaxePerksTitle:"⚡ 权益一览",
    howAutoPickaxePerks:[
      ["🤖","全自动化","每个周期自动领取并重启所有矿工，无需打开应用。"],
      ["💸","永久零手续费","切换开启时，矿工全部和领取全部手续费永久免除，每个矿工每周期节省10 DC。"],
      ["🔁","完全掌控","随时在我的NFT标签中切换开/关，选择权永远在您手中。"],
      ["♾️","终身访问","一次性购买——无订阅、无续费，只要您在玩就一直有效。"],
      ["🔒","专属供应","仅有500个，售完即止，无法再次购买。"],
    ],
    howAutoPickaxeTip:"拥有30个矿工并激活自动镐后，您每天节省300 DC手续费——每月节省9,000 DC回到您的口袋。",
    howAutoPickaxeWarn:"自动镐自动化周期，但不延长矿工寿命。矿工仍会在寿命结束后正常退役。",
  }
};

const TEMPO_CHAIN = {
  chainId: "0x1079", // 4217
  chainName: "Tempo Mainnet",
  nativeCurrency: { name: "TEMPO", symbol: "TEMPO", decimals: 18 },
  rpcUrls: ["https://rpc.tempo.xyz"],
  blockExplorerUrls: ["https://tempo.drpc.org"],
};

const NFT_IMGS = [
  "/nftimgs/minerador lvl 1.png",
  "/nftimgs/minerador lvl 2.png",
  "/nftimgs/minerador lvl 3.png",
  "/nftimgs/minerador lvl 4.png",
  "/nftimgs/minerador lvl 5.png",
  "/nftimgs/minerador lvl 6.png",
];

function MinerSprite({rarityId,size=90}){
  const r=RARITIES[rarityId];
  return(
    <div style={{width:size,height:size,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <div style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle,${r.color}33 0%,transparent 70%)`}}/>
      <img src={NFT_IMGS[rarityId]} alt={r.name} style={{width:size,height:size,objectFit:"contain",imageRendering:"auto",filter:`drop-shadow(0 0 6px ${r.color}88)`}}/>
    </div>
  );
}

function BoxReveal({miner,onClose,isFuse=false}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const[phase,setPhase]=useState(0);
  const r=RARITIES[miner.rarityId];
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),1200);const t2=setTimeout(()=>setPhase(2),2200);return()=>{clearTimeout(t1);clearTimeout(t2)};},[]);
  return(<div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
    {phase===0&&<div style={{animation:"shake .6s infinite",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
      {isFuse
        ?<div style={{fontSize:80,animation:"shake .6s infinite"}}>🔥</div>
        :<img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:140,height:140,objectFit:"contain",filter:"drop-shadow(0 0 20px #FFD600)"}}/>}
      {isFuse&&<div style={{color:"#E040FB",fontSize:14,fontWeight:800,letterSpacing:2}}>{tx.fusingAnim}</div>}
    </div>}
    {phase===1&&<div style={{fontSize:120,animation:"explode .8s forwards"}}>{isFuse?"💥":"✨"}</div>}
    {phase===2&&<div style={{textAlign:"center",animation:"popIn .5s ease"}}>
      {isFuse&&<div style={{color:"#E040FB",fontSize:12,fontWeight:800,letterSpacing:2,marginBottom:8}}>{tx.fusionResult}</div>}
      <div style={{filter:`drop-shadow(0 0 20px ${r.color})`,animation:"float 2s ease-in-out infinite"}}><MinerSprite rarityId={miner.rarityId} size={150}/></div>
      <div style={{color:r.color,fontSize:24,fontWeight:900,marginTop:12,textShadow:`0 0 30px ${r.color}`,fontFamily:"'Press Start 2P',monospace"}}>{r.name}!</div>
      <div style={{color:"#ccc",fontSize:13,marginTop:8}}>{miner.dailyDigcoin} DIGCOIN/day • {isFuse?miner.nftAgeTotal:r.nftAge} {tx.revealCycles} {tx.revealLifespan}</div>
      <div style={{color:"#FFD600",fontSize:12,marginTop:4}}>{isFuse?`Total: ${(miner.dailyDigcoin*(miner.nftAgeTotal||r.nftAge)).toFixed(0)} DIGCOIN`:`ROI: ~${Math.ceil(BOX_PRICE/miner.dailyDigcoin)} days | Total: ${(miner.dailyDigcoin*r.nftAge).toFixed(0)} DIGCOIN`}</div>
      <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
        {[["⚔️ PWR",miner.power],["⚡ NRG",miner.energy],["🛡️ DEF",miner.protective],["💥 DMG",miner.damage]].map(([l,v])=>(<span key={l} style={{background:"#1a1a2e",padding:"3px 8px",borderRadius:5,fontSize:10,color:"#aaa"}}>{l}: <b style={{color:"#fff"}}>{v}</b></span>))}
      </div>
      <button onClick={onClose} style={{marginTop:18,padding:"10px 36px",background:r.color,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{tx.revealClose}</button>
    </div>}
  </div>);
}

// Timer accepts targetMs (absolute UTC timestamp) so it stays accurate across tab switches and stale re-mounts.
// Legacy ms= prop is kept for withdraw cooldown (which doesn't have an absolute target).
function Timer({targetMs,ms}){
  const[,tick]=useState(0);
  useEffect(()=>{const i=setInterval(()=>tick(x=>x+1),1000);return()=>clearInterval(i);},[]);
  const rem=targetMs!=null?Math.max(0,targetMs-Date.now()):Math.max(0,ms??0);
  const h=Math.floor(rem/3600000),m=Math.floor((rem%3600000)/60000),s=Math.floor((rem%60000)/1000);
  return<span>{h}h {m}m {s}s</span>;
}

function MinerCard({miner,onMine,onClaim,onRepair,loading,inLand=false}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const r=RARITIES[miner.rarityId];const pct=(miner.nftAgeRemaining/miner.nftAgeTotal)*100;const dead=!miner.isAlive||miner.needsRepair;
  return(<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:`2px solid ${dead?"#ddd":miner.canClaim?"#FFD600":r.color}`,opacity:dead?.65:1}}>
    <div style={{background:dead?"#f5f5f5":`linear-gradient(135deg,${r.bg},#1a1a2e)`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:r.color,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:1}}>
        {r.name}
        {miner.isFused&&<span style={{marginLeft:5,background:"linear-gradient(135deg,#E040FB,#9C27B0)",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:4,letterSpacing:.5,verticalAlign:"middle"}}>{tx.fusedBadge}</span>}
        {inLand&&<span style={{marginLeft:5,background:"linear-gradient(135deg,#388E3C,#4CAF50)",color:"#fff",fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:4,letterSpacing:.5,verticalAlign:"middle"}}>🌍 LAND</span>}
      </span>
      <span style={{fontSize:9,fontWeight:600,color:miner.canClaim?"#FFD600":miner.isMining?"#4CAF50":dead?"#999":"#aaa"}}>
        {miner.canClaim?`✅ ${tx.mcReady}`:miner.isMining?`⛏️ ${tx.mcMining}`:dead?"":miner.isIdle?`💤 ${tx.mcIdle}`:""}
        <span style={{color:"#999",marginLeft:4}}>{miner.nftAgeRemaining}/{miner.nftAgeTotal}</span>
      </span>
    </div>
    <div style={{display:"flex",justifyContent:"center",padding:"14px 0",background:dead?"#fafafa":r.bg}}><MinerSprite rarityId={miner.rarityId} size={72}/></div>
    <div style={{padding:"8px 14px",fontSize:10,color:"#555",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 10px"}}>
      <div>• Level: <b>{miner.level}</b></div><div>• Power: <b>{miner.power}</b></div>
      <div>• Exp: <b>{miner.exp}</b></div><div>• Energy: <b>{miner.energy}</b></div>
      <div>• Protective: <b>{miner.protective}</b></div><div>• Damage: <b>{miner.damage}</b></div>
    </div>
    <div style={{padding:"6px 14px",textAlign:"center",borderTop:"1px solid #eee"}}><span style={{fontSize:13,fontWeight:700,color:"#333"}}>{miner.dailyDigcoin} DIGCOIN/day</span></div>
    <div style={{padding:"0 14px 6px"}}><div style={{height:4,background:"#eee",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>50?r.color:pct>20?"#FFA726":"#EF5350",borderRadius:2,transition:"width .5s"}}/></div></div>
    <div style={{padding:"6px 14px 12px",display:"flex",gap:6}}>
      {miner.needsRepair
        ?<button disabled={loading} onClick={()=>onRepair(miner.id)} style={{flex:1,padding:"7px",background:"#FF9800",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>{tx.mcRepairBtn} ({(RARITIES[miner.rarityId].repair*DIG_RATE).toFixed(0)} DC)</button>
        :!miner.isAlive
          ?<div style={{flex:1,textAlign:"center",color:"#999",fontSize:11,padding:7}}>☠️ DEAD</div>
          :miner.canClaim
            ?<button disabled={loading} onClick={()=>onClaim(miner.id)} style={{flex:1,padding:"7px",background:"linear-gradient(135deg,#FFD600,#FF9800)",border:"none",borderRadius:8,color:"#333",fontSize:11,fontWeight:800,cursor:"pointer"}}>{tx.mcClaim} +{miner.dailyDigcoin} DC</button>
            :miner.isMining
              ?<div style={{flex:1,textAlign:"center",color:"#4CAF50",fontSize:10,padding:7}}>{tx.mcMine}… <Timer targetMs={miner.miningEndsAt}/></div>
              :<button disabled={loading} onClick={()=>onMine(miner.id)} style={{flex:1,padding:"7px",background:`linear-gradient(135deg,${r.color},${r.color}dd)`,border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>{tx.mcMine}</button>}
    </div>
  </div>);
}

function FarmCalculator({miners, lands=[]}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const[simQty,setSimQty]=useState({0:0,1:0,2:0,3:0,4:0,5:0});
  const[simLandBoost,setSimLandBoost]=useState(0);  // selected land boost %
  const[simShowFusion,setSimShowFusion]=useState(false);
  const alive=miners.filter(m=>m.isAlive&&!m.needsRepair);

  // Build miner → land boost lookup from lands state
  const minerLandBoost=useMemo(()=>{
    const map={};
    for(const land of lands){
      for(const a of land.assignedMiners||[]){
        map[a.minerId]={boostPercent:land.boostPercent,landRarity:land.rarityName,landId:land.id};
      }
    }
    return map;
  },[lands]);

  const effectiveDaily=(m)=>m.dailyDigcoin*(1+(minerLandBoost[m.id]?.boostPercent||0)/100);
  const dailyTotal=alive.reduce((s,m)=>s+effectiveDaily(m),0);
  const weeklyTotal=dailyTotal*7;
  const monthlyTotal=dailyTotal*30;
  const hasLandBoosts=alive.some(m=>minerLandBoost[m.id]);
  const hasFused=alive.some(m=>m.isFused);

  // Simulator totals (base)
  const simDaily=RARITIES.reduce((s,r)=>{
    const qty=simQty[r.id]||0;
    const avg=(r.dailyMin+r.dailyMax)/2;
    return s+avg*qty;
  },0);
  const simWeekly=simDaily*7;
  const simMonthly=simDaily*30;

  // Land boost applied
  const simDailyBoosted=simDaily*(1+simLandBoost/100);

  // Fusion potential: fuse all possible pairs per rarity (max rarity = 5 can't fuse up)
  const fusionResult=useMemo(()=>{
    const counts={0:simQty[0]||0,1:simQty[1]||0,2:simQty[2]||0,3:simQty[3]||0,4:simQty[4]||0,5:simQty[5]||0};
    let fusedDaily=0;
    const breakdown=[];
    for(let id=0;id<=4;id++){
      const qty=counts[id];
      if(qty<2) continue;
      const pairs=Math.floor(qty/2);
      const parentAvg=(RARITIES[id].dailyMin+RARITIES[id].dailyMax)/2;
      const fusedAvg=parentAvg*2*1.20;
      const resultRarity=RARITIES[id+1];
      fusedDaily+=fusedAvg*pairs;
      breakdown.push({from:RARITIES[id],to:resultRarity,pairs,fusedAvg,dc:fusedAvg*pairs});
    }
    // Add unfused miners (qty=1 remainder or mythic) at base rate
    let remainderDaily=0;
    for(let id=0;id<=5;id++){
      const qty=simQty[id]||0;
      const remainder=id<=4?qty%2:qty; // mythics never fuse
      const avg=(RARITIES[id].dailyMin+RARITIES[id].dailyMax)/2;
      remainderDaily+=avg*remainder;
    }
    return{daily:fusedDaily+remainderDaily,breakdown,boosted:(fusedDaily+remainderDaily)*(1+simLandBoost/100)};
  },[simQty,simLandBoost]);

  const Card=({label,dc,usd})=>(
    <div className="wp" style={{textAlign:"center",flex:1,minWidth:120,marginBottom:0}}>
      <div style={{fontSize:10,color:"#888",marginBottom:4}}>{label}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#8B0000"}}>{dc.toFixed(1)} DC</div>
      <div style={{fontSize:11,color:"#2E7D32",fontWeight:600}}>${usd.toFixed(2)} USD</div>
    </div>
  );

  return(<div style={{animation:"fadeIn .3s ease",display:"flex",flexDirection:"column",gap:16}}>

    {/* YOUR MINERS STATS */}
    <div className="wp">
      <h2 style={{fontSize:16,fontWeight:800,color:"#333",marginBottom:4}}>{tx.farmStats}</h2>
      <p style={{fontSize:11,color:"#888",marginBottom:20}}>{tx.farmStatsDesc(alive.length)}</p>
      {alive.length===0
        ?<div style={{textAlign:"center",padding:24,color:"#aaa",fontSize:12}}>{tx.noActiveMiners}</div>
        :<>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <Card label={tx.dailyIncome} dc={dailyTotal} usd={dailyTotal/DIG_RATE}/>
            <Card label={tx.weeklyIncome} dc={weeklyTotal} usd={weeklyTotal/DIG_RATE}/>
            <Card label={tx.monthlyIncome} dc={monthlyTotal} usd={monthlyTotal/DIG_RATE}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:"#f5f5f5"}}>
                {[tx.calcMiner,tx.calcRarity,...((hasFused||hasLandBoosts)?["Boosts"]:[]),tx.calcDailyDC,tx.calcDailyUSD,tx.calcMonthlyDC,tx.calcMonthlyUSD,tx.calcLifespan,tx.calcRemaining].map(h=>(
                  <th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",fontWeight:700,color:"#555",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{alive.map(m=>{
                const r=RARITIES[m.rarityId];
                const lb=minerLandBoost[m.id];
                const eff=effectiveDaily(m);
                const monthDC=eff*30;
                const remaining=eff*m.nftAgeRemaining;
                return(<tr key={m.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                  <td style={{padding:"8px 10px"}}><img src={NFT_IMGS[m.rarityId]} alt={r.name} style={{width:28,height:28,objectFit:"contain",verticalAlign:"middle",marginRight:6}}/><span style={{fontWeight:600,fontSize:10}}>#{m.id}</span></td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:r.color}}>{r.name}</td>
                  {(hasFused||hasLandBoosts)&&<td style={{padding:"8px 10px"}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {m.isFused&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:700,background:"#fbe9e7",color:"#BF360C"}}>⚡ FUSED</span>}
                      {lb&&<span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:700,background:"#f3e5f5",color:"#6A1B9A"}} title={`Land #${lb.landId} (${lb.landRarity})`}>🌍 +{lb.boostPercent}%</span>}
                      {!m.isFused&&!lb&&<span style={{color:"#ccc",fontSize:10}}>—</span>}
                    </div>
                  </td>}
                  <td style={{padding:"8px 10px"}}>
                    <span style={{fontWeight:700,color:"#8B0000"}}>{eff.toFixed(2)}</span>
                    {lb&&<span style={{fontSize:9,color:"#888",marginLeft:4}}>(base {m.dailyDigcoin.toFixed(2)})</span>}
                  </td>
                  <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(eff/DIG_RATE).toFixed(4)}</td>
                  <td style={{padding:"8px 10px"}}>{monthDC.toFixed(1)}</td>
                  <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(monthDC/DIG_RATE).toFixed(3)}</td>
                  <td style={{padding:"8px 10px"}}>{m.nftAgeRemaining} days</td>
                  <td style={{padding:"8px 10px",fontWeight:600,color:"#2196F3"}}>{remaining.toFixed(0)} DC</td>
                </tr>);
              })}</tbody>
              <tfoot><tr style={{background:"#FFF8E1",fontWeight:800}}>
                <td colSpan={(hasFused||hasLandBoosts)?3:2} style={{padding:"10px",fontSize:12}}>{tx.calcTotal}</td>
                <td style={{padding:"10px",color:"#8B0000",fontWeight:800}}>{dailyTotal.toFixed(2)}</td>
                <td style={{padding:"10px",color:"#4CAF50"}}>${(dailyTotal/DIG_RATE).toFixed(4)}</td>
                <td style={{padding:"10px"}}>{monthlyTotal.toFixed(1)}</td>
                <td style={{padding:"10px",color:"#4CAF50"}}>${(monthlyTotal/DIG_RATE).toFixed(3)}</td>
                <td colSpan={2} style={{padding:"10px",color:"#888",fontSize:10}}>{tx.calcAcross(alive.length)}</td>
              </tr></tfoot>
            </table>
          </div>
          {/* Breakdown by rarity */}
          <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            {RARITIES.map(r=>{
              const group=alive.filter(m=>m.rarityId===r.id);
              if(!group.length) return null;
              const dc=group.reduce((s,m)=>s+effectiveDaily(m),0);
              const fusedCount=group.filter(m=>m.isFused).length;
              const boostedCount=group.filter(m=>minerLandBoost[m.id]).length;
              return(<div key={r.id} style={{background:r.bg||"#f5f5f5",borderRadius:10,padding:"8px 14px",border:`1px solid ${r.color}`,display:"flex",gap:10,alignItems:"center"}}>
                <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:24,height:24,objectFit:"contain"}}/>
                <div>
                  <div style={{fontSize:10,color:r.color,fontWeight:700}}>{r.name} ×{group.length}{fusedCount>0&&<span style={{marginLeft:4,color:"#BF360C"}}>⚡×{fusedCount}</span>}{boostedCount>0&&<span style={{marginLeft:4,color:"#6A1B9A"}}>🌍×{boostedCount}</span>}</div>
                  <div style={{fontSize:11,fontWeight:800,color:"#333"}}>{dc.toFixed(1)} DC/day</div>
                </div>
              </div>);
            })}
          </div>
        </>}
    </div>

    {/* SIMULATOR */}
    <div className="wp">
      <h2 style={{fontSize:16,fontWeight:800,color:"#333",marginBottom:4}}>{tx.simulator}</h2>
      <p style={{fontSize:11,color:"#888",marginBottom:20}}>{tx.simulatorDesc}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:20}}>
        {RARITIES.map(r=>{
          const avg=(r.dailyMin+r.dailyMax)/2;
          return(<div key={r.id} style={{background:"#fafafa",borderRadius:10,padding:12,border:`1px solid ${r.color}44`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:36,height:36,objectFit:"contain"}}/>
              <div>
                <div style={{fontWeight:700,color:r.color,fontSize:11}}>{r.name}</div>
                <div style={{fontSize:9,color:"#999"}}>{r.dailyMin}–{r.dailyMax} DC/day avg</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setSimQty(q=>({...q,[r.id]:Math.max(0,(q[r.id]||0)-1)}))} style={{width:26,height:26,borderRadius:6,border:"1px solid #ddd",background:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",lineHeight:1}}>−</button>
              <input type="number" min={0} value={simQty[r.id]||0}
                onChange={e=>setSimQty(q=>({...q,[r.id]:Math.max(0,parseInt(e.target.value)||0)}))}
                style={{flex:1,textAlign:"center",padding:"4px",border:"1px solid #ddd",borderRadius:6,fontSize:13,fontWeight:700}}/>
              <button onClick={()=>setSimQty(q=>({...q,[r.id]:(q[r.id]||0)+1}))} style={{width:26,height:26,borderRadius:6,border:"1px solid #ddd",background:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",lineHeight:1}}>+</button>
            </div>
            <div style={{marginTop:6,fontSize:10,color:"#888",textAlign:"center"}}>= {((simQty[r.id]||0)*avg).toFixed(1)} DC/day</div>
          </div>);
        })}
      </div>
      {simDaily>0&&(
        <div style={{background:"linear-gradient(135deg,#1a1a2e,#2a1a3e)",borderRadius:12,padding:20,color:"#fff"}}>
          <div style={{fontSize:12,color:"#aaa",marginBottom:12,textAlign:"center"}}>{tx.simResult}</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            {[[tx.simDaily,simDaily,simDaily/DIG_RATE],[tx.simWeekly,simWeekly,simWeekly/DIG_RATE],[tx.simMonthly,simMonthly,simMonthly/DIG_RATE]].map(([l,dc,usd])=>(
              <div key={l} style={{textAlign:"center",flex:1,minWidth:100}}>
                <div style={{fontSize:10,color:"#888"}}>{l}</div>
                <div style={{fontSize:20,fontWeight:800,color:"#FFD600"}}>{dc.toFixed(1)} DC</div>
                <div style={{fontSize:12,color:"#4CAF50",fontWeight:600}}>${usd.toFixed(3)}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,borderTop:"1px solid #333",paddingTop:12,display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            {[[tx.boxCost,`${Object.entries(simQty).reduce((s,[id,q])=>s+q*BOX_PRICE,0)} DC`],
              [tx.roiLabel,`~${simDaily>0?Math.ceil(Object.entries(simQty).reduce((s,[id,q])=>s+q*BOX_PRICE,0)/simDaily):0} days`],
              [tx.totalReturn,`${Object.entries(simQty).reduce((s,[id,q])=>s+q*(RARITIES[id].dailyMin+RARITIES[id].dailyMax)/2*RARITIES[id].nftAge,0).toFixed(0)} DC`],
            ].map(([l,v])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:"#888"}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LAND BOOST SELECTOR */}
      {simDaily>0&&(
        <div className="wp">
          <div style={{fontSize:12,fontWeight:800,color:"#3a1a00",marginBottom:10}}>🌍 Land Boost Simulator</div>
          <div style={{fontSize:11,color:"#888",marginBottom:12}}>Select a land rarity to see boosted earnings</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setSimLandBoost(0)}
              style={{padding:"6px 12px",borderRadius:8,border:"2px solid",borderColor:simLandBoost===0?"#333":"#ddd",
                background:simLandBoost===0?"#333":"#fff",color:simLandBoost===0?"#fff":"#555",
                fontSize:11,fontWeight:700,cursor:"pointer"}}>
              None (0%)
            </button>
            {LAND_RARITIES.map(r=>(
              <button key={r.id} onClick={()=>setSimLandBoost(simLandBoost===r.boostPercent?0:r.boostPercent)}
                style={{padding:"6px 12px",borderRadius:8,border:"2px solid",borderColor:simLandBoost===r.boostPercent?r.color:"#ddd",
                  background:simLandBoost===r.boostPercent?r.color+"22":"#fff",color:r.color,
                  fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {r.name} +{r.boostPercent}%
              </button>
            ))}
          </div>
          {simLandBoost>0&&(
            <div style={{marginTop:14,background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:10,padding:14,color:"#fff"}}>
              <div style={{fontSize:10,color:"#aaa",marginBottom:8,textAlign:"center"}}>With {simLandBoost}% Land Boost</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
                {[["Daily",simDailyBoosted],["Weekly",simDailyBoosted*7],["Monthly",simDailyBoosted*30]].map(([l,dc])=>(
                  <div key={l} style={{textAlign:"center",flex:1,minWidth:90}}>
                    <div style={{fontSize:10,color:"#888"}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#B2FF59"}}>{dc.toFixed(1)} DC</div>
                    <div style={{fontSize:10,color:"#4CAF50"}}>${(dc/DIG_RATE).toFixed(3)}</div>
                    <div style={{fontSize:9,color:"#666",marginTop:2}}>+{(simDaily*(simLandBoost/100)).toFixed(1)} DC vs base</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FUSION POTENTIAL */}
      {simDaily>0&&(
        <div className="wp">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:simShowFusion?14:0}}>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:"#333"}}>⚗️ Fusion Potential</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>What if you fuse all possible pairs?</div>
            </div>
            <button onClick={()=>setSimShowFusion(v=>!v)}
              style={{padding:"6px 14px",borderRadius:8,border:"1px solid #E040FB",background:simShowFusion?"#E040FB":"#fff",
                color:simShowFusion?"#fff":"#E040FB",fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {simShowFusion?"Hide":"Show"}
            </button>
          </div>

          {simShowFusion&&(
            <>
              {fusionResult.breakdown.length===0
                ?<div style={{textAlign:"center",padding:12,color:"#aaa",fontSize:11}}>Add at least 2 miners of the same rarity to see fusion potential</div>
                :(
                <>
                  {/* Fusion breakdown table */}
                  <div style={{overflowX:"auto",marginBottom:12}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:"#f5f5f5"}}>
                        {["From","Pairs","Result Rarity","Fused Daily","Total DC/day"].map(h=>(
                          <th key={h} style={{padding:"7px 10px",borderBottom:"2px solid #ddd",textAlign:"left",fontWeight:700,color:"#555",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {fusionResult.breakdown.map((b,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fafafa":"#fff"}}>
                            <td style={{padding:"7px 10px"}}>
                              <span style={{fontWeight:700,color:b.from.color}}>{b.from.name}</span>
                              <span style={{color:"#aaa",margin:"0 4px"}}>×2</span>
                            </td>
                            <td style={{padding:"7px 10px",fontWeight:700}}>{b.pairs} pair{b.pairs>1?"s":""}</td>
                            <td style={{padding:"7px 10px"}}>
                              <span style={{fontWeight:700,color:b.to.color}}>→ {b.to.name}</span>
                              <span style={{fontSize:9,color:"#888",marginLeft:4}}>(×1.20 bonus)</span>
                            </td>
                            <td style={{padding:"7px 10px",color:"#8B0000",fontWeight:700}}>{b.fusedAvg.toFixed(2)} DC</td>
                            <td style={{padding:"7px 10px",color:"#8B0000",fontWeight:800}}>{b.dc.toFixed(2)} DC</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Fusion result summary */}
                  <div style={{background:"linear-gradient(135deg,#2a0a3e,#1a0a2e)",borderRadius:10,padding:14,color:"#fff"}}>
                    <div style={{fontSize:10,color:"#aaa",marginBottom:10,textAlign:"center"}}>After Fusing All Pairs</div>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:simLandBoost>0?12:0}}>
                      {[["Daily",fusionResult.daily],["Weekly",fusionResult.daily*7],["Monthly",fusionResult.daily*30]].map(([l,dc])=>(
                        <div key={l} style={{textAlign:"center",flex:1,minWidth:90}}>
                          <div style={{fontSize:10,color:"#888"}}>{l}</div>
                          <div style={{fontSize:18,fontWeight:800,color:"#E040FB"}}>{dc.toFixed(1)} DC</div>
                          <div style={{fontSize:10,color:"#CE93D8"}}>${(dc/DIG_RATE).toFixed(3)}</div>
                          <div style={{fontSize:9,color:"#666",marginTop:2}}>
                            {dc>simDaily
                              ?<span style={{color:"#B2FF59"}}>+{(dc-simDaily).toFixed(1)} vs base</span>
                              :<span style={{color:"#888"}}>same as base</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Land boost on fused result */}
                    {simLandBoost>0&&(
                      <div style={{borderTop:"1px solid #333",paddingTop:10,marginTop:4}}>
                        <div style={{fontSize:10,color:"#aaa",marginBottom:8,textAlign:"center"}}>Fused + {simLandBoost}% Land Boost</div>
                        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
                          {[["Daily",fusionResult.boosted],["Weekly",fusionResult.boosted*7],["Monthly",fusionResult.boosted*30]].map(([l,dc])=>(
                            <div key={l} style={{textAlign:"center",flex:1,minWidth:90}}>
                              <div style={{fontSize:10,color:"#888"}}>{l}</div>
                              <div style={{fontSize:18,fontWeight:800,color:"#FFD600"}}>{dc.toFixed(1)} DC</div>
                              <div style={{fontSize:10,color:"#4CAF50"}}>${(dc/DIG_RATE).toFixed(3)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FUSE COST note */}
                  <div style={{marginTop:8,fontSize:10,color:"#888",textAlign:"center"}}>
                    ⚗️ Fusing costs {FUSE_COST} DC per pair • Fused miners get +20% daily bonus over both parents combined
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {simDaily===0&&<div style={{textAlign:"center",padding:16,color:"#aaa",fontSize:12}}>{tx.addMiners}</div>}
    </div>
  </div>);
}

function GBCallout({type,children}){
  const S={info:{bg:"#e8f4fd",border:"#2196F3",icon:"ℹ️"},tip:{bg:"#e8f8e8",border:"#4CAF50",icon:"💡"},warning:{bg:"#fff8e1",border:"#FF9800",icon:"⚠️"},danger:{bg:"#fde8e8",border:"#f44336",icon:"🚨"}};
  const s=S[type]||S.info;
  return(<div style={{background:s.bg,borderLeft:`4px solid ${s.border}`,borderRadius:"0 8px 8px 0",padding:"12px 16px",marginBottom:18,display:"flex",gap:10,alignItems:"flex-start"}}>
    <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{s.icon}</span>
    <div style={{fontSize:13,color:"#333",lineHeight:1.7}}>{children}</div>
  </div>);
}
function GBSection({id,emoji,title}){
  return(<div style={{display:"flex",alignItems:"center",gap:10,borderBottom:"2px solid #f0f0f0",paddingBottom:12,marginBottom:22,marginTop:8}} id={"gb-"+id}>
    <span style={{fontSize:20}}>{emoji}</span>
    <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:800,color:"#1a1a2e",margin:0}}>{title}</h2>
  </div>);
}
function HowItWorks(){
  const lang=useContext(LangCtx);const tx=T[lang];
  const[active,setActive]=useState("intro");
  const NAV=[
    {id:"intro",   emoji:"📖", label:tx.howNavIntro},
    {id:"start",   emoji:"🚀", label:tx.howNavStart},
    {id:"boxes",   emoji:"📦", label:tx.howNavBoxes},
    {id:"rarities",emoji:"💎", label:tx.howNavRarities},
    {id:"mining",  emoji:"⛏️",  label:tx.howNavMining},
    {id:"lifespan",emoji:"⏳", label:tx.howNavLifespan},
    {id:"fusion",  emoji:"🔥", label:tx.howNavFusion},
    {id:"lands",   emoji:"🌍", label:tx.howNavLands},
    {id:"withdraw",    emoji:"🏧", label:tx.howNavWithdraw},
    {id:"referral",    emoji:"🤝", label:tx.howNavReferral},
    {id:"roi",         emoji:"📊", label:tx.howNavRoi},
    {id:"autopickaxe", emoji:"⛏️", label:tx.howNavAutoPickaxe},
    {id:"faq",         emoji:"❓", label:tx.howNavFaq},
  ];
  const go=(id)=>{setActive(id);document.getElementById("gb-"+id)?.scrollIntoView({behavior:"smooth",block:"start"});};
  return(
  <div className="how-layout" style={{animation:"fadeIn .3s ease"}}>
    <div className="how-sidebar" style={{borderRadius:"0"}}>
      <div style={{padding:"20px 16px 16px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:30,objectFit:"contain",marginBottom:6,display:"block"}}/>
        <div style={{color:"rgba(255,255,255,.35)",fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Documentation</div>
      </div>
      <nav style={{padding:"10px 0"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>go(n.id)} style={{width:"100%",textAlign:"left",background:active===n.id?"rgba(255,152,0,.12)":"transparent",border:"none",borderLeft:`3px solid ${active===n.id?"#FF9800":"transparent"}`,color:active===n.id?"#FF9800":"rgba(255,255,255,.55)",padding:"9px 14px",fontSize:12.5,cursor:"pointer",display:"flex",gap:8,alignItems:"center",fontFamily:"'Outfit',sans-serif",fontWeight:active===n.id?700:400,transition:"all .15s"}}>
            <span style={{fontSize:13,minWidth:18}}>{n.emoji}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px",borderTop:"1px solid rgba(255,255,255,.08)",marginTop:4,display:"flex",flexDirection:"column",gap:8}}>
        <a href="https://t.me/+RFYExBlVNwk0NmE0" target="_blank" rel="noopener noreferrer" style={{display:"block",padding:"8px",background:"#0088cc",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center"}}>📢 Telegram</a>
        <a href="https://x.com/digminertempo" target="_blank" rel="noopener noreferrer" style={{display:"block",padding:"8px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"rgba(255,255,255,.65)",fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center"}}>𝕏 Twitter</a>
      </div>
    </div>
    <div className="how-content">

      <GBSection id="intro" emoji="📖" title={tx.howIntroTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:14}}>{tx.howIntroP1}</p>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:16}}>{tx.howIntroP2}</p>
      <GBCallout type="tip">{tx.howIntroTip}</GBCallout>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:28}}>
        {[[tx.howStatExchange,"100 DC = 1 pathUSD","#FF9800"],[tx.howStatBox,"300 DC (single)","#2196F3"],[tx.howStatBulk,"2850 DC — 5% off","#4CAF50"],[tx.howStatFee,"6%","#E91E63"],[tx.howStatRef,"4% of deposit","#9C27B0"],[tx.howStatBatch,"5 DC / miner","#FF9800"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#f8f9fa",borderRadius:10,padding:"12px 14px",border:`1px solid ${c}22`}}>
            <div style={{fontSize:10,color:"#999",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>{l}</div>
            <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <GBSection id="start" emoji="🚀" title={tx.howStartTitle}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {tx.howStartSteps.map(([t,d],i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",background:"#f8f9fa",borderRadius:10,border:"1px solid #eee"}}>
            <div style={{background:"#1a1a2e",color:"#FF9800",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{i+1}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#222",marginBottom:3}}>{t}</div><div style={{fontSize:12,color:"#666",lineHeight:1.7}}>{d}</div></div>
          </div>
        ))}
      </div>

      <GBSection id="boxes" emoji="📦" title={tx.howBoxesTitle}/>
      <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:96,height:96,objectFit:"contain",filter:"drop-shadow(0 4px 16px #FFD60055)",flexShrink:0}}/>
        <div>
          <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:10}}>{tx.howBoxesP1}</p>
          <p style={{fontSize:14,color:"#444",lineHeight:1.9,margin:0}}>{tx.howBoxesP2}</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px 20px",border:"1px solid #eee"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:6}}>📦 {tx.howBoxesSingle}</div>
          <div style={{fontSize:28,fontWeight:900,color:"#FF9800"}}>300 DC</div>
          <div style={{fontSize:11,color:"#aaa",marginTop:4}}>{tx.howBoxesSingleSub}</div>
        </div>
        <div style={{background:"#1a1a2e",borderRadius:12,padding:"18px 20px",border:"2px solid #FF9800",position:"relative"}}>
          <div style={{position:"absolute",top:-11,right:14,background:"#FF9800",color:"#fff",fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:10}}>{tx.howBoxesBestValue}</div>
          <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.5)",marginBottom:6}}>📦 {tx.howBoxesBulk}</div>
          <div style={{fontSize:28,fontWeight:900,color:"#FF9800"}}>2850 DC</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:4}}>{tx.howBoxesBulkSub}</div>
        </div>
      </div>
      <GBCallout type="info">{tx.howBoxesTip}</GBCallout>

      <GBSection id="rarities" emoji="💎" title={tx.howRaritiesTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howRaritiesP}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:12,marginBottom:22}}>
        {RARITIES.map(r=>(
          <div key={r.id} style={{borderRadius:14,overflow:"hidden",border:`2px solid ${r.color}`,background:"#0d0d1a",textAlign:"center"}}>
            <div style={{padding:"14px 8px 4px",background:`linear-gradient(180deg,${r.bg} 0%,#0d0d1a 100%)`}}>
              <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:66,height:66,objectFit:"contain",filter:`drop-shadow(0 0 8px ${r.color}88)`}}/>
            </div>
            <div style={{padding:"8px 8px 14px"}}>
              <div style={{color:r.color,fontWeight:800,fontSize:11,marginBottom:3}}>{r.name}</div>
              <div style={{color:"rgba(255,255,255,.4)",fontSize:10,marginBottom:7}}>{r.chance} {tx.howRaritiesChance}</div>
              <div style={{color:"#FFD600",fontWeight:700,fontSize:13}}>{r.dailyMin}–{r.dailyMax}<span style={{color:"rgba(255,255,255,.35)",fontWeight:400,fontSize:10}}> {tx.howRaritiesDay}</span></div>
              <div style={{color:"rgba(255,255,255,.35)",fontSize:10,marginTop:2}}>{r.nftAge} {tx.howRaritiesDays}</div>
            </div>
          </div>
        ))}
      </div>
      <GBCallout type="info">{tx.howRaritiesWarn}</GBCallout>

      <GBSection id="mining" emoji="⛏️" title={tx.howMiningTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howMiningP}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:22,borderRadius:12,overflow:"hidden",border:"1px solid #e8e8e8"}}>
        {tx.howMiningStates.map(([em,st,desc,c],i)=>(
          <div key={i} style={{padding:"18px 14px",background:i===1?"#f0f9f1":i===2?"#fff9f0":"#fafafa",textAlign:"center",borderRight:i<2?"1px solid #e8e8e8":"none"}}>
            <div style={{fontSize:28,marginBottom:8}}>{em}</div>
            <div style={{fontSize:12,fontWeight:800,color:c,marginBottom:8}}>{st}</div>
            <div style={{fontSize:11,color:"#666",lineHeight:1.6}}>{desc}</div>
          </div>
        ))}
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:10,marginTop:24}}>{tx.howMiningBatchTitle}</h3>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:12}}>{tx.howMiningBatchP}</p>
      <GBCallout type="info">{tx.howMiningBatchTip}</GBCallout>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:24}}>{tx.howMiningBatchNote}</p>

      <GBSection id="lifespan" emoji="⏳" title={tx.howLifespanTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howLifespanP}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px",border:"1px solid #eee"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>{tx.howLifespanWhenTitle}</div>
          <div style={{fontSize:12,color:"#666",lineHeight:2}}>{tx.howLifespanWhenItems.split('\n').map((l,i)=><span key={i}>{l}<br/></span>)}</div>
        </div>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px",border:"1px solid #eee"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>{tx.howLifespanRepairTitle}</div>
          {RARITIES.map(r=>(
            <div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{color:r.color,fontWeight:700}}>{r.name}</span>
              <span style={{color:"#555"}}>{r.repair} pathUSD ({r.repair*DIG_RATE} DC)</span>
            </div>
          ))}
        </div>
      </div>
      <GBCallout type="tip">{tx.howLifespanTip}</GBCallout>

      <GBSection id="withdraw" emoji="🏧" title={tx.howWithdrawTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howWithdrawP}</p>
      <div style={{background:"#f8f9fa",borderRadius:12,padding:"20px",marginBottom:20,border:"1px solid #eee"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:14}}>{tx.howWithdrawExTitle}</div>
        {tx.howWithdrawRows.map(([l,v,bold])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 0",borderBottom:"1px solid #e8e8e8"}}>
            <span style={{color:"#888"}}>{l}</span>
            <span style={{fontWeight:bold?900:600,color:bold?"#4CAF50":"#333",fontSize:bold?15:13}}>{v}</span>
          </div>
        ))}
      </div>
      <GBCallout type="warning">{tx.howWithdrawWarn}</GBCallout>

      <GBSection id="referral" emoji="🤝" title={tx.howReferralTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howReferralP}</p>
      <div style={{background:"#1a1a2e",borderRadius:12,padding:"20px",marginBottom:20}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>{tx.howReferralYourLink}</div>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:"#FFD600",wordBreak:"break-all"}}>https://digminer.xyz?ref=0xYourWallet</div>
        <div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.7}}>{tx.howReferralFindLink}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {tx.howReferralSteps.map(([n,t,d])=>(
          <div key={n} style={{background:"#f8f9fa",borderRadius:10,padding:"14px",textAlign:"center",border:"1px solid #eee"}}>
            <div style={{fontSize:22,fontWeight:900,color:"#FF9800",marginBottom:6,fontFamily:"'Outfit',sans-serif"}}>{n}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:5}}>{t}</div>
            <div style={{fontSize:11,color:"#888",lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
      <GBCallout type="tip">{tx.howReferralTip}</GBCallout>

      <GBSection id="fusion" emoji="🔥" title={tx.howFusionTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howFusionP}</p>
      <GBCallout type="warning">{tx.howFusionWarn(FUSE_COST)}</GBCallout>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:12,marginTop:24}}>{tx.howFusionRuleTitle}</h3>
      <div style={{background:"linear-gradient(135deg,#4a1060,#2d0040)",borderRadius:12,padding:"18px 22px",marginBottom:22,border:"1px solid #9C27B0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,textAlign:"center"}}>
          <div><div style={{color:"#aaa",fontSize:11,marginBottom:4}}>Daily</div><div style={{color:"#E040FB",fontWeight:800,fontSize:13}}>(A + B) × 1.20</div></div>
          <div><div style={{color:"#aaa",fontSize:11,marginBottom:4}}>Lifespan</div><div style={{color:"#E040FB",fontWeight:800,fontSize:13}}>Parent tier's age</div></div>
          <div><div style={{color:"#aaa",fontSize:11,marginBottom:4}}>Rarity</div><div style={{color:"#E040FB",fontWeight:800,fontSize:13}}>+1 tier up</div></div>
        </div>
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:12}}>{tx.howFusionTableTitle}</h3>
      <div style={{overflowX:"auto",marginBottom:22}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#1a1a2e"}}>
              {[tx.howFusionColA,tx.howFusionColB,tx.howFusionColResult,tx.howFusionColDaily,tx.howFusionColLifespan].map(h=>(
                <th key={h} style={{padding:"10px 12px",color:"rgba(255,255,255,.65)",fontWeight:600,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              [0,0,1,"(19+19)×1.2 = 45.6 DC",19],
              [1,1,2,"(22+22)×1.2 = 52.8 DC",17],
              [2,2,3,"(25+25)×1.2 = 60 DC",15],
              [3,3,4,"(28+28)×1.2 = 67.2 DC",14],
              [4,4,5,"(33+33)×1.2 = 79.2 DC",13],
            ].map(([aId,bId,resId,daily,lifespan],i)=>{
              const ca=RARITIES[aId];const cb=RARITIES[bId];const cr=RARITIES[resId];
              return(
                <tr key={i} style={{background:i%2===0?"#f8f9fa":"#fff",borderBottom:"1px solid #eee"}}>
                  <td style={{padding:"10px 12px",fontWeight:700,color:ca.color}}>{ca.name}</td>
                  <td style={{padding:"10px 12px",fontWeight:700,color:cb.color}}>{cb.name}</td>
                  <td style={{padding:"10px 12px",fontWeight:700,color:cr.color}}>{cr.name} <span style={{background:"linear-gradient(135deg,#E040FB,#9C27B0)",color:"#fff",fontSize:8,padding:"1px 4px",borderRadius:3,marginLeft:4}}>FUSED</span></td>
                  <td style={{padding:"10px 12px",color:"#4CAF50",fontWeight:700}}>{daily}</td>
                  <td style={{padding:"10px 12px",color:"#FF9800",fontWeight:700}}>{lifespan} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:10}}>{tx.howFusionHowTitle}</h3>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
        {tx.howFusionSteps.map(([t,d],i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"13px 16px",background:"#f8f9fa",borderRadius:10,border:"1px solid #eee"}}>
            <div style={{background:"#4a0060",color:"#E040FB",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{i+1}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#222",marginBottom:3}}>{t}</div><div style={{fontSize:12,color:"#666",lineHeight:1.7}}>{d}</div></div>
          </div>
        ))}
      </div>
      <GBCallout type="tip">{tx.howFusionTip}</GBCallout>

      <GBSection id="lands" emoji="🌍" title={tx.howLandsTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howLandsP}</p>
      <GBCallout type="info">{tx.howLandsWarn(20)}</GBCallout>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
        {tx.howLandsSteps.map(([t,d],i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",background:"#f8f9fa",borderRadius:10,border:"1px solid #eee"}}>
            <div style={{background:"#0d2e0d",color:"#4CAF50",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{i+1}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#222",marginBottom:3}}>{t}</div><div style={{fontSize:12,color:"#666",lineHeight:1.7}}>{d}</div></div>
          </div>
        ))}
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:12}}>{tx.howLandsTableTitle}</h3>
      <div style={{overflowX:"auto",marginBottom:22}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#0d2e0d"}}>
              {[tx.howLandsColRarity,tx.howLandsColBoost,tx.howLandsColSlots,tx.howLandsColChance].map(h=>(
                <th key={h} style={{padding:"10px 12px",color:"rgba(255,255,255,.65)",fontWeight:600,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAND_RARITIES.map((r,i)=>(
              <tr key={r.id} style={{background:i%2===0?"#f8f9fa":"#fff",borderBottom:"1px solid #eee"}}>
                <td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><img src={LAND_IMGS[r.id]} alt={r.name} style={{width:28,height:28,objectFit:"contain"}}/><span style={{fontWeight:700,color:r.color}}>{r.name}</span></div></td>
                <td style={{padding:"10px 12px",fontWeight:700,color:"#4CAF50"}}>+{r.boostPercent}%</td>
                <td style={{padding:"10px 12px",fontWeight:600,color:"#333"}}>{r.minerSlots} miners</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{r.chance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GBCallout type="tip">{tx.howLandsTip}</GBCallout>

      <GBSection id="roi" emoji="📊" title={tx.howRoiTitle}/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>{tx.howRoiP}</p>
      <div style={{overflowX:"auto",marginBottom:22}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#1a1a2e"}}>
              {tx.howRoiCols.map(h=>(
                <th key={h} style={{padding:"11px 12px",color:"rgba(255,255,255,.65)",fontWeight:600,textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RARITIES.map((r,i)=>{
              const avg=(r.dailyMin+r.dailyMax)/2;
              return(
                <tr key={r.id} style={{background:i%2===0?"#f8f9fa":"#fff",borderBottom:"1px solid #eee"}}>
                  <td style={{padding:"12px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:30,height:30,objectFit:"contain",flexShrink:0}}/>
                      <span style={{fontWeight:700,color:r.color}}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 12px",color:"#666"}}>{r.chance}</td>
                  <td style={{padding:"12px 12px",color:"#555"}}>{r.dailyMin}–{r.dailyMax} DC</td>
                  <td style={{padding:"12px 12px",fontWeight:600,color:"#333"}}>{avg} DC</td>
                  <td style={{padding:"12px 12px",fontWeight:700,color:"#4CAF50"}}>~{Math.ceil(BOX_PRICE/avg)}d</td>
                  <td style={{padding:"12px 12px",color:"#555"}}>{r.nftAge}d</td>
                  <td style={{padding:"12px 12px",fontWeight:700,color:"#FF9800"}}>{(avg*r.nftAge).toFixed(0)} DC</td>
                  <td style={{padding:"12px 12px",color:"#555"}}>{r.repair} USD</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <GBCallout type="info">{tx.howRoiTip}</GBCallout>
      <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px 20px",marginBottom:28,border:"1px solid #eee"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>{tx.howRoiPortTitle}</div>
        <div style={{fontSize:12,color:"#666",lineHeight:2.1}}>
          {tx.howRoiPortItems.split('\n').map((line,i)=><span key={i}>{line}<br/></span>)}
        </div>
      </div>

      <GBSection id="autopickaxe" emoji="⛏️" title={tx.howAutoPickaxeTitle}/>
      <div style={{display:"flex",alignItems:"center",gap:16,background:"linear-gradient(135deg,#fffde7,#fff8e1)",borderRadius:12,padding:"18px 20px",marginBottom:22,border:"1px solid #FFD600"}}>
        <img src="/autopickaxe/autoPickaxe.png" alt="Auto Pickaxe" style={{width:72,height:72,objectFit:"contain",filter:"drop-shadow(0 0 10px #FFD60099)",flexShrink:0}}/>
        <p style={{fontSize:14,color:"#444",lineHeight:1.9,margin:0}}>{tx.howAutoPickaxeP}</p>
      </div>

      <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:14}}>{tx.howAutoPickaxeHowTitle}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {tx.howAutoPickaxeSteps.map(([title,desc],i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",background:"#fafafa",borderRadius:10,padding:"14px 16px",border:"1px solid #eee"}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"#FFD600",color:"#333",fontWeight:900,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:"#222",marginBottom:3}}>{title}</div>
              <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:14}}>{tx.howAutoPickaxePerksTitle}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10,marginBottom:22}}>
        {tx.howAutoPickaxePerks.map(([icon,title,desc])=>(
          <div key={title} style={{background:"#fff",borderRadius:10,padding:"14px 16px",border:"1px solid #eee",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0,lineHeight:1}}>{icon}</span>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:"#222",marginBottom:3}}>{title}</div>
              <div style={{fontSize:11,color:"#888",lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <GBCallout type="tip">{tx.howAutoPickaxeTip}</GBCallout>
      <GBCallout type="warning">{tx.howAutoPickaxeWarn}</GBCallout>

      <GBSection id="faq" emoji="❓" title={tx.howFaqTitle}/>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:36}}>
        {tx.howFaqItems.map(([q,a],i)=>(
          <details key={i} style={{background:"#f8f9fa",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}>
            <summary style={{padding:"13px 16px",fontSize:13,fontWeight:600,color:"#222",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",listStyle:"none"}}>
              <span>{q}</span><span style={{color:"#ccc",fontSize:16,flexShrink:0,marginLeft:8}}>›</span>
            </summary>
            <div style={{padding:"0 16px 14px",fontSize:12,color:"#666",lineHeight:1.75,borderTop:"1px solid #eee"}}>{a}</div>
          </details>
        ))}
      </div>
      <div style={{textAlign:"center",paddingTop:24,borderTop:"1px solid #f0f0f0"}}>
        <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:36,objectFit:"contain",opacity:.5,marginBottom:10,display:"block",margin:"0 auto 10px"}}/>
        <div style={{fontSize:11,color:"#ccc"}}>{tx.howFooter}</div>
      </div>
    </div>
  </div>
  );
}

// ══════════ ROADMAP MODAL ══════════
function RoadmapModal({onClose}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const PHASES=[
    {
      phase:"Phase 1",label:"Foundation",status:"done",color:"#4CAF50",
      items:[
        {done:true, text:"Core game loop — Deposit, Mine, Claim, Withdraw"},
        {done:true, text:"6 rarity tiers with balanced ROI"},
        {done:true, text:"Mystery Boxes (single & 10x bulk)"},
        {done:true, text:"Repair system — unlimited lifespan extensions"},
        {done:true, text:"Referral program — 4% per deposit"},
        {done:true, text:"Mine All & Claim All batch actions"},
        {done:true, text:"Full documentation (How It Works)"},
        {done:true, text:"Fusion — combine 2 miners into a rarer one"},
      ]
    },
    {
      phase:"Phase 2",label:"Expansion",status:"active",color:"#FF9800",
      items:[
        {done:false, text:"New Miner designs & exclusive seasonal rarities"},
        {done:false, text:"Marketplace — trade miners between players"},
        {done:true, text:"Lands — own a plot to boost your daily DIGCOIN production"},
        {done:false, text:"Leaderboard — top earners & top fusers"},
      ]
    },
    {
      phase:"Phase 3",label:"Game World",status:"soon",color:"#2196F3",
      items:[
        {done:false, text:"Dungeons — send miners on timed expeditions for rare loot"},
        {done:false, text:"PVP — pit miners against each other for stakes"},
        {done:false, text:"Guild system — pool miners and share rewards"},
        {done:false, text:"Daily quests & achievement rewards"},
      ]
    },
    {
      phase:"Phase 4",label:"Ecosystem",status:"future",color:"#9C27B0",
      items:[
        {done:false, text:"DIGCOIN on-chain token launch"},
        {done:false, text:"Cross-chain bridge support"},
      ]
    },
  ];
  const statusBadge={
    done:{label:"✅ Live",bg:"#1b3a1b",color:"#4CAF50"},
    active:{label:"🔨 In Progress",bg:"#3a2a10",color:"#FF9800"},
    soon:{label:"🗓️ Coming Soon",bg:"#1a2940",color:"#2196F3"},
    future:{label:"🔮 Future",bg:"#2a1a3a",color:"#9C27B0"},
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
      <div style={{background:"#0d0d1a",borderRadius:20,border:"1px solid rgba(255,255,255,.1)",width:"100%",maxWidth:680,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"24px 28px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'Outfit',sans-serif"}}>{tx.roadmapTitle}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:4}}>{tx.roadmapSubtitle}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.07)",border:"none",color:"rgba(255,255,255,.5)",fontSize:18,width:34,height:34,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* Body */}
        <div style={{overflowY:"auto",padding:"24px 28px 28px",display:"flex",flexDirection:"column",gap:24}}>
          {PHASES.map(p=>{
            const badge=statusBadge[p.status];
            return(
              <div key={p.phase}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:3,height:36,background:p.color,borderRadius:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,.35)",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>{p.phase}</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"'Outfit',sans-serif"}}>{p.label}</div>
                  </div>
                  <span style={{marginLeft:"auto",padding:"4px 12px",background:badge.bg,color:badge.color,borderRadius:20,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{badge.label}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,paddingLeft:15}}>
                  {p.items.map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 14px",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.05)"}}>
                      <span style={{fontSize:13,flexShrink:0,marginTop:1}}>{item.done?"✅":"⬜"}</span>
                      <span style={{fontSize:12,color:item.done?"rgba(255,255,255,.55)":"rgba(255,255,255,.8)",lineHeight:1.5,textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{textAlign:"center",paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.25)"}}>{tx.roadmapDisclaimer}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:12}}>
              <a href="https://t.me/+RFYExBlVNwk0NmE0" target="_blank" rel="noopener noreferrer" style={{padding:"7px 18px",background:"#0088cc",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none"}}>📢 Telegram</a>
              <a href="https://x.com/digminertempo" target="_blank" rel="noopener noreferrer" style={{padding:"7px 18px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"rgba(255,255,255,.65)",fontSize:11,fontWeight:700,textDecoration:"none"}}>𝕏 Twitter</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════ LAND COUNTDOWN BUTTON ══════════
function LandCountdownButton({targetMs,onBuy,loading}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const[now,setNow]=useState(Date.now());
  useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i);},[]);
  const open=now>=targetMs;
  const msLeft=Math.max(0,targetMs-now);
  const h=Math.floor(msLeft/3600000),m=Math.floor((msLeft%3600000)/60000),s=Math.floor((msLeft%60000)/1000);
  if(open) return(
    <button disabled={loading} onClick={onBuy} style={{padding:"11px 24px",background:"linear-gradient(135deg,#4CAF50,#8BC34A)",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(76,175,80,.4)",width:"100%"}}>
      {loading?"Opening...":tx.landBuyBtn(LAND_BOX_PRICE)}
    </button>
  );
  return(
    <div style={{background:"#f5f5f5",borderRadius:8,padding:"12px 14px",textAlign:"center",border:"1px solid #eee"}}>
      <div style={{color:"#888",fontSize:9,marginBottom:6,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>Sale opens in</div>
      <div style={{color:"#FF9800",fontSize:22,fontWeight:900,fontFamily:"'Press Start 2P',monospace"}}>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>
      <div style={{color:"#aaa",fontSize:9,marginTop:6}}>{tx.landBuyBtn(LAND_BOX_PRICE)} — available soon</div>
    </div>
  );
}

// ══════════ LAND REVEAL ══════════
function LandReveal({land,onClose}){
  const lang=useContext(LangCtx);const tx=T[lang];
  const[phase,setPhase]=useState(0);
  const r=LAND_RARITIES[land.rarityId]||LAND_RARITIES[0];
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),1000);const t2=setTimeout(()=>setPhase(2),2000);return()=>{clearTimeout(t1);clearTimeout(t2)};},[]);
  return(<div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
    {phase===0&&<div style={{animation:"shake .6s infinite",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
      <div style={{fontSize:80}}>📦</div>
      <div style={{color:"#4CAF50",fontSize:14,fontWeight:800,letterSpacing:2}}>OPENING LAND BOX...</div>
    </div>}
    {phase===1&&<div style={{fontSize:100,animation:"explode .8s forwards"}}>🌍</div>}
    {phase===2&&<div style={{textAlign:"center",animation:"popIn .5s ease",maxWidth:340}}>
      <div style={{color:"#4CAF50",fontSize:11,fontWeight:800,letterSpacing:2,marginBottom:8}}>YOU GOT A LAND!</div>
      <div style={{width:160,height:160,margin:"0 auto 16px",position:"relative"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle,${r.color}44 0%,transparent 70%)`}}/>
        <img src={LAND_IMGS[land.rarityId||0]} alt={r.name} style={{width:160,height:160,objectFit:"contain",filter:`drop-shadow(0 0 20px ${r.color})`}}/>
      </div>
      <div style={{color:r.color,fontSize:22,fontWeight:900,textShadow:`0 0 30px ${r.color}`,fontFamily:"'Press Start 2P',monospace",marginBottom:12}}>{r.name}!</div>
      <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:16}}>
        <div style={{background:"rgba(255,255,255,.07)",borderRadius:8,padding:"10px 16px",textAlign:"center"}}>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:9,marginBottom:4}}>BOOST</div>
          <div style={{color:"#4CAF50",fontWeight:800,fontSize:18}}>+{r.boostPercent}%</div>
        </div>
        <div style={{background:"rgba(255,255,255,.07)",borderRadius:8,padding:"10px 16px",textAlign:"center"}}>
          <div style={{color:"rgba(255,255,255,.4)",fontSize:9,marginBottom:4}}>SLOTS</div>
          <div style={{color:"#FFD600",fontWeight:800,fontSize:18}}>{r.minerSlots}</div>
        </div>
      </div>
      <button onClick={onClose} style={{padding:"10px 36px",background:r.color,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Awesome!</button>
    </div>}
  </div>);
}

// ══════════ PATCH NOTES ══════════
const PATCHES = [
  {
    version:"v1.5",
    date:"2026-04-18",
    title:"Design Overhaul & Mobile Support",
    tags:["ui","feature"],
    changes:[
      "Navbar redesigned in RuneScape Old School style",
      "Mobile responsive layout: hamburger dropdown menu on small screens and full system responsive",
      "Transaction history now displayed inside a styled panel with dark readable text",
      "Stats bar label changed from NFT to Miners",
    ],
  },
  {
    version:"v1.4",
    date:"2026-04-16",
    title:"Auto Pickaxe",
    tags:["feature","economy"],
    changes:[
      "Added Auto Pickaxe — a lifetime tool available in the Shop for 3,000 DC (supply: 500 units)",
      "Auto Pickaxe ON: server automatically claims and restarts all miners every cycle — no app interaction required",
      "Auto Pickaxe ON: Mine All & Claim All fees permanently waived",
      "Toggle ON/OFF at any time from the My NFT tab",
      "Added Auto Pickaxe section to How It Works documentation",
    ],
  },
  {
    version:"v1.3",
    date:"2026-04-16",
    title:"NFT Inventory Visual Update",
    tags:["ui","feature"],
    changes:[
      "Miner cards now display a 🌍 LAND badge when assigned to a land plot",
      "Miner cards already showed ⚡ FUSED badge — now both badges appear side by side",
      "Added 'In Land' filter button to the My NFT tab to show only land-assigned miners",
      "Farm Calculator updated: boosts column shows FUSED and LAND badges per miner",
      "Farm Simulator now includes Land Boost selector and Fusion Potential calculator",
    ],
  },
  {
    version:"v1.2",
    date:"2026-04-15",
    title:"Lands System",
    tags:["feature","economy"],
    changes:[
      "Introduced Land Boxes in the Shop — 300 DC each, limited supply of 1,000 total",
      "6 land rarities: Common (+5%), UnCommon (+10%), Rare (+15%), Super Rare (+20%), Legendary (+25%), Mythic (+35%)",
      "Lands boost miner daily earnings at claim time — assign idle miners to your land",
      "Each land has a fixed number of miner slots based on rarity (2–8 slots)",
      "Land supply progress bar visible in Shop — shows remaining / 1,000",
      "My NFT tab: land cards show assigned miners, assign/unassign buttons",
      "Transaction History now includes fusions, Play All fees and Claim All fees",
    ],
  },
  {
    version:"v1.1",
    date:"2026-04-16",
    title:"Mine All & Claim All Fee Reduction",
    tags:["balance","economy"],
    changes:[
      "Play All (Mine All) fee reduced from 10 DC to 5 DC per miner",
      "Claim All fee reduced from 10 DC to 5 DC per miner",
      "Fee amount now shown directly on all Mine All and Claim All buttons",
      "Example: 10 miners → Mine All costs 50 DC (was 100 DC)",
    ],
  },
  {
    version:"v1.0",
    date:"2026-04-14",
    title:"Fusion System",
    tags:["feature","economy"],
    changes:[
      "Introduced Fusion — sacrifice 2 same-rarity miners to forge 1 stronger miner at the next tier",
      "Fused miners earn 20% more than both parents combined (e.g. 2× Common → UnCommon at ×2.4 earnings)",
      "Fusion costs 50 DC and requires both miners to be Idle",
      "Fused miners inherit combined lifespan of both parents",
      "Fused miners cannot be fused again",
      "⚡ FUSED badge displayed on fused miner cards",
      "Fusion reveal animation added",
      "How It Works: full Fusion documentation section added",
    ],
  },
];

const TAG_COLORS={feature:"#2196F3",economy:"#FF9800",balance:"#4CAF50",ui:"#9C27B0",fix:"#EF5350"};

function PatchNotes(){
  return(
    <div style={{minHeight:"100vh",backgroundImage:"url('/design/bg.png')",backgroundSize:"cover",backgroundAttachment:"fixed",backgroundPosition:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:"32px 20px"}}>
      <div style={{maxWidth:780,margin:"0 auto"}}>
        {/* Header */}
        <div className="wp" style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
          <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:48,objectFit:"contain",filter:"drop-shadow(0 0 12px #FF9800)"}}/>
          <div>
            <h1 style={{fontSize:22,fontWeight:900,color:"#3a1a00",margin:0}}>Patch Notes</h1>
            <p style={{fontSize:11,color:"#7a5020",margin:0}}>All updates to DigMiner — newest first</p>
          </div>
          <a href="/" style={{marginLeft:"auto",padding:"8px 18px",background:"linear-gradient(to bottom,#3a2000,#1a0e00)",border:"2px solid #8B6914",borderRadius:4,color:"#FFD600",fontSize:12,fontWeight:700,textDecoration:"none",fontFamily:"Georgia,serif"}}>← Back</a>
        </div>

        {/* Patches */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {PATCHES.map((p,i)=>(
            <div key={p.version} className="pn-card">
              {/* Patch header */}
              <div style={{background:"linear-gradient(to bottom,#5a3010,#3a1a00)",padding:"12px 16px",marginBottom:12,borderRadius:3,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",margin:"-18px -22px 16px -22px"}}>
                <div style={{background:i===0?"#FFD600":"rgba(255,255,255,.15)",color:i===0?"#333":"#fff",fontWeight:900,fontSize:12,padding:"3px 12px",borderRadius:12}}>{p.version}</div>
                <h2 style={{color:"#FFD600",fontSize:15,fontWeight:800,margin:0,flex:1}}>{p.title}</h2>
                <div style={{fontSize:10,color:"rgba(255,255,255,.6)"}}>{p.date}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {p.tags.map(t=>(
                    <span key={t} style={{padding:"2px 8px",borderRadius:10,fontSize:9,fontWeight:700,background:(TAG_COLORS[t]||"#888")+"22",color:TAG_COLORS[t]||"#aaa",border:`1px solid ${TAG_COLORS[t]||"#888"}44`}}>{t}</span>
                  ))}
                </div>
              </div>
              {/* Changes */}
              <ul style={{margin:0,paddingLeft:20,display:"flex",flexDirection:"column",gap:6}}>
                {p.changes.map((c,j)=>(
                  <li key={j} style={{fontSize:13,color:"#3a1a00",lineHeight:1.6}}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",marginTop:24,color:"rgba(255,255,255,.4)",fontSize:11}}>
          DigMiner • digminer.xyz
        </div>
      </div>
    </div>
  );
}

// ══════════ MAIN APP ══════════
export default function DigMinerApp(){
  const AUTH_KEY="digminer_token";
  const[wallet,setWallet]=useState(null);
  const[authToken,setAuthToken]=useState(()=>localStorage.getItem(AUTH_KEY)||null);
  const[tab,setTab]=useState("account");
  const[digcoin,setDigcoin]=useState(0);
  const[pathUSDBalance,setPathUSDBalance]=useState("0.0000");
  const[miners,setMiners]=useState([]);
  const[revealing,setRevealing]=useState(null);
  const[notif,setNotif]=useState(null);
  const[depositAmt,setDepositAmt]=useState("");
  const[withdrawAmt,setWithdrawAmt]=useState("");
  const[filter,setFilter]=useState("All");
  const[loading,setLoading]=useState(false);
  const[txLoading,setTxLoading]=useState("");
  const[withdrawCooldown,setWithdrawCooldown]=useState(0);
  const[transactions,setTransactions]=useState([]);
  const[stats,setStats]=useState({totalPlayers:0,totalMiners:0,aliveMiners:0,total_deposited:0,total_withdrawn:0});
  const[referralLink,setReferralLink]=useState("");
  // Maintenance (public — affects all users)
  const[maintenanceMode,setMaintenanceMode]=useState(false);
  // Admin
  const[isAdmin,setIsAdmin]=useState(false);
  const[maintenance,setMaintenance]=useState(false);
  const[adminTo,setAdminTo]=useState("");
  const[adminAmt,setAdminAmt]=useState("");
  const[adminReason,setAdminReason]=useState("");
  const[adminLog,setAdminLog]=useState([]);
  const[adminPlayers,setAdminPlayers]=useState([]);
  const[withdrawDay,setWithdrawDay]=useState(()=>new Date().toISOString().slice(0,10));
  const[withdrawReport,setWithdrawReport]=useState(null);
  const[withdrawLoading,setWithdrawLoading]=useState(false);
  const[depositDay,setDepositDay]=useState(()=>new Date().toISOString().slice(0,10));
  const[depositReport,setDepositReport]=useState(null);
  const[depositLoading,setDepositLoading]=useState(false);
  const[adminLoading,setAdminLoading]=useState("");
  const[giftWallets,setGiftWallets]=useState("");
  const[giftResults,setGiftResults]=useState(null);
  const[fuseMode,setFuseMode]=useState(false);
  const[fuseSelected,setFuseSelected]=useState([]);
  const[fuseReveal,setFuseReveal]=useState(null);
  const[showRoadmap,setShowRoadmap]=useState(false);
  const[lands,setLands]=useState([]);
  const[landSaleStartMs,setLandSaleStartMs]=useState(null);
  const[landsMinted,setLandsMinted]=useState(0);
  const[landMaxSupply,setLandMaxSupply]=useState(1000);
  const[landLoading,setLandLoading]=useState("");
  const[assigningLandId,setAssigningLandId]=useState(null);
  const[landReveal,setLandReveal]=useState(null);
  const[autoPickaxe,setAutoPickaxe]=useState({owned:false,active:false});
  const[autoPickaxesMinted,setAutoPickaxesMinted]=useState(0);
  const[autoPickaxeLoading,setAutoPickaxeLoading]=useState(false);
  const[lang,setLang]=useState(()=>localStorage.getItem("digminer_lang")||"en");
  const tx=T[lang];
  const toggleLang=()=>{const nl=lang==="en"?"zh":"en";setLang(nl);localStorage.setItem("digminer_lang",nl);};

  const notify=(msg,ok=true)=>{setNotif({msg,ok});setTimeout(()=>setNotif(null),4000);};


  // Check maintenance status on mount and every 30s
  useEffect(()=>{
    const check=()=>fetch("/api/maintenance").then(r=>r.json()).then(d=>setMaintenanceMode(!!d.maintenance)).catch(()=>{});
    check();
    const interval=setInterval(check,30000);
    return()=>clearInterval(interval);
  },[]);

  // Load global stats on mount
  useEffect(()=>{
    const loadStats = async () => {
      try {
        const d = await fetch("/api/stats").then(r=>r.json());
        // Read actual on-chain pool balance instead of calculating from DB
        try {
          const provider = new ethers.JsonRpcProvider("https://rpc.tempo.xyz");
          const pool = new ethers.Contract(CONTRACTS.POOL, ["function poolBalance() external view returns (uint256)"], provider);
          const [bal, dec] = await Promise.all([
            pool.poolBalance(),
            new ethers.Contract(CONTRACTS.PATHUSD, ["function decimals() external view returns (uint8)"], provider).decimals(),
          ]);
          d.pool_balance = parseFloat(ethers.formatUnits(bal, dec));
        } catch(_) {}
        setStats(d);
        if(d.landSaleStartMs) setLandSaleStartMs(d.landSaleStartMs);
        if(d.landsMinted!=null) setLandsMinted(d.landsMinted);
        if(d.landMaxSupply) setLandMaxSupply(d.landMaxSupply);
        if(d.autoPickaxesMinted!=null) setAutoPickaxesMinted(d.autoPickaxesMinted);
      } catch(_) {}
    };
    loadStats();
  },[]);

  const getProvider=()=>new ethers.BrowserProvider(window.ethereum);

  const loadPathUSDBalance=async(address)=>{
    try{
      const provider=getProvider();
      const token=new ethers.Contract(CONTRACTS.PATHUSD,PATHUSD_ABI,provider);
      const[bal,dec]=await Promise.all([token.balanceOf(address),token.decimals()]);
      setPathUSDBalance(parseFloat(ethers.formatUnits(bal,dec)).toFixed(4));
    }catch(e){console.error("pathUSD balance error:",e.message);}
  };

  const loadPlayer=useCallback(async(address)=>{
    try{
      const res=await fetch(`/api/player/${address}`);
      if(!res.ok) return; // player not registered yet or invalid address — silently skip
      const data=await res.json();
      setDigcoin(data.player.digcoinBalance);
      setMiners(data.miners);
      if(data.autoPickaxe) setAutoPickaxe(data.autoPickaxe);
      setReferralLink(`${window.location.origin}?ref=${address}`);
      try{const ld=await fetch(`/api/land/${address}`).then(r=>r.ok?r.json():{lands:[]});setLands(ld.lands||[]);}catch(_){}
      await loadPathUSDBalance(address);
      // Check withdraw cooldown — use stored token directly (history endpoint requires auth)
      try{
        const token=localStorage.getItem("digminer_token");
        const hist=await fetch(`/api/history/${address}?limit=5`,{
          headers:token?{Authorization:`Bearer ${token}`}:{},
        }).then(r=>r.ok?r.json():{transactions:[]});
        const lastW=hist.transactions?.find(t=>t.type==="withdraw");
        if(lastW){
          const elapsed=Date.now()-new Date(lastW.date).getTime();
          const rem=24*60*60*1000-elapsed;
          setWithdrawCooldown(rem>0?rem:0);
        }else{
          setWithdrawCooldown(0);
        }
      }catch(_){}
    }catch(e){console.error("loadPlayer error:",e.message);}
  },[]);

  const loadTransactions=async(address)=>{
    try{
      const res=await authFetch(`/api/history/${address}?limit=30`);
      const data=await res.json();
      setTransactions(data.transactions||[]);
    }catch(e){console.error("tx history error:",e.message);}
  };


  const ensureTempoNetwork=async()=>{
    try{
      await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:TEMPO_CHAIN.chainId}]});
    }catch(err){
      if(err.code===4902||err.code===-32603){
        try{
          await window.ethereum.request({method:"wallet_addEthereumChain",params:[TEMPO_CHAIN]});
        }catch(addErr){
          // Network already exists with same RPC — just proceed, user is on it
          if(!addErr.message?.includes("same RPC")&&!addErr.message?.includes("already exists")){
            throw addErr;
          }
        }
      } else if(err.code!==4001){ // 4001 = user rejected, re-throw that
        // Switch failed for unknown reason — just proceed and let MetaMask handle it
        console.warn("Network switch warning:",err.message);
      } else throw err;
    }
  };

  // Sign-in with Ethereum: get nonce → sign → get session token (valid 24h)
  const signIn=async(address)=>{
    const w=address.toLowerCase();
    const{message}=await fetch(`/api/nonce/${w}`).then(r=>r.json());
    notify("Sign the message in MetaMask to authenticate (no gas needed)...");
    const signature=await window.ethereum.request({method:"personal_sign",params:[message,address]});
    const res=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wallet:address,signature})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Auth failed");
    localStorage.setItem(AUTH_KEY,data.token);
    setAuthToken(data.token);
    return data.token;
  };

  // Fetch wrapper that adds the auth token; auto re-auths on 401; detects 503 maintenance
  const authFetch=async(url,opts={})=>{
    const token=localStorage.getItem(AUTH_KEY);
    const headers={"Content-Type":"application/json",...(opts.headers||{})};
    if(token) headers["Authorization"]=`Bearer ${token}`;
    let res=await fetch(url,{...opts,headers});
    if(res.status===503){setMaintenanceMode(true);return res;}
    if(res.status===401&&wallet){
      try{
        const newToken=await signIn(wallet);
        headers["Authorization"]=`Bearer ${newToken}`;
        res=await fetch(url,{...opts,headers});
      }catch(_){}
    }
    return res;
  };

  const checkAdminStatus=async()=>{
    try{
      const res=await authFetch("/api/admin/status");
      if(res.ok){const d=await res.json();setIsAdmin(true);setMaintenance(d.maintenance);}
      else setIsAdmin(false);
    }catch(_){setIsAdmin(false);}
  };

  const connectWallet=async()=>{
    if(!window.ethereum) return notify("MetaMask not found! Install it first.",false);
    try{
      setLoading(true);
      const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
      const address=accounts[0];
      await ensureTempoNetwork();
      // Authenticate with wallet signature (proves ownership)
      await signIn(address);
      // Register / load player
      await authFetch("/api/register",{method:"POST",body:JSON.stringify({wallet:address,referrer:new URLSearchParams(window.location.search).get("ref")})});
      setWallet(address);
      await loadPlayer(address);
      await loadTransactions(address);
      await checkAdminStatus();
      notify("Wallet connected!");
    }catch(e){notify(e.message.slice(0,80),false);}
    finally{setLoading(false);}
  };

  // Auto-reconnect on page refresh: if MetaMask already has permission + session token exists,
  // restore the session silently without asking the user to sign again
  useEffect(()=>{
    if(!window.ethereum) return;
    window.ethereum.request({method:"eth_accounts"}).then(async(accounts)=>{
      if(!accounts.length) return; // MetaMask not connected
      const token=localStorage.getItem(AUTH_KEY);
      if(!token) return; // no session token — user must connect manually
      const address=accounts[0];
      try{
        setWallet(address);
        await loadPlayer(address);
        // Load transactions with token directly (avoid stale closure issue)
        const histRes=await fetch(`/api/history/${address}?limit=30`,{headers:{Authorization:`Bearer ${token}`}});
        if(histRes.ok){const d=await histRes.json();setTransactions(d.transactions||[]);}
        // Check admin status
        const adminRes=await fetch("/api/admin/status",{headers:{Authorization:`Bearer ${token}`}});
        if(adminRes.ok){const d=await adminRes.json();setIsAdmin(true);setMaintenance(d.maintenance);}
      }catch(_){}
    }).catch(()=>{});
  },[loadPlayer]);

  // Auto-refresh miner state every 60s so timers flip to "Ready" without manual interaction
  useEffect(()=>{
    if(!wallet) return;
    const id=setInterval(()=>loadPlayer(wallet),60000);
    return()=>clearInterval(id);
  },[wallet,loadPlayer]);

  // Listen for account/chain changes
  useEffect(()=>{
    if(!window.ethereum) return;
    const onAccounts=(accs)=>{
      // Always clear session on any account change (disconnect or switch)
      setWallet(null);setMiners([]);setDigcoin(0);setTransactions([]);
      setWithdrawCooldown(0);setIsAdmin(false);setPathUSDBalance("0.0000");
      localStorage.removeItem(AUTH_KEY);setAuthToken(null);
      if(accs.length>0){
        // User switched to a different account — notify them to reconnect
        notify("Wallet changed — please connect again",false);
      }
    };
    window.ethereum.on("accountsChanged",onAccounts);
    return()=>window.ethereum.removeListener("accountsChanged",onAccounts);
  },[]);

  const toggleMaintenance=async()=>{
    try{
      setAdminLoading("maint");
      const res=await authFetch("/api/admin/maintenance",{method:"POST",body:JSON.stringify({enabled:!maintenance})});
      const d=await res.json();
      if(!res.ok) return notify(d.error,false);
      setMaintenance(d.maintenance);
      setMaintenanceMode(d.maintenance);
      notify(d.maintenance?"🔴 Maintenance ON — game blocked for all players":"🟢 Maintenance OFF — game is live");
    }catch(e){notify(e.message,false);}
    finally{setAdminLoading("");}
  };

  const adminSendDigcoin=async()=>{
    if(!adminTo||!adminAmt) return notify("Fill wallet and amount",false);
    try{
      setAdminLoading("send");
      const res=await authFetch("/api/admin/send-digcoin",{method:"POST",body:JSON.stringify({toWallet:adminTo,amount:parseFloat(adminAmt),reason:adminReason})});
      const d=await res.json();
      if(!res.ok) return notify(d.error,false);
      setAdminLog(l=>[{wallet:d.wallet,amount:d.amountSent,reason:d.reason,ts:new Date().toLocaleString()},...l.slice(0,19)]);
      setAdminTo("");setAdminAmt("");setAdminReason("");
      notify(`✅ Sent ${d.amountSent} DC to ${d.wallet.slice(0,10)}...`);
    }catch(e){notify(e.message,false);}
    finally{setAdminLoading("");}
  };

  const adminGiftBoxes=async()=>{
    const wallets=giftWallets.split(/[\n,]+/).map(w=>w.trim()).filter(w=>w.length>0);
    if(!wallets.length) return notify("Paste at least one wallet address",false);
    if(wallets.length>50) return notify("Max 50 wallets per batch",false);
    try{
      setAdminLoading("gift");setGiftResults(null);
      const res=await authFetch("/api/admin/gift-boxes",{method:"POST",body:JSON.stringify({wallets})});
      const d=await res.json();
      if(!res.ok) return notify(d.error,false);
      setGiftResults(d);
      notify(`🎁 Done: ${d.sent} sent, ${d.failed} failed`);
    }catch(e){notify(e.message,false);}
    finally{setAdminLoading("");}
  };

  const loadAdminPlayers=async()=>{
    try{
      const res=await authFetch("/api/admin/players");
      const d=await res.json();
      if(res.ok) setAdminPlayers(d.players||[]);
    }catch(_){}
  };

  const loadDepositsByDay=async()=>{
    try{
      setDepositLoading(true);
      const res=await authFetch(`/api/admin/deposits-by-day?date=${depositDay}`);
      const d=await res.json();
      if(res.ok) setDepositReport(d);
      else notify(d.error,false);
    }catch(_){}
    finally{setDepositLoading(false);}
  };

  const loadWithdrawalsByDay=async()=>{
    try{
      setWithdrawLoading(true);
      const res=await authFetch(`/api/admin/withdrawals-by-day?date=${withdrawDay}`);
      const d=await res.json();
      if(res.ok) setWithdrawReport(d);
      else notify(d.error,false);
    }catch(_){}
    finally{setWithdrawLoading(false);}
  };

  const doDeposit=async()=>{
    const amount=parseFloat(depositAmt);
    if(!amount||amount<=0) return notify("Invalid amount",false);
    if(!wallet) return notify("Connect wallet first",false);
    try{
      setTxLoading("deposit");
      const provider=getProvider();
      const signer=await provider.getSigner();
      const token=new ethers.Contract(CONTRACTS.PATHUSD,PATHUSD_ABI,signer);
      const pool=new ethers.Contract(CONTRACTS.POOL,MINERPOOL_ABI,signer);
      const decimals=await token.decimals();
      const amountWei=ethers.parseUnits(amount.toFixed(Number(decimals)),decimals);

      notify("Step 1/2: Approving pathUSD...");
      const approveTx=await token.approve(CONTRACTS.POOL,amountWei);
      await approveTx.wait();

      notify("Step 2/2: Depositing...");
      const depositTx=await pool.deposit(amountWei);
      const receipt=await depositTx.wait();

      // Notify backend — tx_hash prevents double-credit if event poller also picks it up
      await authFetch("/api/deposit",{method:"POST",body:JSON.stringify({wallet,amountPathUSD:amount,txHash:receipt.hash})});

      setDepositAmt("");
      await loadPlayer(wallet);
      await loadTransactions(wallet);
      notify(`+${(amount*DIG_RATE).toFixed(0)} DIGCOIN deposited!`);
    }catch(e){notify(e.reason||e.message.slice(0,80),false);}
    finally{setTxLoading("");}
  };

  const doWithdraw=async()=>{
    const amount=parseFloat(withdrawAmt);
    if(!amount||amount<=0) return notify("Invalid amount",false);
    if(amount>digcoin) return notify("Insufficient DIGCOIN balance!",false);
    if(!wallet) return notify("Connect wallet first",false);
    try{
      setTxLoading("withdraw");
      notify("Getting signature from backend...");
      const res=await authFetch("/api/withdraw",{method:"POST",body:JSON.stringify({wallet,amountDigcoin:amount})});
      const data=await res.json();
      if(!res.ok){
        if(data.cooldownMs) setWithdrawCooldown(data.cooldownMs);
        return notify(data.error,false);
      }

      const{signature:sigData}=data;
      const provider=getProvider();
      const signer=await provider.getSigner();
      const pool=new ethers.Contract(CONTRACTS.POOL,MINERPOOL_ABI,signer);

      notify("Sending withdrawal transaction...");
      const tx=await pool.withdraw(sigData.amount,sigData.deadline,sigData.signature);
      await tx.wait();

      setWithdrawAmt("");
      await loadPlayer(wallet);
      await loadTransactions(wallet);
      notify(`Withdrawn! ${data.netPathUSD.toFixed(4)} pathUSD sent to wallet`);
    }catch(e){notify(e.reason||e.message.slice(0,80),false);}
    finally{setTxLoading("");}
  };

  const buyBox=async(qty)=>{
    const cost=qty===10?BOX_10_PRICE:BOX_PRICE*qty;
    if(digcoin<cost) return notify(`Need ${cost} DIGCOIN. Deposit pathUSD first!`,false);
    try{
      setTxLoading("box");
      const res=await authFetch("/api/box/buy",{method:"POST",body:JSON.stringify({wallet,quantity:qty})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      if(qty===1){
        setRevealing(data.miners[0]);
      }else{
        setMiners(p=>[...data.miners,...p]);
        notify(`${qty} boxes opened! Check My NFT tab.`);
      }
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };


  const closeReveal=async()=>{
    setRevealing(null);
    if(wallet) await loadPlayer(wallet);
  };

  const toggleFuseSelect=(miner)=>{
    if(!fuseMode) return;
    if(miner.isMining) return notify(tx.cantFuseMining,false);
    if(miner.isFused) return notify(tx.cantFuseFused,false);
    if(miner.rarityId>=5) return notify(tx.cantFuseMythic,false);
    // Enforce same rarity as first selected
    if(fuseSelected.length===1 && !fuseSelected.find(m=>m.id===miner.id)){
      if(fuseSelected[0].rarityId!==miner.rarityId){
        return notify(tx.cantFuseDiffRarity(RARITIES[fuseSelected[0].rarityId].name),false);
      }
    }
    setFuseSelected(prev=>{
      if(prev.find(m=>m.id===miner.id)) return prev.filter(m=>m.id!==miner.id);
      if(prev.length>=2) return [prev[1],miner];
      return [...prev,miner];
    });
  };

  const executeFuse=async()=>{
    if(fuseSelected.length!==2) return notify(tx.selectExactly2,false);
    if(digcoin<FUSE_COST) return notify(tx.needDCToFuse(FUSE_COST),false);
    try{
      setTxLoading("fuse");
      const res=await authFetch("/api/miner/fuse",{method:"POST",body:JSON.stringify({wallet,minerId1:fuseSelected[0].id,minerId2:fuseSelected[1].id})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      setFuseSelected([]);
      setFuseMode(false);
      setFuseReveal(data.miner);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const closeFuseReveal=async()=>{
    setFuseReveal(null);
    if(wallet) await loadPlayer(wallet);
  };

  const startMiner=async(id)=>{
    try{
      setTxLoading(`mine_${id}`);
      const res=await authFetch(`/api/play/${id}`,{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(tx.notifyMining);
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const claimMiner=async(id)=>{
    try{
      setTxLoading(`claim_${id}`);
      const res=await authFetch(`/api/claim/${id}`,{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(tx.notifyClaimed(data.reward));
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const playAll=async()=>{
    try{
      setTxLoading("playall");
      const res=await authFetch("/api/play-all",{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(tx.notifyMiners(data.started,data.fee));
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const claimAll=async()=>{
    try{
      setTxLoading("claimall");
      const res=await authFetch("/api/claim-all",{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(tx.notifyClaimedAll(data.netReward,data.claimed,data.claimAllFee));
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const repairMiner=async(id)=>{
    try{
      setTxLoading(`repair_${id}`);
      const res=await authFetch(`/api/repair/${id}`,{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(tx.notifyRepaired(data.costDigcoin));
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const buyLandBox=async(qty=1)=>{
    const cost=qty===10?LAND_BOX_10_PRICE:LAND_BOX_PRICE*qty;
    if(digcoin<cost) return notify(`Need ${cost} DIGCOIN!`,false);
    if(landSaleStartMs&&Date.now()<landSaleStartMs) return notify("Land sale hasn't opened yet!",false);
    try{
      setLandLoading("buy");
      const res=await authFetch("/api/land/buy",{method:"POST",body:JSON.stringify({wallet,quantity:qty})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      if(qty===1){
        setLandReveal(data.lands[0]);
      }else{
        await loadPlayer(wallet);
        notify(`${qty} Mystery Land Boxes opened! Check My NFT tab.`);
        return;
      }
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setLandLoading("");}
  };

  const buyAutoPickaxe=async()=>{
    if(digcoin<AUTO_PICKAXE_PRICE) return notify(`Need ${AUTO_PICKAXE_PRICE} DIGCOIN to buy Auto Pickaxe!`,false);
    try{
      setAutoPickaxeLoading(true);
      const res=await authFetch("/api/buy-auto-pickaxe",{method:"POST",body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      setAutoPickaxe(data.autoPickaxe);
      setAutoPickaxesMinted(v=>v+1);
      notify("⛏️ Auto Pickaxe activated! Fees waived forever.");
    }catch(e){notify(e.message,false);}
    finally{setAutoPickaxeLoading(false);}
  };

  const toggleAutoPickaxe=async(active)=>{
    try{
      setAutoPickaxeLoading(true);
      const res=await authFetch("/api/toggle-auto-pickaxe",{method:"POST",body:JSON.stringify({wallet,active})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      setAutoPickaxe(data.autoPickaxe);
      notify(active?"⛏️ Auto Pickaxe ON — fees waived!":"Auto Pickaxe paused — fees apply.");
    }catch(e){notify(e.message,false);}
    finally{setAutoPickaxeLoading(false);}
  };

  const doAssignMiner=async(landId,minerId)=>{
    try{
      setLandLoading(`assign_${minerId}`);
      const res=await authFetch("/api/land/assign",{method:"POST",body:JSON.stringify({wallet,landId,minerId})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      setAssigningLandId(null);
      await loadPlayer(wallet);
      notify("Miner assigned!");
    }catch(e){notify(e.message,false);}
    finally{setLandLoading("");}
  };

  const doUnassignMiner=async(minerId)=>{
    try{
      setLandLoading(`unassign_${minerId}`);
      const res=await authFetch("/api/land/unassign",{method:"POST",body:JSON.stringify({wallet,minerId})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      await loadPlayer(wallet);
      notify("Miner unassigned.");
    }catch(e){notify(e.message,false);}
    finally{setLandLoading("");}
  };

  const alive=miners.filter(m=>m.isAlive&&!m.needsRepair);
  const idleMiners=miners.filter(m=>m.isIdle);
  const miningMiners=miners.filter(m=>m.isMining);
  const readyMiners=miners.filter(m=>m.canClaim);
  const canMineAny=idleMiners.length>0;
  const canClaimAny=readyMiners.length>0;
  const canPlayAny=canClaimAny; // backward compat
  const playableCount=readyMiners.length;
  const minerInLandSet=useMemo(()=>{const s=new Set();for(const land of lands)for(const a of land.assignedMiners||[])s.add(a.minerId);return s;},[lands]);
  const filtered=filter==="All"?miners:filter==="In Land"?miners.filter(m=>minerInLandSet.has(m.id)):miners.filter(m=>m.rarityName===filter);
  const fc={All:miners.length,"In Land":miners.filter(m=>minerInLandSet.has(m.id)).length};RARITIES.forEach(r=>{fc[r.name]=miners.filter(m=>m.rarityName===r.name).length;});
  const TABS=[tx.tabAccount,tx.tabNft,tx.tabShop,tx.tabCalc,tx.tabHow,...(isAdmin?[tx.tabAdmin]:[])];
  const tabMap={[tx.tabAccount]:"account",[tx.tabNft]:"nft",[tx.tabShop]:"shop",[tx.tabCalc]:"calc",[tx.tabHow]:"how",[tx.tabAdmin]:"admin"};
  const[menuOpen,setMenuOpen]=useState(false);

  if(window.location.pathname==='/patchnotes') return <PatchNotes/>;

  return(<LangCtx.Provider value={lang}><div style={{minHeight:"100vh",backgroundImage:"url('/design/bg.png')",backgroundSize:"cover",backgroundAttachment:"fixed",backgroundPosition:"center",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}
      @keyframes explode{0%{transform:scale(1);opacity:1}100%{transform:scale(3);opacity:0}}
      @keyframes popIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      body{overflow-x:hidden} input:focus{outline:2px solid #FF9800} button:hover:not(:disabled){filter:brightness(1.1)} button:active:not(:disabled){transform:scale(.97)} button:disabled{opacity:.6;cursor:not-allowed}

      /* === WOOD PANEL === */
      .wp{background:linear-gradient(to bottom,#e8d8b0,#d4bc7c,#e0cc94);border:8px solid #6b3c10;border-radius:6px;box-shadow:0 0 0 2px #2a1008,0 6px 18px rgba(0,0,0,.55),inset 0 2px 3px rgba(255,255,255,.25);margin-bottom:14px;padding:18px 22px}
      .wp h3,.wp h2{color:#3a1a00;margin-bottom:8px}
      .wp p,.wp label{color:#5a3810}
      .wp table thead tr{background:rgba(90,48,16,.12)!important}
      .wp table tbody tr{border-bottom:1px solid rgba(90,48,16,.15)!important}
      .wp input,.wp textarea{border:1px solid #c8a870!important;background:rgba(255,255,255,.55)!important;border-radius:6px}
      .wp-dark{background:linear-gradient(to bottom,#7a4818,#5a3010,#7a4818);border-radius:6px;box-shadow:0 0 0 2px #2a1008,0 8px 24px rgba(0,0,0,.6);margin-bottom:14px;padding:8px}
      .wp-dark>.wp-in{background:linear-gradient(to bottom,#e8d8b0,#d4bc7c,#e0cc94);border-radius:3px;padding:18px 22px;height:100%}

      /* === STATS BAR === */
      .sb{background:linear-gradient(to bottom,#7a4818,#5a3010,#7a4818);border-radius:6px;box-shadow:0 0 0 2px #2a1008,0 8px 24px rgba(0,0,0,.6);margin-bottom:16px;padding:8px}
      .sb-in{display:flex;background:linear-gradient(to bottom,#e0cfa0,#cbb87a,#d8c490);border-radius:3px;flex-wrap:wrap}

      /* === GRIDS === */
      .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
      .g2-16{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .g-miners{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
      .g-lands{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}

      /* === MAIN === */
      .dig-main{max-width:1100px;margin:0 auto;padding:20px}

      /* === HEADER (OSRS style) === */
      .dig-header{background:linear-gradient(to bottom,#2e1f06 0%,#1a1000 40%,#231608 70%,#2e1f06 100%);border-top:3px solid #c8a020;border-bottom:3px solid #6b4800;height:68px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,200,0,.15)}
      .osrs-btn{padding:6px 12px;background:linear-gradient(to bottom,#3d2b08,#1e1200);border:2px solid #8B6914;border-radius:3px;color:#FFD600;font-size:10px;font-weight:700;cursor:pointer;font-family:Georgia,serif;transition:filter .1s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;line-height:1}
      .osrs-btn:hover{filter:brightness(1.2)}
      .osrs-btn.active{background:linear-gradient(to bottom,#8B6914,#5a4008);color:#fff;border-color:#FFD600}
      .nav-tabs{display:flex;gap:3px;flex-wrap:wrap;align-items:center;justify-content:center;flex:1}
      .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px;background:none;border:none}
      .hamburger span{display:block;width:22px;height:2px;background:#FFD600;border-radius:2px}
      .mobile-menu{display:none;position:absolute;top:68px;left:0;right:0;background:#1a1000;border-bottom:3px solid #6b4800;z-index:199;padding:10px 16px;flex-direction:column;gap:6px;box-shadow:0 8px 20px rgba(0,0,0,.8)}
      .mobile-menu.open{display:flex}
      .mobile-menu .osrs-btn{width:100%;justify-content:flex-start;font-size:12px;padding:10px 14px}

      /* === HOW IT WORKS === */
      .how-layout{display:flex;gap:0;background:linear-gradient(to bottom,#e8d8b0,#d4bc7c,#e0cc94);border:8px solid #6b3c10;border-radius:6px;box-shadow:0 0 0 2px #2a1008,0 6px 18px rgba(0,0,0,.55);overflow:hidden;min-height:640px;align-items:flex-start;margin-bottom:14px}
      .how-sidebar{width:210px;min-width:210px;background:#3a1a00;flex-shrink:0;position:sticky;top:8px;align-self:flex-start}
      .how-content{flex:1;padding:24px;overflow:auto}

      /* === PATCH NOTES === */
      .pn-card{background:linear-gradient(to bottom,#e8d8b0,#d4bc7c,#e0cc94);border:8px solid #6b3c10;border-radius:6px;box-shadow:0 0 0 2px #2a1008,0 6px 18px rgba(0,0,0,.55);margin-bottom:16px;padding:20px 24px}

      /* === MOBILE === */
      @media(max-width:768px){
        .dig-header{height:56px!important;padding:0 14px!important}
        .nav-tabs{display:none!important}
        .hamburger{display:flex!important}
        .g2,.g2-16{grid-template-columns:1fr!important}
        .g-lands{grid-template-columns:1fr!important}
        .sb-in>div{min-width:50%!important}
        .dig-main{padding:10px!important}
        .how-layout{flex-direction:column!important;min-height:auto!important}
        .how-sidebar{width:100%!important;min-width:unset!important;position:static!important;border-radius:0!important}
        .wp{padding:12px 14px!important}
        .wp-dark>.wp-in{padding:12px 14px!important}
      }
      @media(max-width:480px){
        .g-miners{grid-template-columns:1fr 1fr!important}
        .sb-in>div{min-width:100%!important;border-right:none!important;border-bottom:1px solid rgba(90,48,16,.3)!important}
      }
    `}</style>

    {/* MAINTENANCE OVERLAY — blocks everything for non-admins */}
    {maintenanceMode&&!isAdmin&&(
      <div style={{position:"fixed",inset:0,zIndex:99999,background:"linear-gradient(135deg,#0d0d1a 0%,#1a1a2e 50%,#0d0d1a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24}}>
        <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:90,objectFit:"contain",marginBottom:24,filter:"drop-shadow(0 0 24px #FF9800)"}}/>
        <div style={{fontSize:56,marginBottom:16}}>🔧</div>
        <h1 style={{color:"#FFD600",fontFamily:"'Press Start 2P',monospace",fontSize:16,marginBottom:20,lineHeight:1.8}}>{tx.maintenance}</h1>
        <p style={{color:"rgba(255,255,255,.75)",fontSize:14,maxWidth:420,lineHeight:1.9,marginBottom:8}}>
          {tx.maintenanceDesc}
        </p>
        <p style={{color:"rgba(255,255,255,.45)",fontSize:12,marginBottom:32}}>{tx.maintenanceSoon}</p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
          <a href="https://t.me/+RFYExBlVNwk0NmE0" target="_blank" rel="noopener noreferrer"
            style={{padding:"12px 28px",background:"#0088cc",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",boxShadow:"0 4px 20px rgba(0,136,204,.4)"}}>
            📢 Telegram
          </a>
          <a href="https://x.com/digminertempo" target="_blank" rel="noopener noreferrer"
            style={{padding:"12px 28px",background:"#000",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",boxShadow:"0 4px 20px rgba(255,255,255,.15)",border:"1px solid #333"}}>
            𝕏 Twitter
          </a>
        </div>
        <p style={{color:"rgba(255,255,255,.2)",fontSize:10,marginTop:40}}>DigMiner © 2026 • Tempo Blockchain</p>
      </div>
    )}

    {notif&&<div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:10000,padding:"10px 24px",borderRadius:10,background:notif.ok?"#2E7D32":"#C62828",color:"#fff",fontSize:13,fontWeight:600,animation:"slideDown .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.3)",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{notif.msg}</div>}
    {revealing&&<BoxReveal miner={revealing} onClose={closeReveal}/>}
    {fuseReveal&&<BoxReveal miner={fuseReveal} onClose={closeFuseReveal} isFuse/>}
    {showRoadmap&&<RoadmapModal onClose={()=>setShowRoadmap(false)}/>}

    {/* HEADER */}
    <header className="dig-header" style={{position:"sticky"}}>
      {/* Left: logo + lang */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:44,objectFit:"contain"}}/>
        <button onClick={toggleLang} className="osrs-btn" style={{fontSize:11}}>{tx.langBtn}</button>
      </div>

      {/* Center: nav tabs (desktop) */}
      <div className="nav-tabs">
        {TABS.map(n=><button key={n} onClick={()=>setTab(tabMap[n])} className={"osrs-btn"+(tab===tabMap[n]?" active":"")}>{n}</button>)}
        <a href="/patchnotes" className="osrs-btn">📋 Patch Notes</a>
        <button onClick={()=>notify(tx.marketplaceNotify,true)} className="osrs-btn" style={{color:"rgba(255,214,0,.4)",borderStyle:"dashed",borderColor:"#5a4008"}}>{tx.marketplace} <span style={{fontSize:8,background:"#FF9800",color:"#fff",borderRadius:3,padding:"1px 4px",marginLeft:4,fontWeight:700}}>{tx.marketplaceSoon}</span></button>
      </div>

      {/* Right: wallet + hamburger */}
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        {wallet
          ?<>
            <div className="osrs-btn" style={{fontFamily:"monospace",cursor:"default"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</div>
            <button className="osrs-btn" style={{borderColor:"#c62828",color:"#ff8a80",background:"linear-gradient(to bottom,#5a0000,#2a0000)"}} onClick={()=>{setWallet(null);setMiners([]);setDigcoin(0);setTransactions([]);setWithdrawCooldown(0);setIsAdmin(false);setPathUSDBalance("0.0000");localStorage.removeItem(AUTH_KEY);setAuthToken(null);}} title={tx.disconnectTitle}>✕</button>
          </>
          :<button disabled={loading} className="osrs-btn active" onClick={connectWallet}>{loading?tx.connecting:tx.connect}</button>}
        {/* Hamburger (mobile only) */}
        <button className="hamburger" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </div>
    </header>

    {/* Mobile dropdown menu */}
    <div className={"mobile-menu"+(menuOpen?" open":"")}>
      {TABS.map(n=><button key={n} onClick={()=>{setTab(tabMap[n]);setMenuOpen(false);}} className={"osrs-btn"+(tab===tabMap[n]?" active":"")}>{n}</button>)}
      <a href="/patchnotes" className="osrs-btn">📋 Patch Notes</a>
      <button onClick={()=>{notify(tx.marketplaceNotify,true);setMenuOpen(false);}} className="osrs-btn" style={{color:"rgba(255,214,0,.5)",borderStyle:"dashed"}}>{tx.marketplace} <span style={{fontSize:9,background:"#FF9800",color:"#fff",borderRadius:3,padding:"1px 5px",marginLeft:4}}>{tx.marketplaceSoon}</span></button>
      <button onClick={toggleLang} className="osrs-btn" style={{marginTop:4}}>{tx.langBtn}</button>
    </div>

    <main style={{maxWidth:1100,margin:"0 auto",padding:20}} className="dig-main">
      {/* GLOBAL STATS */}
      <div className="sb">
        <div className="sb-in">
          {[
            [`${(stats.pool_balance!=null?stats.pool_balance:(stats.total_deposited||0)-(stats.total_withdrawn||0)).toFixed(2)} ${tx.statsPool}`],
            [`${stats.totalMiners||0} ${tx.statsNft}`],
            [`${stats.totalPlayers||0} ${tx.statsPlayers}`],
            [`${(stats.total_withdrawn||0).toFixed(2)} ${tx.statsWithdrawn}`],
            [`${tx.statsNetwork}`],
          ].map(([v],i)=>(
            <div key={i} style={{flex:1,minWidth:130,padding:"14px 16px",borderRight:i<4?"1px solid rgba(90,48,16,.3)":"none",fontSize:14,fontWeight:800,color:"#3a1a00",textAlign:"center"}}>{v}</div>
          ))}
        </div>
      </div>

      {!wallet&&tab==="how"?<HowItWorks/>:!wallet?(
        <div style={{textAlign:"center",padding:"80px 20px"}}>
          <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:140,objectFit:"contain",marginBottom:16,filter:"drop-shadow(0 4px 24px rgba(0,0,0,.4))"}}/>
          <p style={{color:"#fff",fontSize:15,textShadow:"1px 1px 2px rgba(0,0,0,.5)",marginBottom:24}}>{tx.connectSubtitle}</p>
          <button disabled={loading} onClick={connectWallet} style={{padding:"14px 48px",background:"linear-gradient(135deg,#FFD600,#FF9800)",border:"3px solid #5D4037",borderRadius:12,color:"#333",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'Press Start 2P',monospace"}}>
            {loading?tx.connectingWallet:tx.connectWallet}
          </button>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:11,marginTop:16}}>{tx.connectRequires}</p>
        </div>
      ):<>
        {/* WALLET BAR */}
        <div className="wp-dark">
        <div className="wp-in" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/design/icon-wallet-lg.png" style={{width:48,height:48,objectFit:"contain"}}/>
            <div><div style={{fontSize:11,fontWeight:700,color:"#333"}}>{tx.walletAddress}</div><div style={{fontSize:9,color:"#888",fontFamily:"monospace"}}>{wallet}</div></div>
          </div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>{tx.pathUSDBalance}</div><div style={{fontSize:13,fontWeight:700}}>{pathUSDBalance} pathUSD</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>{tx.digcoinBalance}</div><div style={{fontSize:13,fontWeight:700,color:"#8B0000"}}>{digcoin.toFixed(2)} DC [{(digcoin/DIG_RATE).toFixed(4)} pathUSD]</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>{tx.miners}</div><div style={{fontSize:11,fontWeight:700}}>{idleMiners.length} {tx.idle} · {miningMiners.length} {tx.mining} · {readyMiners.length} {tx.ready}</div></div>
          {canMineAny&&<button disabled={!!txLoading} onClick={playAll} style={{padding:"6px 14px",background:"linear-gradient(135deg,#2196F3,#42A5F5)",border:"2px solid #1565C0",borderRadius:8,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>
            {txLoading==="playall"?tx.starting:`${tx.mineAllBtn(idleMiners.length)} fee: ${PLAY_ALL_FEE*idleMiners.length} DC)`}
          </button>}
          {canClaimAny&&<button disabled={!!txLoading} onClick={claimAll} style={{padding:"6px 14px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"2px solid #E65100",borderRadius:8,color:"#333",fontSize:11,fontWeight:800,cursor:"pointer"}}>
            {txLoading==="claimall"?tx.claiming:`${tx.claimAllBtn(readyMiners.length)} fee: ${PLAY_ALL_FEE*readyMiners.length} DC)`}
          </button>}
        </div></div>

        {/* MY ACCOUNT */}
        {tab==="account"&&<div style={{animation:"fadeIn .3s ease"}}>
          <div className="wp-dark">
          <div className="wp-in">
            <div style={{fontSize:10,color:"#7a5020",fontWeight:700,marginBottom:4}}>{tx.referralLink}</div>
            <input readOnly value={referralLink} style={{width:"100%",padding:"7px 12px",border:"1px solid #c8a870",borderRadius:6,fontSize:11,color:"#555",background:"rgba(255,255,255,.5)",cursor:"pointer"}}
              onClick={e=>{e.target.select();document.execCommand("copy");notify(tx.referralCopied);}}/>
          </div></div>
          <div className="g2">
            {/* DEPOSIT */}
            <div className="wp-dark">
            <div className="wp-in">
              <h3 style={{fontSize:13,fontWeight:700,marginBottom:4}}>{tx.depositTitle}</h3>
              <p style={{fontSize:10,color:"#888",marginBottom:8}}>{tx.depositDesc}</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <input type="number" placeholder="0.00" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)} style={{flex:1,padding:"7px 10px",border:"1px solid #c8a870",borderRadius:6,fontSize:12,background:"rgba(255,255,255,.5)"}} min="0" step="0.01"/>
                <span style={{padding:"7px 10px",background:"rgba(255,255,255,.4)",border:"1px solid #c8a870",borderRadius:6,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",color:"#5a3010"}}>pathUSD</span>
              </div>
              {depositAmt&&<div style={{fontSize:10,color:"#4CAF50",marginBottom:8}}>= {(parseFloat(depositAmt||0)*DIG_RATE).toFixed(0)} DIGCOIN</div>}
              <button disabled={!!txLoading} onClick={doDeposit} style={{padding:"7px 20px",background:"#4CAF50",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {txLoading==="deposit"?tx.processing:tx.deposit}
              </button>
            </div></div>
            {/* WITHDRAW */}
            <div className="wp-dark">
            <div className="wp-in">
              <h3 style={{fontSize:13,fontWeight:700,marginBottom:4}}>{tx.withdrawTitle} <span style={{fontSize:10,color:"#999",fontWeight:400}}>{tx.withdrawFee}</span></h3>
              <p style={{fontSize:10,color:"#888",marginBottom:8}}>{tx.withdrawDesc}</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <input type="number" placeholder="0" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} style={{flex:1,padding:"7px 10px",border:"1px solid #c8a870",borderRadius:6,fontSize:12,background:"rgba(255,255,255,.5)"}} min="0"/>
                <span style={{padding:"7px 10px",background:"rgba(255,255,255,.4)",border:"1px solid #c8a870",borderRadius:6,fontSize:11,fontWeight:600,color:"#5a3010"}}>DIGCOIN</span>
              </div>
              {withdrawAmt&&<div style={{fontSize:10,color:"#FF9800",marginBottom:8}}>
                = {(parseFloat(withdrawAmt||0)/DIG_RATE).toFixed(4)} pathUSD → net {(parseFloat(withdrawAmt||0)/DIG_RATE*0.90).toFixed(4)} pathUSD
              </div>}
              <button disabled={!!txLoading||withdrawCooldown>0} onClick={doWithdraw} style={{padding:"7px 20px",background:withdrawCooldown>0?"#aaa":"#FF9800",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:600,cursor:withdrawCooldown>0?"not-allowed":"pointer"}}>
                {txLoading==="withdraw"?tx.processing:withdrawCooldown>0?<Timer ms={withdrawCooldown}/>:tx.withdraw}
              </button>
              {withdrawCooldown>0&&<p style={{fontSize:10,color:"#E65100",marginTop:4}}>{tx.withdrawCooldownMsg} <Timer ms={withdrawCooldown}/></p>}
            </div></div>
          </div>
          {/* TRANSACTIONS */}
          <div className="wp" style={{marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{fontSize:13,fontWeight:800,color:"#1a0800"}}>{tx.txHistory}</h3>
              <button onClick={()=>loadTransactions(wallet)} className="osrs-btn">{tx.refresh}</button>
            </div>
            {transactions.length===0
              ?<div style={{textAlign:"center",padding:20,color:"#7a5020",fontSize:12,fontWeight:600}}>{tx.noTx}</div>
              :<table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"rgba(90,48,16,.15)"}}>
                  <th style={{padding:"8px 7px",textAlign:"left",borderBottom:"2px solid rgba(90,48,16,.3)",color:"#1a0800",fontWeight:800}}>{tx.colDate}</th>
                  <th style={{padding:"8px 7px",textAlign:"left",borderBottom:"2px solid rgba(90,48,16,.3)",color:"#1a0800",fontWeight:800}}>{tx.colType}</th>
                  <th style={{padding:"8px 7px",textAlign:"left",borderBottom:"2px solid rgba(90,48,16,.3)",color:"#1a0800",fontWeight:800}}>{tx.colDetail}</th>
                  <th style={{padding:"8px 7px",textAlign:"right",borderBottom:"2px solid rgba(90,48,16,.3)",color:"#1a0800",fontWeight:800}}>{tx.colAmount}</th>
                </tr></thead>
                <tbody>{transactions.map((t,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid rgba(90,48,16,.15)",background:i%2===0?"rgba(255,255,255,.15)":"transparent"}}>
                    <td style={{padding:"7px",color:"#1a0800",fontWeight:600}}>{new Date(t.date).toLocaleString()}</td>
                    <td style={{padding:"7px"}}><span style={{padding:"2px 7px",borderRadius:4,fontSize:9,fontWeight:800,
                      background:t.type==="deposit"?"#e8f5e9":t.type==="withdraw"?"#fff3e0":t.type==="claim"?"#e3f2fd":t.type==="box"?"#fce4ec":t.type==="repair"?"#fff8e1":t.type==="land"?"#f3e5f5":t.type==="fusion"?"#fbe9e7":t.type==="play_all"?"#e1f5fe":t.type==="claim_all"?"#e8eaf6":"#eee",
                      color:t.type==="deposit"?"#1B5E20":t.type==="withdraw"?"#BF360C":t.type==="claim"?"#0D47A1":t.type==="box"?"#880E4F":t.type==="repair"?"#E65100":t.type==="land"?"#4A148C":t.type==="fusion"?"#BF360C":t.type==="play_all"?"#01579B":t.type==="claim_all"?"#1A237E":"#333"
                    }}>{t.type==="play_all"?"PLAY ALL":t.type==="claim_all"?"CLAIM ALL":t.type.toUpperCase()}</span></td>
                    <td style={{padding:"7px",color:"#1a0800",fontWeight:600}}>{t.detail}</td>
                    <td style={{padding:"7px",textAlign:"right",fontWeight:800,color:t.amount>0?"#1B5E20":"#BF360C"}}>{t.amount>0?"+":""}{t.amount} DC</td>
                  </tr>
                ))}</tbody>
              </table>}
          </div>
        </div>}

        {/* MY NFT */}
        {tab==="nft"&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["All",...RARITIES.map(r=>r.name),"In Land"].map(f=>{
              const isLand=f==="In Land";
              const active=filter===f;
              const color=isLand?"#4CAF50":RARITIES.find(r=>r.name===f)?.color||"#333";
              return(<button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:`1px solid ${active?(isLand?"#4CAF50":"#FFD600"):"#ccc"}`,background:active?(isLand?"#4CAF50":"#FFD600"):"#fff",color:active?"#fff":(f==="All"?"#333":color)}}>
                {isLand?"🌍 ":""}{f} ({fc[f]||0})
              </button>);
            })}
            <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {canMineAny&&!fuseMode&&<button disabled={!!txLoading} onClick={playAll} style={{padding:"7px 14px",background:"#2196F3",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {txLoading==="playall"?tx.starting:autoPickaxe.owned&&autoPickaxe.active
                  ?tx.mineAllBtn(idleMiners.length)+` 🪓 FREE)`
                  :tx.mineAllBtn(idleMiners.length)+` fee: ${PLAY_ALL_FEE*idleMiners.length} DC)`}
              </button>}
              {canClaimAny&&!fuseMode&&<button disabled={!!txLoading} onClick={claimAll} style={{padding:"7px 14px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"none",borderRadius:8,color:"#333",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {txLoading==="claimall"?tx.claiming:autoPickaxe.owned&&autoPickaxe.active
                  ?tx.claimAllBtn(readyMiners.length)+` 🪓 FREE)`
                  :tx.claimAllBtn(readyMiners.length)+` fee: ${PLAY_ALL_FEE*readyMiners.length} DC)`}
              </button>}
              {miners.length>=2&&<button onClick={()=>{setFuseMode(f=>!f);setFuseSelected([]);}} style={{padding:"7px 14px",background:fuseMode?"#7B1FA2":"linear-gradient(135deg,#9C27B0,#7B1FA2)",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:fuseMode?"0 0 0 2px #FFD600":"none"}}>
                {fuseMode?tx.cancelFuse:tx.fuseMiners}
              </button>}
            </div>
          </div>

          {/* Auto Pickaxe toggle banner */}
          {autoPickaxe.owned&&<div style={{background:autoPickaxe.active?"linear-gradient(135deg,#1a3a1a,#0d2b0d)":"rgba(255,255,255,.07)",borderRadius:12,padding:"12px 16px",marginBottom:14,border:`2px solid ${autoPickaxe.active?"#4CAF50":"#555"}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <img src="/autopickaxe/autoPickaxe.png" alt="Auto Pickaxe" style={{width:36,height:36,objectFit:"contain"}}/>
              <div>
                <div style={{color:autoPickaxe.active?"#4CAF50":"#aaa",fontWeight:800,fontSize:12}}>⛏️ Auto Pickaxe {autoPickaxe.active?"ACTIVE":"PAUSED"}</div>
                <div style={{color:"#888",fontSize:10,marginTop:2}}>{autoPickaxe.active?"Mine All & Claim All fees are waived":"Toggle ON to waive all Mine All & Claim All fees"}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:10,color:"#aaa"}}>{autoPickaxe.active?"ON":"OFF"}</span>
              <div onClick={()=>!autoPickaxeLoading&&toggleAutoPickaxe(!autoPickaxe.active)}
                style={{width:44,height:24,borderRadius:12,background:autoPickaxe.active?"#4CAF50":"#555",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:autoPickaxe.active?23:3,width:18,height:18,borderRadius:9,background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
              </div>
            </div>
          </div>}

          {/* Fuse mode banner */}
          {fuseMode&&<div style={{background:"linear-gradient(135deg,#4a1060,#2d0040)",borderRadius:12,padding:"14px 18px",marginBottom:14,border:"2px solid #9C27B0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{color:"#E040FB",fontWeight:800,fontSize:13,marginBottom:3}}>{tx.fuseModeTitle}</div>
              <div style={{color:"#ccc",fontSize:11}}>{tx.fuseModeDesc(FUSE_COST)}</div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{color:"#fff",fontSize:12}}>{tx.selectedOf2(fuseSelected.length)}</div>
              {fuseSelected.length===2&&<button disabled={!!txLoading} onClick={executeFuse} style={{padding:"9px 22px",background:"linear-gradient(135deg,#E040FB,#9C27B0)",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(156,39,176,.5)"}}>
                {txLoading==="fuse"?tx.fusing:tx.fusingNow(FUSE_COST)}
              </button>}
            </div>
          </div>}

          <div className="g-miners">
            {filtered.length===0
              ?<div style={{gridColumn:"1/-1",textAlign:"center",padding:50,color:"#888",fontSize:13}}><img src="/nftimgs/mistery box.png" alt="box" style={{width:60,height:60,objectFit:"contain",marginBottom:12,opacity:.5}}/><br/>{tx.noMiners}</div>
              :filtered.map(m=>{
                const isFuseSelected=fuseSelected.find(s=>s.id===m.id);
                return(
                  <div key={m.id} onClick={()=>toggleFuseSelect(m)}
                    style={{cursor:fuseMode?"pointer":"default",outline:isFuseSelected?"3px solid #E040FB":"3px solid transparent",borderRadius:14,transform:isFuseSelected?"scale(1.03)":"scale(1)",transition:"all .15s"}}>
                    <MinerCard miner={m} onMine={fuseMode?null:startMiner} onClaim={fuseMode?null:claimMiner} onRepair={fuseMode?null:repairMiner} loading={!!txLoading||fuseMode} inLand={minerInLandSet.has(m.id)}/>
                  </div>
                );
              })}
          </div>

          {/* MY LANDS */}
          <div style={{marginTop:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:18}}>🌍</span>
              <h3 style={{fontSize:15,fontWeight:800,color:"#fff"}}>{tx.myLands}</h3>
              <span style={{fontSize:10,color:"rgba(255,255,255,.35)",background:"rgba(255,255,255,.08)",padding:"2px 8px",borderRadius:10}}>{lands.length}</span>
            </div>
            {lands.length===0?(
              <div style={{textAlign:"center",padding:32,background:"rgba(255,255,255,.05)",borderRadius:12,border:"1px dashed rgba(255,255,255,.12)"}}>
                <div style={{fontSize:36,marginBottom:8}}>🌍</div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:12}}>{tx.noLands}</div>
              </div>
            ):(
              <div className="g-lands">
                {lands.map(land=>{
                  const lr=LAND_RARITIES[land.rarityId]||LAND_RARITIES[0];
                  const assignedIds=new Set(land.assignedMiners.map(a=>a.minerId));
                  const idleUnassigned=miners.filter(m=>m.isIdle&&m.isAlive&&!m.needsRepair&&!lands.some(l=>l.assignedMiners.some(a=>a.minerId===m.id)));
                  const isAssigning=assigningLandId===land.id;
                  const slots=Array.from({length:land.minerSlots},(_,i)=>land.assignedMiners[i]||null);
                  return(
                    <div key={land.id} style={{background:`linear-gradient(135deg,${lr.bg},#0d0d1a)`,borderRadius:12,border:`2px solid ${lr.color}44`,overflow:"hidden"}}>
                      {/* Header */}
                      <div style={{background:`linear-gradient(90deg,${lr.color}22,transparent)`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${lr.color}22`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <img src={LAND_IMGS[land.rarityId||0]} alt={lr.name} style={{width:36,height:36,objectFit:"contain"}}/>
                          <div>
                            <div style={{color:lr.color,fontWeight:800,fontSize:12}}>{lr.name} Land</div>
                            <div style={{color:"rgba(255,255,255,.4)",fontSize:10}}>#{land.id}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:"#4CAF50",fontWeight:800,fontSize:16}}>+{land.boostPercent}%</div>
                          <div style={{color:"rgba(255,255,255,.35)",fontSize:9}}>boost</div>
                        </div>
                      </div>
                      {/* Slots */}
                      <div style={{padding:"12px 16px"}}>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.35)",marginBottom:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{land.assignedMiners.length}/{land.minerSlots} miners</div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {slots.map((asgn,i)=>{
                            if(asgn){
                              const slotR=RARITIES[asgn.rarityId]||RARITIES[0];
                              const isBusy=landLoading===`unassign_${asgn.minerId}`;
                              return(
                                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.07)",borderRadius:8,padding:"6px 10px",border:`1px solid ${slotR.color}33`}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    <img src={NFT_IMGS[asgn.rarityId||0]} alt={asgn.rarityName} style={{width:24,height:24,objectFit:"contain"}}/>
                                    <div>
                                      <div style={{color:slotR.color,fontWeight:700,fontSize:10}}>{asgn.rarityName} #{asgn.minerId}</div>
                                      <div style={{color:"rgba(255,255,255,.35)",fontSize:9}}>{asgn.dailyDigcoin} → <span style={{color:"#4CAF50"}}>{(asgn.dailyDigcoin*(1+land.boostPercent/100)).toFixed(1)} DC/day</span></div>
                                    </div>
                                  </div>
                                  {asgn.isIdle&&(
                                    <button disabled={!!landLoading} onClick={()=>doUnassignMiner(asgn.minerId)} style={{padding:"3px 8px",background:"rgba(239,83,80,.15)",border:"1px solid #EF5350",borderRadius:6,color:"#EF5350",fontSize:9,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                                      {isBusy?tx.landUnassigning:tx.landUnassignBtn}
                                    </button>
                                  )}
                                </div>
                              );
                            } else {
                              return(
                                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.03)",borderRadius:8,padding:"6px 10px",border:"1px dashed rgba(255,255,255,.1)"}}>
                                  <span style={{color:"rgba(255,255,255,.25)",fontSize:10}}>{tx.landSlotFree}</span>
                                  {!isAssigning&&(
                                    <button disabled={!!landLoading} onClick={()=>setAssigningLandId(land.id)} style={{padding:"3px 8px",background:"rgba(76,175,80,.15)",border:"1px solid #4CAF50",borderRadius:6,color:"#4CAF50",fontSize:9,fontWeight:700,cursor:"pointer"}}>
                                      {tx.landAssignBtn}
                                    </button>
                                  )}
                                </div>
                              );
                            }
                          })}
                        </div>
                        {/* Assign panel */}
                        {isAssigning&&(
                          <div style={{marginTop:10,background:"rgba(0,0,0,.3)",borderRadius:8,padding:"10px",border:"1px solid rgba(76,175,80,.3)"}}>
                            <div style={{color:"rgba(255,255,255,.6)",fontSize:10,marginBottom:8}}>{tx.landAssignTitle}</div>
                            {idleUnassigned.length===0?(
                              <div style={{color:"rgba(255,255,255,.3)",fontSize:10}}>{tx.landAssignNoIdle}</div>
                            ):(
                              <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto"}}>
                                {idleUnassigned.map(m=>{
                                  const mr=RARITIES[m.rarityId]||RARITIES[0];
                                  const isBusy=landLoading===`assign_${m.id}`;
                                  return(
                                    <button key={m.id} disabled={!!landLoading} onClick={()=>doAssignMiner(land.id,m.id)}
                                      style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"rgba(255,255,255,.06)",border:`1px solid ${mr.color}44`,borderRadius:6,cursor:"pointer",textAlign:"left",width:"100%"}}>
                                      <img src={NFT_IMGS[m.rarityId||0]} alt={m.rarityName} style={{width:20,height:20,objectFit:"contain"}}/>
                                      <div style={{flex:1}}>
                                        <div style={{color:mr.color,fontWeight:700,fontSize:10}}>{m.rarityName} #{m.id}</div>
                                        <div style={{color:"rgba(255,255,255,.35)",fontSize:9}}>{m.dailyDigcoin} DC/day</div>
                                      </div>
                                      <span style={{color:"#4CAF50",fontSize:9,fontWeight:700}}>{isBusy?tx.landAssigning:"+"}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <button onClick={()=>setAssigningLandId(null)} style={{marginTop:8,padding:"4px 12px",background:"transparent",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,color:"rgba(255,255,255,.4)",fontSize:9,cursor:"pointer"}}>{tx.landAssignCancel}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>}

        {/* SHOP */}
        {tab==="shop"&&<div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>


          {/* ── regular boxes + stats ── */}
          <div className="g2-16">
            <div className="wp" style={{textAlign:"center"}}>
              <img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:100,height:100,objectFit:"contain",marginBottom:10,filter:"drop-shadow(0 0 12px #FFD60088)"}}/>
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:10}}>{tx.buyBox}</h3>
              <div style={{textAlign:"left",padding:"0 16px",marginBottom:14,fontSize:11,color:"#555",lineHeight:1.8}}>
                {RARITIES.map(r=><div key={r.id}>• <span style={{color:r.color,fontWeight:700}}>{r.name}:</span> {r.chance}</div>)}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button disabled={!!txLoading} onClick={()=>buyBox(1)} style={{padding:"9px 18px",background:"#FFD600",border:"2px solid #FF9800",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#333"}}>
                  {txLoading==="box"?tx.opening:"1 Box = "+BOX_PRICE+" DC"}
                </button>
                <button disabled={!!txLoading} onClick={()=>buyBox(10)} style={{padding:"9px 18px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"2px solid #E65100",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#333"}}>
                  {txLoading==="box"?tx.opening:"10 Box = "+BOX_10_PRICE+" DC"} <span style={{fontSize:9,color:"#C62828"}}>{tx.discount5}</span>
                </button>
              </div>
              <p style={{fontSize:10,color:"#aaa",marginTop:12}}>{tx.balance} {digcoin.toFixed(0)} DIGCOIN</p>
            </div>
            <div className="wp">
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:14}}>{tx.nftStats}</h3>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead><tr style={{background:"#f9f9f9"}}>{[tx.colNft,tx.colDaily,tx.colRoi,tx.colAge,tx.colRepair].map(h=><th key={h} style={{padding:7,borderBottom:"2px solid #ddd",textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>{RARITIES.map(r=><tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                  <td style={{padding:7,fontWeight:600,color:r.color}}>{r.name}</td>
                  <td style={{padding:7}}>{r.dailyMin}-{r.dailyMax} DC</td>
                  <td style={{padding:7}}>{Math.ceil(BOX_PRICE/((r.dailyMin+r.dailyMax)/2))} {tx.colDays}</td>
                  <td style={{padding:7}}>{r.nftAge} {tx.colDays}</td>
                  <td style={{padding:7}}>{r.repair} pathUSD</td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>

          {/* ── Land Box + stats ── */}
          <div className="g2-16">
            <div className="wp" style={{textAlign:"center"}}>
              <img src={LAND_IMGS[0]} alt="Mystery Land Box" style={{width:100,height:100,objectFit:"contain",marginBottom:10,filter:"drop-shadow(0 0 12px #4CAF5088)"}}/>
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:6}}>{tx.landBoxTitle}</h3>
              {/* Supply bar */}
              {(()=>{const remaining=landMaxSupply-landsMinted;const pct=Math.max(0,(remaining/landMaxSupply)*100);const sold=landsMinted>=landMaxSupply;return(<div style={{margin:"0 0 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:sold?"#EF5350":"#666",marginBottom:4}}>
                  <span style={{fontWeight:700}}>{sold?"🔴 SOLD OUT":`🟢 ${remaining} / ${landMaxSupply} remaining`}</span>
                  <span style={{color:"#aaa"}}>{landsMinted} minted</span>
                </div>
                <div style={{height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${100-pct}%`,background:sold?"#EF5350":pct<20?"#FF9800":"#4CAF50",borderRadius:3,transition:"width .5s"}}/>
                </div>
              </div>);})()}
              <div style={{textAlign:"left",padding:"0 16px",marginBottom:14,fontSize:11,color:"#555",lineHeight:1.8}}>
                {LAND_RARITIES.map(r=><div key={r.id}>• <span style={{color:r.color,fontWeight:700}}>{r.name}:</span> {r.chance}</div>)}
              </div>
              {landsMinted>=landMaxSupply?(
                <div style={{padding:"12px",background:"#ffebee",borderRadius:8,color:"#C62828",fontWeight:700,fontSize:13}}>🔴 Sold Out — All 1,000 Land Boxes Minted</div>
              ):landSaleStartMs&&Date.now()<landSaleStartMs?(
                <LandCountdownButton targetMs={landSaleStartMs} onBuy={buyLandBox} loading={landLoading==="buy"}/>
              ):(
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  <button disabled={!!landLoading||!wallet} onClick={()=>buyLandBox(1)} style={{padding:"9px 18px",background:"#4CAF50",border:"2px solid #388E3C",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#fff"}}>
                    {landLoading==="buy"?tx.opening:`1 Box = ${LAND_BOX_PRICE} DC`}
                  </button>
                  <button disabled={!!landLoading||!wallet} onClick={()=>buyLandBox(10)} style={{padding:"9px 18px",background:"linear-gradient(135deg,#388E3C,#4CAF50)",border:"2px solid #2E7D32",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#fff"}}>
                    {landLoading==="buy"?tx.opening:`10 Box = ${LAND_BOX_10_PRICE} DC`} <span style={{fontSize:9,color:"#C8E6C9"}}>(15% OFF)</span>
                  </button>
                </div>
              )}
              <p style={{fontSize:10,color:"#aaa",marginTop:12}}>{tx.balance} {digcoin.toFixed(0)} DIGCOIN</p>
            </div>
            <div className="wp">
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:14}}>{tx.landStatsTitle}</h3>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead><tr style={{background:"#f9f9f9"}}>{[tx.colLand,tx.colBoost,tx.colSlots,tx.colLandChance].map(h=><th key={h} style={{padding:7,borderBottom:"2px solid #ddd",textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>{LAND_RARITIES.map(r=>(
                  <tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                    <td style={{padding:7}}><div style={{display:"flex",alignItems:"center",gap:6}}><img src={LAND_IMGS[r.id]} alt={r.name} style={{width:22,height:22,objectFit:"contain"}}/><span style={{fontWeight:700,color:r.color}}>{r.name}</span></div></td>
                    <td style={{padding:7,fontWeight:700,color:"#4CAF50"}}>+{r.boostPercent}%</td>
                    <td style={{padding:7}}>{r.minerSlots}</td>
                    <td style={{padding:7}}>{r.chance}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {/* ── Auto Pickaxe + perks ── */}
          <div className="g2-16">
            <div className="wp" style={{textAlign:"center"}}>
              <img src="/autopickaxe/autoPickaxe.png" alt="Auto Pickaxe" style={{width:100,height:100,objectFit:"contain",marginBottom:10,filter:"drop-shadow(0 0 12px #FFD60088)"}}/>
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:6}}>⛏️ Auto Pickaxe</h3>
              {(()=>{const remaining=AUTO_PICKAXE_MAX-autoPickaxesMinted;const pct=Math.max(0,(remaining/AUTO_PICKAXE_MAX)*100);const sold=autoPickaxesMinted>=AUTO_PICKAXE_MAX;return(<div style={{margin:"0 0 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:sold?"#EF5350":"#666",marginBottom:4}}>
                  <span style={{fontWeight:700}}>{sold?"🔴 SOLD OUT":`🟢 ${remaining} / ${AUTO_PICKAXE_MAX} remaining`}</span>
                  <span style={{color:"#aaa"}}>{autoPickaxesMinted} sold</span>
                </div>
                <div style={{height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${100-pct}%`,background:sold?"#EF5350":pct<20?"#FF9800":"#FFD600",borderRadius:3,transition:"width .5s"}}/>
                </div>
              </div>);})()}
              {autoPickaxesMinted>=AUTO_PICKAXE_MAX
                ?<div style={{padding:"10px",background:"#ffebee",borderRadius:8,color:"#C62828",fontWeight:700,fontSize:13}}>🔴 Sold Out</div>
                :autoPickaxe.owned
                  ?<div style={{padding:"10px",background:"#E8F5E9",borderRadius:8,color:"#2E7D32",fontWeight:700,fontSize:13}}>✅ You own this — toggle it in My NFT tab</div>
                  :<>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                      <button disabled={autoPickaxeLoading||!wallet||digcoin<AUTO_PICKAXE_PRICE} onClick={buyAutoPickaxe}
                        style={{padding:"9px 18px",background:"linear-gradient(135deg,#FFD600,#FF9800)",border:"2px solid #E65100",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#333"}}>
                        {autoPickaxeLoading?"Processing...":`Buy = ${AUTO_PICKAXE_PRICE} DC`}
                      </button>
                    </div>
                    <p style={{fontSize:10,color:"#aaa",marginTop:12}}>{tx.balance} {digcoin.toFixed(0)} DIGCOIN</p>
                  </>
              }
            </div>
            <div className="wp">
              <h3 style={{fontSize:15,fontWeight:800,marginBottom:14}}>⚡ Perks</h3>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {icon:"🤖",title:"Full Automation",desc:"Automatically mines & claims all your miners every 24h — no need to open the app"},
                  {icon:"💸",title:"Zero Fees Forever",desc:"Mine All & Claim All fees permanently waived (saves 10 DC per miner per cycle)"},
                  {icon:"🔁",title:"Toggle Anytime",desc:"Turn ON/OFF at any time directly in the My NFT tab — you stay in control"},
                  {icon:"♾️",title:"Lifetime Access",desc:"One-time purchase, no renewals, no subscriptions — works as long as you play"},
                  {icon:"🔒",title:"Limited Supply",desc:`Only ${AUTO_PICKAXE_MAX} ever available — exclusive tool for serious miners`},
                ].map(p=>(
                  <div key={p.title} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 12px",background:"#fafafa",borderRadius:10,border:"1px solid #f0f0f0"}}>
                    <span style={{fontSize:20,flexShrink:0,lineHeight:1}}>{p.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:11,color:"#333",marginBottom:2}}>{p.title}</div>
                      <div style={{fontSize:10,color:"#888",lineHeight:1.5}}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}

        {/* LAND REVEAL */}
        {landReveal&&<LandReveal land={landReveal} onClose={()=>setLandReveal(null)}/>}

        {/* CALCULATOR */}
        {tab==="calc"&&<FarmCalculator miners={miners} lands={lands}/>}

        {/* HOW IT WORKS */}
        {tab==="how"&&<HowItWorks/>}

        {/* ADMIN PANEL */}
        {tab==="admin"&&isAdmin&&<div style={{animation:"fadeIn .3s ease",display:"flex",flexDirection:"column",gap:16}}>

          {/* Maintenance */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:`3px solid ${maintenance?"#EF5350":"#4CAF50"}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>{tx.adminMaintTitle}</h2>
                <p style={{fontSize:12,color:"#888"}}>{tx.adminMaintDesc}</p>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:maintenance?"#EF5350":"#4CAF50"}}>
                  {maintenance?tx.gameDown:tx.gameLive}
                </div>
                <button disabled={adminLoading==="maint"} onClick={toggleMaintenance} style={{padding:"10px 32px",background:maintenance?"#4CAF50":"#EF5350",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",minWidth:200}}>
                  {adminLoading==="maint"?tx.updating:(maintenance?tx.bringOnline:tx.putMaintenance)}
                </button>
              </div>
            </div>
          </div>

          {/* Send DIGCOIN */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>{tx.sendDigcoin}</h2>
            <p style={{fontSize:12,color:"#888",marginBottom:16}}>{tx.sendDesc}</p>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:10,alignItems:"end",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>{tx.walletAddr}</div>
                <input value={adminTo} onChange={e=>setAdminTo(e.target.value)} placeholder="0x..." style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12,fontFamily:"monospace"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>{tx.amountDigcoin}</div>
                <input type="number" min="1" value={adminAmt} onChange={e=>setAdminAmt(e.target.value)} placeholder="e.g. 1000" style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>{tx.reasonOptional}</div>
                <input value={adminReason} onChange={e=>setAdminReason(e.target.value)} placeholder="giveaway, influencer..." style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12}}/>
              </div>
              <button disabled={adminLoading==="send"} onClick={adminSendDigcoin} style={{padding:"9px 24px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"none",borderRadius:8,color:"#333",fontSize:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
                {adminLoading==="send"?tx.sending:tx.sendBtn}
              </button>
            </div>
            {adminLog.length>0&&<div style={{marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#555",marginBottom:8}}>{tx.recentSends}</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#f9f9f9"}}>{[tx.adminWallet,tx.adminAmount,tx.adminReason,tx.adminTime].map(h=><th key={h} style={{padding:"6px 10px",borderBottom:"1px solid #eee",textAlign:"left",color:"#888"}}>{h}</th>)}</tr></thead>
                <tbody>{adminLog.map((l,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f5f5f5"}}>
                    <td style={{padding:"6px 10px",fontFamily:"monospace",fontSize:10}}>{l.wallet.slice(0,10)}...{l.wallet.slice(-6)}</td>
                    <td style={{padding:"6px 10px",fontWeight:700,color:"#FF9800"}}>{l.amount} DC</td>
                    <td style={{padding:"6px 10px",color:"#666"}}>{l.reason}</td>
                    <td style={{padding:"6px 10px",color:"#aaa"}}>{l.ts}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
          </div>

          {/* Gift Miner Boxes */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>🎁 Gift Miner Boxes</h2>
            <p style={{fontSize:12,color:"#888",marginBottom:16}}>Send 1 free miner box to each wallet. Paste addresses one per line (max 50). No DIGCOIN charged — rarity is rolled normally.</p>
            <textarea
              value={giftWallets} onChange={e=>setGiftWallets(e.target.value)}
              placeholder={"0xABC...\n0xDEF...\n0x123..."}
              rows={6}
              style={{width:"100%",padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:11,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box"}}
            />
            <div style={{display:"flex",alignItems:"center",gap:12,marginTop:10}}>
              <span style={{fontSize:11,color:"#888"}}>{giftWallets.split(/[\n,]+/).filter(w=>w.trim()).length} wallets</span>
              <button disabled={adminLoading==="gift"} onClick={adminGiftBoxes} style={{padding:"9px 24px",background:"linear-gradient(135deg,#9C27B0,#E91E63)",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                {adminLoading==="gift"?"Sending...":"🎁 Send Boxes"}
              </button>
              {giftResults&&<span style={{fontSize:11,color:"#4CAF50",fontWeight:700}}>✅ {giftResults.sent} sent {giftResults.failed>0&&<span style={{color:"#EF5350"}}>/ {giftResults.failed} failed</span>}</span>}
            </div>
            {giftResults?.results&&<div style={{marginTop:14,maxHeight:220,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead><tr style={{background:"#f9f9f9"}}>
                  {["Wallet","Status","Miner ID","Rarity","DC/day"].map(h=><th key={h} style={{padding:"5px 8px",borderBottom:"1px solid #eee",textAlign:"left",color:"#888"}}>{h}</th>)}
                </tr></thead>
                <tbody>{giftResults.results.map((r,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f5f5f5",background:r.success?"#fff":"#fff8f8"}}>
                    <td style={{padding:"5px 8px",fontFamily:"monospace"}}>{r.wallet.slice(0,10)}...{r.wallet.slice(-6)}</td>
                    <td style={{padding:"5px 8px",fontWeight:700,color:r.success?"#4CAF50":"#EF5350"}}>{r.success?"✅ Sent":"❌ Failed"}</td>
                    <td style={{padding:"5px 8px"}}>{r.minerId||"—"}</td>
                    <td style={{padding:"5px 8px",fontWeight:700,color:r.success?(RARITIES.find(x=>x.name===r.rarityName)?.color||"#333"):"#aaa"}}>{r.rarityName||r.error||"—"}</td>
                    <td style={{padding:"5px 8px"}}>{r.dailyDigcoin||"—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
          </div>

          {/* Deposits by day */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>💰 Deposits by Day</h2>
            <p style={{fontSize:12,color:"#888",marginBottom:16}}>Filter all deposits by UTC date. Admin credits are shown separately.</p>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
              <input type="date" value={depositDay} onChange={e=>setDepositDay(e.target.value)}
                style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:13,fontFamily:"monospace"}}/>
              <button onClick={loadDepositsByDay} disabled={depositLoading}
                style={{padding:"8px 20px",background:"#4CAF50",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {depositLoading?"Loading...":"Load"}
              </button>
              {[0,1,2,3].map(daysAgo=>{
                const d=new Date();d.setDate(d.getDate()-daysAgo);const v=d.toISOString().slice(0,10);
                const label=daysAgo===0?"Today":daysAgo===1?"Yesterday":`-${daysAgo}d`;
                return(<button key={daysAgo} onClick={()=>setDepositDay(v)}
                  style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${depositDay===v?"#4CAF50":"#ddd"}`,background:depositDay===v?"#4CAF50":"#fff",color:depositDay===v?"#fff":"#555",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {label}
                </button>);
              })}
            </div>

            {depositReport&&(
              <>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                  {[
                    ["Total Deposits",depositReport.realCount,"#4CAF50"],
                    ["Admin Credits",depositReport.adminCount,"#9C27B0"],
                    ["Total pathUSD","$"+depositReport.totalPathUSD.toFixed(2),"#2196F3"],
                    ["Total DC Credited",depositReport.totalDigcoin.toFixed(0)+" DC","#FF9800"],
                  ].map(([label,val,color])=>(
                    <div key={label} style={{flex:1,minWidth:120,background:"#f8f9fa",borderRadius:10,padding:"12px 16px",border:`1px solid ${color}33`,textAlign:"center"}}>
                      <div style={{fontSize:10,color:"#888",marginBottom:4}}>{label}</div>
                      <div style={{fontSize:18,fontWeight:800,color}}>{val}</div>
                    </div>
                  ))}
                </div>

                {depositReport.deposits.length===0
                  ?<div style={{textAlign:"center",padding:20,color:"#aaa",fontSize:12}}>No deposits on {depositReport.date}</div>
                  :<div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:"#f5f5f5"}}>
                        {["Time (UTC)","Wallet","pathUSD","DC Credited","Type"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",color:"#555",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{depositReport.deposits.map((d,i)=>{
                        const isAdmin=d.tx_hash?.startsWith("admin_");
                        return(<tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fff":"#fafafa"}}>
                          <td style={{padding:"8px 10px",color:"#888",whiteSpace:"nowrap"}}>{new Date(d.created_at).toUTCString().slice(17,25)}</td>
                          <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:10}}>{d.wallet.slice(0,8)}...{d.wallet.slice(-6)}</td>
                          <td style={{padding:"8px 10px",fontWeight:700,color:"#4CAF50"}}>{isAdmin?"—":"$"+(d.amount_pathusd||0).toFixed(2)}</td>
                          <td style={{padding:"8px 10px",fontWeight:700,color:"#FF9800"}}>{(d.digcoin_credited||0).toFixed(0)} DC</td>
                          <td style={{padding:"8px 10px"}}>
                            <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,
                              background:isAdmin?"#F3E5F5":"#E8F5E9",color:isAdmin?"#6A1B9A":"#2E7D32"}}>
                              {isAdmin?"ADMIN":"DEPOSIT"}
                            </span>
                          </td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>
                }
              </>
            )}
          </div>

          {/* Withdrawals by day */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>🏧 Withdrawals by Day</h2>
            <p style={{fontSize:12,color:"#888",marginBottom:16}}>Filter completed & pending withdrawals by UTC date.</p>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
              <input type="date" value={withdrawDay} onChange={e=>setWithdrawDay(e.target.value)}
                style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:13,fontFamily:"monospace"}}/>
              <button onClick={loadWithdrawalsByDay} disabled={withdrawLoading}
                style={{padding:"8px 20px",background:"#2196F3",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {withdrawLoading?"Loading...":"Load"}
              </button>
              {/* Quick nav buttons */}
              {[0,1,2,3].map(daysAgo=>{
                const d=new Date();d.setDate(d.getDate()-daysAgo);const v=d.toISOString().slice(0,10);
                const label=daysAgo===0?"Today":daysAgo===1?"Yesterday":`-${daysAgo}d`;
                return(<button key={daysAgo} onClick={()=>setWithdrawDay(v)}
                  style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${withdrawDay===v?"#2196F3":"#ddd"}`,background:withdrawDay===v?"#2196F3":"#fff",color:withdrawDay===v?"#fff":"#555",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {label}
                </button>);
              })}
            </div>

            {withdrawReport&&(
              <>
                {/* Summary cards */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                  {[
                    ["Withdrawals",withdrawReport.count,"#2196F3"],
                    ["Total DC",withdrawReport.totalDigcoin.toFixed(0)+" DC","#FF9800"],
                    ["Total pathUSD","$"+withdrawReport.totalPathUSD.toFixed(2),"#4CAF50"],
                    ["Total Fees","$"+withdrawReport.totalFees.toFixed(2),"#9C27B0"],
                  ].map(([label,val,color])=>(
                    <div key={label} style={{flex:1,minWidth:120,background:"#f8f9fa",borderRadius:10,padding:"12px 16px",border:`1px solid ${color}33`,textAlign:"center"}}>
                      <div style={{fontSize:10,color:"#888",marginBottom:4}}>{label}</div>
                      <div style={{fontSize:18,fontWeight:800,color}}>{val}</div>
                    </div>
                  ))}
                </div>

                {withdrawReport.withdrawals.length===0
                  ?<div style={{textAlign:"center",padding:20,color:"#aaa",fontSize:12}}>No withdrawals on {withdrawReport.date}</div>
                  :<div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead><tr style={{background:"#f5f5f5"}}>
                        {["Time (UTC)","Wallet","Amount DC","pathUSD","Fee","Net","Status"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",color:"#555",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{withdrawReport.withdrawals.map((w,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fff":"#fafafa"}}>
                          <td style={{padding:"8px 10px",color:"#888",whiteSpace:"nowrap"}}>{new Date(w.created_at).toUTCString().slice(17,25)}</td>
                          <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:10}}>{w.wallet.slice(0,8)}...{w.wallet.slice(-6)}</td>
                          <td style={{padding:"8px 10px",fontWeight:700,color:"#FF9800"}}>{(w.amount_digcoin||0).toFixed(0)}</td>
                          <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(w.amount_pathusd||0).toFixed(2)}</td>
                          <td style={{padding:"8px 10px",color:"#9C27B0"}}>${(w.fee_pathusd||0).toFixed(2)}</td>
                          <td style={{padding:"8px 10px",fontWeight:700}}>${(w.net_pathusd||0).toFixed(2)}</td>
                          <td style={{padding:"8px 10px"}}>
                            <span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,
                              background:w.status==="completed"?"#E8F5E9":w.status==="ready"?"#E3F2FD":w.status==="pending"?"#FFF8E1":"#FFEBEE",
                              color:w.status==="completed"?"#2E7D32":w.status==="ready"?"#1565C0":w.status==="pending"?"#F57F17":"#C62828"}}>
                              {w.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                }
              </>
            )}
          </div>

          {/* Players list */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>{tx.allPlayers}</h2><p style={{fontSize:12,color:"#888"}}>{tx.top100}</p></div>
              <button onClick={loadAdminPlayers} style={{padding:"7px 16px",background:"#2196F3",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>{tx.loadPlayers}</button>
            </div>
            {adminPlayers.length>0&&<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#f5f5f5"}}>{[tx.colWallet,tx.colBalance,tx.colDeposited,tx.colEarned,tx.colBoxes,tx.colJoined].map(h=><th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",color:"#555"}}>{h}</th>)}</tr></thead>
                <tbody>{adminPlayers.map((p,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f0f0f0",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:10}}>{p.wallet.slice(0,8)}...{p.wallet.slice(-6)}</td>
                    <td style={{padding:"8px 10px",fontWeight:700,color:"#FF9800"}}>{(p.digcoin_balance||0).toFixed(0)}</td>
                    <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(p.total_deposited_pathusd||0).toFixed(2)}</td>
                    <td style={{padding:"8px 10px"}}>{(p.total_earned_digcoin||0).toFixed(0)}</td>
                    <td style={{padding:"8px 10px"}}>{p.boxes_bought||0}</td>
                    <td style={{padding:"8px 10px",color:"#aaa",fontSize:10}}>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>}
            {adminPlayers.length===0&&<div style={{textAlign:"center",padding:20,color:"#bbb",fontSize:12}}>{tx.clickLoad}</div>}
          </div>

        </div>}
      </>}

      {/* FOOTER */}
      <div style={{textAlign:"center",padding:"36px 0 16px",color:"rgba(255,255,255,.5)",fontSize:9}}>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
          <span onClick={()=>setShowRoadmap(true)} style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer"}}>{tx.roadmap}</span>
          <a href="https://t.me/+RFYExBlVNwk0NmE0" target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer",color:"rgba(255,255,255,.5)",textDecoration:"none"}}>Telegram</a>
          <a href="https://x.com/digminertempo" target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer",color:"rgba(255,255,255,.5)",textDecoration:"none"}}>Twitter</a>
        </div>
        {tx.footer}
      </div>
    </main>
  </div></LangCtx.Provider>);
}
