import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MINERPOOL_ABI, PATHUSD_ABI, CONTRACTS } from "./contracts";

const RARITIES = [
  { id:0, name:"Common",    chance:"30%", dailyMin:18, dailyMax:20, nftAge:45, repair:0.24, color:"#9E9E9E", bg:"#3a3a3a" },
  { id:1, name:"UnCommon",  chance:"30%", dailyMin:21, dailyMax:23, nftAge:48, repair:0.40, color:"#4CAF50", bg:"#1b3a1b" },
  { id:2, name:"Rare",      chance:"18%", dailyMin:24, dailyMax:26, nftAge:52, repair:0.60, color:"#2196F3", bg:"#1a2940" },
  { id:3, name:"Super Rare",chance:"8%",  dailyMin:27, dailyMax:30, nftAge:57, repair:0.80, color:"#E91E63", bg:"#3a1a2a" },
  { id:4, name:"Legendary", chance:"4%",  dailyMin:31, dailyMax:35, nftAge:63, repair:1.00, color:"#FF9800", bg:"#3a2a10" },
  { id:5, name:"Mythic",    chance:"2%",  dailyMin:36, dailyMax:42, nftAge:70, repair:1.50, color:"#9C27B0", bg:"#2a1a3a" },
];
const BOX_PRICE=300; const BOX_10_PRICE=2850; const DIG_RATE=100; const PLAY_ALL_FEE=10;

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

function BoxReveal({miner,onClose}){
  const[phase,setPhase]=useState(0);
  const r=RARITIES[miner.rarityId];
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),1200);const t2=setTimeout(()=>setPhase(2),2200);return()=>{clearTimeout(t1);clearTimeout(t2)};},[]);
  return(<div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
    {phase===0&&<div style={{animation:"shake .6s infinite"}}><img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:140,height:140,objectFit:"contain",filter:"drop-shadow(0 0 20px #FFD600)"}}/></div>}
    {phase===1&&<div style={{fontSize:120,animation:"explode .8s forwards"}}>✨</div>}
    {phase===2&&<div style={{textAlign:"center",animation:"popIn .5s ease"}}>
      <div style={{filter:`drop-shadow(0 0 20px ${r.color})`,animation:"float 2s ease-in-out infinite"}}><MinerSprite rarityId={miner.rarityId} size={150}/></div>
      <div style={{color:r.color,fontSize:24,fontWeight:900,marginTop:12,textShadow:`0 0 30px ${r.color}`,fontFamily:"'Press Start 2P',monospace"}}>{r.name}!</div>
      <div style={{color:"#ccc",fontSize:13,marginTop:8}}>{miner.dailyDigcoin} DIGCOIN/day • {r.nftAge} days lifespan</div>
      <div style={{color:"#FFD600",fontSize:12,marginTop:4}}>ROI: ~{Math.ceil(BOX_PRICE/miner.dailyDigcoin)} days | Total: {(miner.dailyDigcoin*r.nftAge).toFixed(0)} DIGCOIN</div>
      <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
        {[["⚔️ PWR",miner.power],["⚡ NRG",miner.energy],["🛡️ DEF",miner.protective],["💥 DMG",miner.damage]].map(([l,v])=>(<span key={l} style={{background:"#1a1a2e",padding:"3px 8px",borderRadius:5,fontSize:10,color:"#aaa"}}>{l}: <b style={{color:"#fff"}}>{v}</b></span>))}
      </div>
      <button onClick={onClose} style={{marginTop:18,padding:"10px 36px",background:r.color,border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>CLOSE</button>
    </div>}
  </div>);
}

function Timer({ms}){const[l,sL]=useState(ms);useEffect(()=>{const i=setInterval(()=>sL(x=>Math.max(0,x-1000)),1000);return()=>clearInterval(i);},[]);const h=Math.floor(l/3600000),m=Math.floor((l%3600000)/60000),s=Math.floor((l%60000)/1000);return<span>{h}h {m}m {s}s</span>;}

function MinerCard({miner,onMine,onClaim,onRepair,loading}){
  const r=RARITIES[miner.rarityId];const pct=(miner.nftAgeRemaining/miner.nftAgeTotal)*100;const dead=!miner.isAlive||miner.needsRepair;
  return(<div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:`2px solid ${dead?"#ddd":miner.canClaim?"#FFD600":r.color}`,opacity:dead?.65:1}}>
    <div style={{background:dead?"#f5f5f5":`linear-gradient(135deg,${r.bg},#1a1a2e)`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:r.color,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{r.name}</span>
      <span style={{fontSize:9,fontWeight:600,color:miner.canClaim?"#FFD600":miner.isMining?"#4CAF50":dead?"#999":"#aaa"}}>
        {miner.canClaim?"✅ READY":miner.isMining?"⛏️ MINING":dead?"":miner.isIdle?"💤 IDLE":""}
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
        ?<button disabled={loading} onClick={()=>onRepair(miner.id)} style={{flex:1,padding:"7px",background:"#FF9800",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>🔧 Repair ({(RARITIES[miner.rarityId].repair*DIG_RATE).toFixed(0)} DC)</button>
        :!miner.isAlive
          ?<div style={{flex:1,textAlign:"center",color:"#999",fontSize:11,padding:7}}>☠️ DEAD</div>
          :miner.canClaim
            ?<button disabled={loading} onClick={()=>onClaim(miner.id)} style={{flex:1,padding:"7px",background:"linear-gradient(135deg,#FFD600,#FF9800)",border:"none",borderRadius:8,color:"#333",fontSize:11,fontWeight:800,cursor:"pointer"}}>💎 Claim +{miner.dailyDigcoin} DC</button>
            :miner.isMining
              ?<div style={{flex:1,textAlign:"center",color:"#4CAF50",fontSize:10,padding:7}}>⛏️ Mining… <Timer ms={miner.cooldownRemaining}/></div>
              :<button disabled={loading} onClick={()=>onMine(miner.id)} style={{flex:1,padding:"7px",background:`linear-gradient(135deg,${r.color},${r.color}dd)`,border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>⛏️ Mine</button>}
    </div>
  </div>);
}

function FarmCalculator({miners}){
  const[simQty,setSimQty]=useState({0:0,1:0,2:0,3:0,4:0,5:0});
  const alive=miners.filter(m=>m.isAlive&&!m.needsRepair);
  const dailyTotal=alive.reduce((s,m)=>s+m.dailyDigcoin,0);
  const weeklyTotal=dailyTotal*7;
  const monthlyTotal=dailyTotal*30;

  // Simulator totals
  const simDaily=RARITIES.reduce((s,r)=>{
    const qty=simQty[r.id]||0;
    const avg=(r.dailyMin+r.dailyMax)/2;
    return s+avg*qty;
  },0);
  const simWeekly=simDaily*7;
  const simMonthly=simDaily*30;

  const Card=({label,dc,usd})=>(
    <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:16,textAlign:"center",border:"1px solid #eee",flex:1,minWidth:120}}>
      <div style={{fontSize:10,color:"#888",marginBottom:4}}>{label}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#FF9800"}}>{dc.toFixed(1)} DC</div>
      <div style={{fontSize:11,color:"#4CAF50",fontWeight:600}}>${usd.toFixed(2)} USD</div>
    </div>
  );

  return(<div style={{animation:"fadeIn .3s ease",display:"flex",flexDirection:"column",gap:16}}>

    {/* YOUR MINERS STATS */}
    <div style={{background:"rgba(255,255,255,.95)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
      <h2 style={{fontSize:16,fontWeight:800,color:"#333",marginBottom:4}}>📊 Your Farm Stats</h2>
      <p style={{fontSize:11,color:"#888",marginBottom:20}}>{alive.length} active miners · 100 DC = 1 pathUSD</p>
      {alive.length===0
        ?<div style={{textAlign:"center",padding:24,color:"#aaa",fontSize:12}}>No active miners yet. Buy boxes in the Shop!</div>
        :<>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            <Card label="Daily Income" dc={dailyTotal} usd={dailyTotal/DIG_RATE}/>
            <Card label="Weekly Income" dc={weeklyTotal} usd={weeklyTotal/DIG_RATE}/>
            <Card label="Monthly Income" dc={monthlyTotal} usd={monthlyTotal/DIG_RATE}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead><tr style={{background:"#f5f5f5"}}>
                {["Miner","Rarity","Daily DC","Daily USD","Monthly DC","Monthly USD","Lifespan Left","Total Remaining"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",fontWeight:700,color:"#555",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{alive.map(m=>{
                const r=RARITIES[m.rarityId];
                const monthDC=m.dailyDigcoin*30;
                const remaining=m.dailyDigcoin*m.nftAgeRemaining;
                return(<tr key={m.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                  <td style={{padding:"8px 10px"}}><img src={NFT_IMGS[m.rarityId]} alt={r.name} style={{width:28,height:28,objectFit:"contain",verticalAlign:"middle",marginRight:6}}/><span style={{fontWeight:600,fontSize:10}}>#{m.id}</span></td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:r.color}}>{r.name}</td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:"#FF9800"}}>{m.dailyDigcoin.toFixed(2)}</td>
                  <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(m.dailyDigcoin/DIG_RATE).toFixed(4)}</td>
                  <td style={{padding:"8px 10px"}}>{monthDC.toFixed(1)}</td>
                  <td style={{padding:"8px 10px",color:"#4CAF50"}}>${(monthDC/DIG_RATE).toFixed(3)}</td>
                  <td style={{padding:"8px 10px"}}>{m.nftAgeRemaining} days</td>
                  <td style={{padding:"8px 10px",fontWeight:600,color:"#2196F3"}}>{remaining.toFixed(0)} DC</td>
                </tr>);
              })}</tbody>
              <tfoot><tr style={{background:"#FFF8E1",fontWeight:800}}>
                <td colSpan={2} style={{padding:"10px",fontSize:12}}>TOTAL</td>
                <td style={{padding:"10px",color:"#FF9800"}}>{dailyTotal.toFixed(2)}</td>
                <td style={{padding:"10px",color:"#4CAF50"}}>${(dailyTotal/DIG_RATE).toFixed(4)}</td>
                <td style={{padding:"10px"}}>{monthlyTotal.toFixed(1)}</td>
                <td style={{padding:"10px",color:"#4CAF50"}}>${(monthlyTotal/DIG_RATE).toFixed(3)}</td>
                <td colSpan={2} style={{padding:"10px",color:"#888",fontSize:10}}>across {alive.length} miners</td>
              </tr></tfoot>
            </table>
          </div>
          {/* Breakdown by rarity */}
          <div style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            {RARITIES.map(r=>{
              const group=alive.filter(m=>m.rarityId===r.id);
              if(!group.length) return null;
              const dc=group.reduce((s,m)=>s+m.dailyDigcoin,0);
              return(<div key={r.id} style={{background:r.bg||"#f5f5f5",borderRadius:10,padding:"8px 14px",border:`1px solid ${r.color}`,display:"flex",gap:10,alignItems:"center"}}>
                <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:24,height:24,objectFit:"contain"}}/>
                <div>
                  <div style={{fontSize:10,color:r.color,fontWeight:700}}>{r.name} ×{group.length}</div>
                  <div style={{fontSize:11,fontWeight:800,color:"#333"}}>{dc.toFixed(1)} DC/day</div>
                </div>
              </div>);
            })}
          </div>
        </>}
    </div>

    {/* SIMULATOR */}
    <div style={{background:"rgba(255,255,255,.95)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
      <h2 style={{fontSize:16,fontWeight:800,color:"#333",marginBottom:4}}>🧮 Farm Simulator</h2>
      <p style={{fontSize:11,color:"#888",marginBottom:20}}>Simulate how much you would earn with any combination of miners.</p>
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
          <div style={{fontSize:12,color:"#aaa",marginBottom:12,textAlign:"center"}}>Simulation Result</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            {[["Daily",simDaily,simDaily/DIG_RATE],["Weekly",simWeekly,simWeekly/DIG_RATE],["Monthly",simMonthly,simMonthly/DIG_RATE]].map(([l,dc,usd])=>(
              <div key={l} style={{textAlign:"center",flex:1,minWidth:100}}>
                <div style={{fontSize:10,color:"#888"}}>{l}</div>
                <div style={{fontSize:20,fontWeight:800,color:"#FFD600"}}>{dc.toFixed(1)} DC</div>
                <div style={{fontSize:12,color:"#4CAF50",fontWeight:600}}>${usd.toFixed(3)}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,borderTop:"1px solid #333",paddingTop:12,display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            {[["Box Cost",`${Object.entries(simQty).reduce((s,[id,q])=>s+q*BOX_PRICE,0)} DC`],
              ["ROI",`~${simDaily>0?Math.ceil(Object.entries(simQty).reduce((s,[id,q])=>s+q*BOX_PRICE,0)/simDaily):0} days`],
              ["Total Return",`${Object.entries(simQty).reduce((s,[id,q])=>s+q*(RARITIES[id].dailyMin+RARITIES[id].dailyMax)/2*RARITIES[id].nftAge,0).toFixed(0)} DC`],
            ].map(([l,v])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:9,color:"#888"}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {simDaily===0&&<div style={{textAlign:"center",padding:16,color:"#aaa",fontSize:12}}>Add miners above to see the simulation</div>}
    </div>
  </div>);
}

function HowItWorks(){
  const steps=[
    {icon:"💰",title:"1. Deposit",desc:"Deposit pathUSD into the game. It converts automatically to DIGCOIN at a rate of 100 DIGCOIN = 1 pathUSD. All deposits go to the reward pool."},
    {icon:"📦",title:"2. Buy Boxes",desc:"Use your DIGCOIN to buy Mystery Boxes (300 DIGCOIN each, or 10 for 2850 with 5% discount). Each box contains one random miner with different rarities."},
    {icon:"🎲",title:"3. Get Your Miner",desc:"When you open a box, a random miner is revealed. Rarities range from Common (30% chance) to Mythic (2% chance). Rarer miners have longer lifespans and higher total returns."},
    {icon:"⛏️",title:"4. Start Mining",desc:"Press '⛏️ Mine' on each idle miner to start the 24-hour mining cycle. Or use 'Mine All' to start all idle miners at once (costs 10 DIGCOIN per miner as convenience fee)."},
    {icon:"💎",title:"5. Claim Rewards",desc:"After 24 hours, press '💎 Claim' to collect your DIGCOIN reward. Or use 'Claim All' to collect from all ready miners (costs 10 DIGCOIN per miner). After claiming, miners go back to idle and must be started again."},
    {icon:"⏳",title:"6. Lifespan & Repair",desc:"Each miner has a limited lifespan (45-70 days). When it reaches 0, the miner dies. You can repair it for a small DIGCOIN fee to reset its lifespan."},
    {icon:"🏧",title:"7. Withdraw",desc:"Convert your DIGCOIN back to pathUSD and withdraw to your wallet anytime. A 10% fee applies to all withdrawals."},
    {icon:"🤝",title:"7. Referrals",desc:"Share your referral link with friends. When they deposit, you earn 4% of their deposit amount in DIGCOIN automatically."},
  ];
  return(<div style={{animation:"fadeIn .3s ease"}}>
    <div style={{background:"rgba(255,255,255,.95)",borderRadius:16,padding:32,border:"1px solid #ddd",marginBottom:20}}>
      <h2 style={{fontSize:22,fontWeight:800,color:"#333",marginBottom:4,fontFamily:"'Outfit',sans-serif"}}>⛏️ How It Works</h2>
      <p style={{color:"#888",fontSize:13,marginBottom:24}}>DigMiner is a Click-to-Earn game on the Tempo Mainnet. Buy miners, collect daily rewards, and withdraw real pathUSD.</p>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:16,padding:16,background:i%2===0?"#fafafa":"#fff",borderRadius:12,border:"1px solid #f0f0f0"}}>
          <div style={{fontSize:32,minWidth:48,textAlign:"center"}}>{s.icon}</div>
          <div><h3 style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:4}}>{s.title}</h3><p style={{fontSize:12,color:"#666",lineHeight:1.6}}>{s.desc}</p></div>
        </div>))}
      </div>
    </div>
    <div style={{background:"rgba(255,255,255,.95)",borderRadius:16,padding:24,border:"1px solid #ddd",marginBottom:20}}>
      <h3 style={{fontSize:16,fontWeight:800,marginBottom:16,color:"#333"}}>📊 Miner Stats & ROI</h3>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#f5f5f5"}}>{["Rarity","Chance","Daily DIGCOIN","ROI","Lifespan","Total Return","Repair Cost"].map(h=>(<th key={h} style={{padding:"10px 8px",borderBottom:"2px solid #ddd",textAlign:"left",fontWeight:700,color:"#555"}}>{h}</th>))}</tr></thead>
          <tbody>{RARITIES.map(r=>{const avg=(r.dailyMin+r.dailyMax)/2;return(<tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
            <td style={{padding:"10px 8px",fontWeight:700,color:r.color}}>{r.name}</td>
            <td style={{padding:"10px 8px"}}>{r.chance}</td>
            <td style={{padding:"10px 8px"}}>{r.dailyMin} - {r.dailyMax}</td>
            <td style={{padding:"10px 8px",fontWeight:600,color:"#4CAF50"}}>{Math.ceil(BOX_PRICE/avg)} days</td>
            <td style={{padding:"10px 8px"}}>{r.nftAge} days</td>
            <td style={{padding:"10px 8px",fontWeight:600,color:"#FF9800"}}>{(avg*r.nftAge).toFixed(0)} DC</td>
            <td style={{padding:"10px 8px"}}>{r.repair} pathUSD ({(r.repair*DIG_RATE).toFixed(0)} DC)</td>
          </tr>);})}</tbody>
        </table>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
      {[["💎 DIGCOIN Rate","100 DIGCOIN = 1 pathUSD","Internal game currency"],["📦 Box Price","300 DC (1) / 2850 DC (10)","5% discount on bulk"],["💸 Withdraw Fee","10% on all withdrawals","Fee stays in the pool"],["🤝 Referral","4% of friend's deposit","Paid in DIGCOIN"],["⛏️ Mine All / Claim All","10 DC per miner","Convenience fee for batch actions"],["🔧 Repair","Resets lifespan to full","Cost varies by rarity"]].map(([t,v,d],i)=>(
        <div key={i} style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:16,border:"1px solid #eee",textAlign:"center"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:4}}>{t}</div>
          <div style={{fontSize:15,fontWeight:800,color:"#FF9800"}}>{v}</div>
          <div style={{fontSize:10,color:"#999",marginTop:4}}>{d}</div>
        </div>
      ))}
    </div>
  </div>);
}

// ══════════ MAIN APP ══════════
export default function DigMinerApp(){
  const[wallet,setWallet]=useState(null);
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

  const notify=(msg,ok=true)=>{setNotif({msg,ok});setTimeout(()=>setNotif(null),4000);};

  // Load global stats on mount
  useEffect(()=>{
    fetch("/api/stats").then(r=>r.json()).then(d=>setStats(d)).catch(()=>{});
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
      const data=await res.json();
      setDigcoin(data.player.digcoinBalance);
      setMiners(data.miners);
      setReferralLink(`${window.location.origin}?ref=${address}`);
      await loadPathUSDBalance(address);
      // Check withdraw cooldown
      try{
        const hist=await fetch(`/api/history/${address}?limit=1`).then(r=>r.json());
        const lastW=hist.transactions?.find(t=>t.type==="withdraw");
        if(lastW){
          const elapsed=Date.now()-new Date(lastW.date).getTime();
          const rem=24*60*60*1000-elapsed;
          setWithdrawCooldown(rem>0?rem:0);
        }
      }catch(_){}
    }catch(e){console.error("loadPlayer error:",e.message);}
  },[]);

  const loadTransactions=async(address)=>{
    try{
      const res=await fetch(`/api/history/${address}?limit=30`);
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

  const connectWallet=async()=>{
    if(!window.ethereum) return notify("MetaMask not found! Install it first.",false);
    try{
      setLoading(true);
      const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
      const address=accounts[0];
      await ensureTempoNetwork();
      // Register / load player
      await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wallet:address,referrer:new URLSearchParams(window.location.search).get("ref")})});
      setWallet(address);
      await loadPlayer(address);
      await loadTransactions(address);
      notify("Wallet connected!");
    }catch(e){notify(e.message.slice(0,80),false);}
    finally{setLoading(false);}
  };

  // Listen for account/chain changes
  useEffect(()=>{
    if(!window.ethereum) return;
    const onAccounts=(accs)=>{if(accs.length===0){setWallet(null);setMiners([]);setDigcoin(0);}};
    window.ethereum.on("accountsChanged",onAccounts);
    return()=>window.ethereum.removeListener("accountsChanged",onAccounts);
  },[]);

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
      await fetch("/api/deposit",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet,amountPathUSD:amount,txHash:receipt.hash})});

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
      const res=await fetch("/api/withdraw",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet,amountDigcoin:amount})});
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
      const res=await fetch("/api/box/buy",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet,quantity:qty})});
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

  const startMiner=async(id)=>{
    try{
      setTxLoading(`mine_${id}`);
      const res=await fetch(`/api/play/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify("⛏️ Mining started! Come back in 24h to claim.");
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const claimMiner=async(id)=>{
    try{
      setTxLoading(`claim_${id}`);
      const res=await fetch(`/api/claim/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(`💎 +${data.reward} DIGCOIN claimed!`);
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const playAll=async()=>{
    try{
      setTxLoading("playall");
      const res=await fetch("/api/play-all",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(`⛏️ ${data.started} miners started! Fee: ${data.fee} DC. Claim in 24h.`);
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const claimAll=async()=>{
    try{
      setTxLoading("claimall");
      const res=await fetch("/api/claim-all",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(`💎 Claimed! +${data.netReward} DC net | ${data.claimed} miners | fee: ${data.claimAllFee} DC`);
      await loadPlayer(wallet);
      await loadTransactions(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const repairMiner=async(id)=>{
    try{
      setTxLoading(`repair_${id}`);
      const res=await fetch(`/api/repair/${id}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({wallet})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      notify(`Repaired! -${data.costDigcoin} DIGCOIN`);
      await loadPlayer(wallet);
    }catch(e){notify(e.message,false);}
    finally{setTxLoading("");}
  };

  const alive=miners.filter(m=>m.isAlive&&!m.needsRepair);
  const idleMiners=miners.filter(m=>m.isIdle);
  const miningMiners=miners.filter(m=>m.isMining);
  const readyMiners=miners.filter(m=>m.canClaim);
  const canMineAny=idleMiners.length>0;
  const canClaimAny=readyMiners.length>0;
  const canPlayAny=canClaimAny; // backward compat
  const playableCount=readyMiners.length;
  const filtered=filter==="All"?miners:miners.filter(m=>m.rarityName===filter);
  const fc={All:miners.length};RARITIES.forEach(r=>{fc[r.name]=miners.filter(m=>m.rarityName===r.name).length;});
  const TABS=["My Account","My NFT","Shop","Calculator","How It Works"];
  const tabMap={"My Account":"account","My NFT":"nft","Shop":"shop","Calculator":"calc","How It Works":"how"};

  return(<div style={{minHeight:"100vh",backgroundImage:"linear-gradient(to bottom,#87CEEB 0%,#E8D5A3 40%,#C4A265 100%)",backgroundAttachment:"fixed",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
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
    `}</style>

    {notif&&<div style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:10000,padding:"10px 24px",borderRadius:10,background:notif.ok?"#2E7D32":"#C62828",color:"#fff",fontSize:13,fontWeight:600,animation:"slideDown .3s ease",boxShadow:"0 4px 20px rgba(0,0,0,.3)",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{notif.msg}</div>}
    {revealing&&<BoxReveal miner={revealing} onClose={closeReveal}/>}

    {/* HEADER */}
    <header style={{background:"rgba(0,0,0,.4)",backdropFilter:"blur(10px)",borderBottom:"2px solid #5D4037",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
      <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:38,objectFit:"contain"}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
        {TABS.map(n=><button key={n} onClick={()=>setTab(tabMap[n])} style={{padding:"6px 12px",background:tab===tabMap[n]?"#FFD600":"rgba(255,255,255,.15)",border:"1px solid #8D6E63",borderRadius:6,color:tab===tabMap[n]?"#333":"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>{n}</button>)}
        {wallet
          ?<div style={{padding:"6px 12px",background:"rgba(0,0,0,.3)",borderRadius:6,color:"#FFD600",fontSize:10,fontWeight:600,border:"1px solid #5D4037"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</div>
          :<button disabled={loading} onClick={connectWallet} style={{padding:"6px 14px",background:"#FFD600",border:"none",borderRadius:6,color:"#333",fontSize:11,fontWeight:700,cursor:"pointer"}}>{loading?"Connecting...":"Connect"}</button>}
      </div>
    </header>

    <main style={{maxWidth:1100,margin:"0 auto",padding:20}}>
      {/* GLOBAL STATS */}
      <div style={{display:"flex",gap:0,background:"rgba(255,255,255,.9)",borderRadius:10,overflow:"hidden",marginBottom:20,border:"1px solid #ddd",flexWrap:"wrap"}}>
        {[
          [`${(stats.total_deposited||0).toFixed(2)} pathUSD Pool`],
          [`${stats.totalMiners||0} NFT`],
          [`${stats.totalPlayers||0} Players`],
          [`${(stats.total_withdrawn||0).toFixed(2)} Withdrawn`],
          [`Tempo Mainnet`],
        ].map(([v],i)=>(
          <div key={i} style={{flex:1,minWidth:130,padding:"10px 14px",borderRight:i<4?"1px solid #eee":"none",fontSize:11,fontWeight:600,color:"#333",textAlign:"center"}}>{v}</div>
        ))}
      </div>

      {!wallet?(
        <div style={{textAlign:"center",padding:"80px 20px"}}>
          <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:140,objectFit:"contain",marginBottom:16,filter:"drop-shadow(0 4px 24px rgba(0,0,0,.4))"}}/>
          <p style={{color:"#fff",fontSize:15,textShadow:"1px 1px 2px rgba(0,0,0,.5)",marginBottom:24}}>Mine. Earn. Withdraw. Powered by Tempo.</p>
          <button disabled={loading} onClick={connectWallet} style={{padding:"14px 48px",background:"linear-gradient(135deg,#FFD600,#FF9800)",border:"3px solid #5D4037",borderRadius:12,color:"#333",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"'Press Start 2P',monospace"}}>
            {loading?"CONNECTING...":"CONNECT WALLET"}
          </button>
          <p style={{color:"rgba(255,255,255,.7)",fontSize:11,marginTop:16}}>Requires MetaMask + Tempo Mainnet</p>
        </div>
      ):<>
        {/* WALLET BAR */}
        <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:"12px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #ddd",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:8,background:"#5D4037",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⛏️</div>
            <div><div style={{fontSize:11,fontWeight:700,color:"#333"}}>Wallet Address</div><div style={{fontSize:9,color:"#888",fontFamily:"monospace"}}>{wallet}</div></div>
          </div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>pathUSD Balance</div><div style={{fontSize:13,fontWeight:700}}>{pathUSDBalance} pathUSD</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>DIGCOIN Balance</div><div style={{fontSize:13,fontWeight:700,color:"#FF9800"}}>{digcoin.toFixed(2)} DC [{(digcoin/DIG_RATE).toFixed(4)} pathUSD]</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:10,color:"#888"}}>Miners</div><div style={{fontSize:11,fontWeight:700}}>{idleMiners.length} idle · {miningMiners.length} mining · {readyMiners.length} ready</div></div>
          {canMineAny&&<button disabled={!!txLoading} onClick={playAll} style={{padding:"6px 14px",background:"linear-gradient(135deg,#2196F3,#42A5F5)",border:"2px solid #1565C0",borderRadius:8,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>
            {txLoading==="playall"?"Starting...":"⛏️ Mine All ("+idleMiners.length+")"}
          </button>}
          {canClaimAny&&<button disabled={!!txLoading} onClick={claimAll} style={{padding:"6px 14px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"2px solid #E65100",borderRadius:8,color:"#333",fontSize:11,fontWeight:800,cursor:"pointer"}}>
            {txLoading==="claimall"?"Claiming...":"💎 Claim All ("+readyMiners.length+")"}
          </button>}
        </div>

        {/* MY ACCOUNT */}
        {tab==="account"&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:"12px 20px",marginBottom:14,border:"1px solid #ddd"}}>
            <div style={{fontSize:10,color:"#888",marginBottom:4}}>Your Referral Link</div>
            <input readOnly value={referralLink} style={{width:"100%",padding:"7px 12px",border:"1px solid #ddd",borderRadius:6,fontSize:11,color:"#555",background:"#fafafa",cursor:"pointer"}}
              onClick={e=>{e.target.select();document.execCommand("copy");notify("Referral link copied!");}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {/* DEPOSIT */}
            <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:18,border:"1px solid #ddd"}}>
              <h3 style={{fontSize:13,fontWeight:700,marginBottom:4}}>Deposit pathUSD</h3>
              <p style={{fontSize:10,color:"#888",marginBottom:8}}>Approve + deposit on Tempo blockchain → DIGCOIN credited</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <input type="number" placeholder="0.00" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)} style={{flex:1,padding:"7px 10px",border:"1px solid #ddd",borderRadius:6,fontSize:12}} min="0" step="0.01"/>
                <span style={{padding:"7px 10px",background:"#f5f5f5",borderRadius:6,fontSize:11,fontWeight:600,display:"flex",alignItems:"center"}}>pathUSD</span>
              </div>
              {depositAmt&&<div style={{fontSize:10,color:"#4CAF50",marginBottom:8}}>= {(parseFloat(depositAmt||0)*DIG_RATE).toFixed(0)} DIGCOIN</div>}
              <button disabled={!!txLoading} onClick={doDeposit} style={{padding:"7px 20px",background:"#4CAF50",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {txLoading==="deposit"?"Processing...":"Deposit"}
              </button>
            </div>
            {/* WITHDRAW */}
            <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:18,border:"1px solid #FFB74D"}}>
              <h3 style={{fontSize:13,fontWeight:700,marginBottom:4}}>Withdraw <span style={{fontSize:10,color:"#999",fontWeight:400}}>(10% fee)</span></h3>
              <p style={{fontSize:10,color:"#888",marginBottom:8}}>Backend signs → you receive pathUSD on-chain</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <input type="number" placeholder="0" value={withdrawAmt} onChange={e=>setWithdrawAmt(e.target.value)} style={{flex:1,padding:"7px 10px",border:"1px solid #ddd",borderRadius:6,fontSize:12}} min="0"/>
                <span style={{padding:"7px 10px",background:"#f5f5f5",borderRadius:6,fontSize:11,fontWeight:600}}>DIGCOIN</span>
              </div>
              {withdrawAmt&&<div style={{fontSize:10,color:"#FF9800",marginBottom:8}}>
                = {(parseFloat(withdrawAmt||0)/DIG_RATE).toFixed(4)} pathUSD → net {(parseFloat(withdrawAmt||0)/DIG_RATE*0.90).toFixed(4)} pathUSD
              </div>}
              <button disabled={!!txLoading||withdrawCooldown>0} onClick={doWithdraw} style={{padding:"7px 20px",background:withdrawCooldown>0?"#aaa":"#FF9800",border:"none",borderRadius:6,color:"#fff",fontSize:12,fontWeight:600,cursor:withdrawCooldown>0?"not-allowed":"pointer"}}>
                {txLoading==="withdraw"?"Processing...":withdrawCooldown>0?<Timer ms={withdrawCooldown}/>:"Withdraw"}
              </button>
              {withdrawCooldown>0&&<p style={{fontSize:10,color:"#E65100",marginTop:4}}>⏳ 1 withdraw per 24h — next in <Timer ms={withdrawCooldown}/></p>}
            </div>
          </div>
          {/* TRANSACTIONS */}
          <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:18,border:"1px solid #ddd"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h3 style={{fontSize:13,fontWeight:700,color:"#5D4037"}}>Transaction History</h3>
              <button onClick={()=>loadTransactions(wallet)} style={{fontSize:10,padding:"4px 10px",background:"#f5f5f5",border:"1px solid #ddd",borderRadius:5,cursor:"pointer"}}>Refresh</button>
            </div>
            {transactions.length===0
              ?<div style={{textAlign:"center",padding:20,color:"#aaa",fontSize:12}}>No transactions yet</div>
              :<table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
                <thead><tr style={{background:"#f9f9f9"}}>
                  <th style={{padding:7,textAlign:"left",borderBottom:"1px solid #eee"}}>Date</th>
                  <th style={{padding:7,textAlign:"left",borderBottom:"1px solid #eee"}}>Type</th>
                  <th style={{padding:7,textAlign:"left",borderBottom:"1px solid #eee"}}>Detail</th>
                  <th style={{padding:7,textAlign:"right",borderBottom:"1px solid #eee"}}>Amount</th>
                </tr></thead>
                <tbody>{transactions.map((t,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f5f5f5"}}>
                    <td style={{padding:7,color:"#666"}}>{new Date(t.date).toLocaleString()}</td>
                    <td style={{padding:7}}><span style={{padding:"2px 6px",borderRadius:4,fontSize:9,fontWeight:700,background:t.type==="deposit"?"#e8f5e9":t.type==="withdraw"?"#fff3e0":t.type==="play"?"#e3f2fd":"#fce4ec",color:t.type==="deposit"?"#2E7D32":t.type==="withdraw"?"#E65100":t.type==="play"?"#1565C0":"#880E4F"}}>{t.type.toUpperCase()}</span></td>
                    <td style={{padding:7,color:"#333"}}>{t.detail}</td>
                    <td style={{padding:7,textAlign:"right",fontWeight:700,color:t.amount>0?"#4CAF50":"#EF5350"}}>{t.amount>0?"+":""}{t.amount} DC</td>
                  </tr>
                ))}</tbody>
              </table>}
          </div>
        </div>}

        {/* MY NFT */}
        {tab==="nft"&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{display:"flex",gap:4,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {["All",...RARITIES.map(r=>r.name)].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===f?"#FFD600":"#ccc"}`,background:filter===f?"#FFD600":"#fff",color:filter===f?"#333":f==="All"?"#333":(RARITIES.find(r=>r.name===f)?.color||"#333")}}>{f} ({fc[f]||0})</button>)}
            <div style={{marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap"}}>
              {canMineAny&&<button disabled={!!txLoading} onClick={playAll} style={{padding:"7px 14px",background:"#2196F3",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {txLoading==="playall"?"Starting...":"⛏️ Mine All ("+idleMiners.length+", fee: "+(PLAY_ALL_FEE*idleMiners.length)+" DC)"}
              </button>}
              {canClaimAny&&<button disabled={!!txLoading} onClick={claimAll} style={{padding:"7px 14px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"none",borderRadius:8,color:"#333",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {txLoading==="claimall"?"Claiming...":"💎 Claim All ("+readyMiners.length+", fee: "+(PLAY_ALL_FEE*readyMiners.length)+" DC)"}
              </button>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14}}>
            {filtered.length===0
              ?<div style={{gridColumn:"1/-1",textAlign:"center",padding:50,color:"#888",fontSize:13}}><img src="/nftimgs/mistery box.png" alt="box" style={{width:60,height:60,objectFit:"contain",marginBottom:12,opacity:.5}}/><br/>No miners yet. Buy a Box in the Shop!</div>
              :filtered.map(m=><MinerCard key={m.id} miner={m} onMine={startMiner} onClaim={claimMiner} onRepair={repairMiner} loading={!!txLoading}/>)}
          </div>
        </div>}

        {/* SHOP */}
        {tab==="shop"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,animation:"fadeIn .3s ease"}}>
          <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:24,border:"1px solid #ddd",textAlign:"center"}}>
            <img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:100,height:100,objectFit:"contain",marginBottom:10,filter:"drop-shadow(0 0 12px #FFD60088)"}}/>
            <h3 style={{fontSize:15,fontWeight:800,marginBottom:10}}>Buy Mystery Box</h3>
            <div style={{textAlign:"left",padding:"0 16px",marginBottom:14,fontSize:11,color:"#555",lineHeight:1.8}}>
              {RARITIES.map(r=><div key={r.id}>• <span style={{color:r.color,fontWeight:700}}>{r.name}:</span> {r.chance}</div>)}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              <button disabled={!!txLoading} onClick={()=>buyBox(1)} style={{padding:"9px 18px",background:"#FFD600",border:"2px solid #FF9800",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#333"}}>
                {txLoading==="box"?"Opening...":"1 Box = "+BOX_PRICE+" DC"}
              </button>
              <button disabled={!!txLoading} onClick={()=>buyBox(10)} style={{padding:"9px 18px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"2px solid #E65100",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:"#333"}}>
                {txLoading==="box"?"Opening...":"10 Box = "+BOX_10_PRICE+" DC"} <span style={{fontSize:9,color:"#C62828"}}>(5% OFF)</span>
              </button>
            </div>
            <p style={{fontSize:10,color:"#aaa",marginTop:12}}>Balance: {digcoin.toFixed(0)} DIGCOIN</p>
          </div>
          <div style={{background:"rgba(255,255,255,.95)",borderRadius:12,padding:24,border:"1px solid #ddd"}}>
            <h3 style={{fontSize:15,fontWeight:800,marginBottom:14}}>NFT Stats</h3>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
              <thead><tr style={{background:"#f9f9f9"}}>{["NFT","Daily","ROI","Age","Repair"].map(h=><th key={h} style={{padding:7,borderBottom:"2px solid #ddd",textAlign:"left"}}>{h}</th>)}</tr></thead>
              <tbody>{RARITIES.map(r=><tr key={r.id} style={{borderBottom:"1px solid #f0f0f0"}}>
                <td style={{padding:7,fontWeight:600,color:r.color}}>{r.name}</td>
                <td style={{padding:7}}>{r.dailyMin}-{r.dailyMax} DC</td>
                <td style={{padding:7}}>{Math.ceil(BOX_PRICE/((r.dailyMin+r.dailyMax)/2))} days</td>
                <td style={{padding:7}}>{r.nftAge} days</td>
                <td style={{padding:7}}>{r.repair} pathUSD</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}

        {/* CALCULATOR */}
        {tab==="calc"&&<FarmCalculator miners={miners}/>}

        {/* HOW IT WORKS */}
        {tab==="how"&&<HowItWorks/>}
      </>}

      {/* FOOTER */}
      <div style={{textAlign:"center",padding:"36px 0 16px",color:"rgba(255,255,255,.5)",fontSize:9}}>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
          {["Roadmap","Telegram"].map(l=><span key={l} style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer"}}>{l}</span>)}
        </div>
        DigMiner © 2026 • Powered by Tempo Blockchain
      </div>
    </main>
  </div>);
}
