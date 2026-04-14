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
const SALE_BOX_PRICE=150; const SALE_BOX_MAX_TOTAL=2000; const SALE_BOX_MAX_PER_WALLET=50;

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
  const[active,setActive]=useState("intro");
  const NAV=[
    {id:"intro",   emoji:"📖", label:"Introduction"},
    {id:"start",   emoji:"🚀", label:"Quick Start"},
    {id:"boxes",   emoji:"📦", label:"Mystery Boxes"},
    {id:"rarities",emoji:"💎", label:"Rarities"},
    {id:"mining",  emoji:"⛏️",  label:"Mining Cycle"},
    {id:"lifespan",emoji:"⏳", label:"Lifespan & Repair"},
    {id:"withdraw",emoji:"🏧", label:"Withdrawals"},
    {id:"referral",emoji:"🤝", label:"Referrals"},
    {id:"roi",     emoji:"📊", label:"ROI Table"},
    {id:"faq",     emoji:"❓", label:"FAQ"},
  ];
  const go=(id)=>{setActive(id);document.getElementById("gb-"+id)?.scrollIntoView({behavior:"smooth",block:"start"});};
  return(
  <div style={{animation:"fadeIn .3s ease",display:"flex",gap:0,background:"#fff",borderRadius:16,border:"1px solid #e0e0e0",overflow:"visible",minHeight:640,alignItems:"flex-start"}}>
    <div style={{width:210,minWidth:210,background:"#1a1a2e",borderRadius:"16px 0 0 16px",flexShrink:0,position:"sticky",top:8,alignSelf:"flex-start"}}>
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
    <div style={{flex:1,padding:"32px 36px 40px",minWidth:0}}>

      <GBSection id="intro" emoji="📖" title="What is DigMiner?"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:14}}>DigMiner is a <strong>Click-to-Earn game</strong> running on the <strong>Tempo Mainnet</strong> blockchain. You deposit real pathUSD, buy NFT miners, run 24-hour mining cycles, and withdraw your earnings.</p>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:16}}>The core loop: <strong>Deposit → Buy Boxes → Mine → Claim → Withdraw</strong>. The rarer your miner, the more it earns and the longer it lasts.</p>
      <GBCallout type="tip">You don’t pay gas fees to mine or claim. Only deposits and withdrawals touch the blockchain — everything else is instant and free.</GBCallout>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:28}}>
        {[["Exchange Rate","100 DC = 1 pathUSD","#FF9800"],["Box Price","300 DC (single)","#2196F3"],["Bulk (10x)","2850 DC — 5% off","#4CAF50"],["Withdraw Fee","10%","#E91E63"],["Referral Bonus","4% of deposit","#9C27B0"],["Batch Fee","10 DC / miner","#FF9800"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#f8f9fa",borderRadius:10,padding:"12px 14px",border:`1px solid ${c}22`}}>
            <div style={{fontSize:10,color:"#999",fontWeight:600,marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>{l}</div>
            <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <GBSection id="start" emoji="🚀" title="Quick Start Guide"/>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
        {[
          ["Connect your wallet","Click Connect Wallet and approve in MetaMask or Rabby. No gas needed."],
          ["Switch to Tempo Mainnet","The app will prompt you to add and switch to the Tempo network automatically."],
          ["Sign the auth message","Sign a free off-chain message to prove wallet ownership. Valid for 24 hours."],
          ["Deposit pathUSD","My Account → Deposit. Approve the token and confirm. DIGCOIN appears instantly."],
          ["Buy a Mystery Box","Shop → Buy Box. 300 DC for 1, or 2850 DC for 10 (5% discount)."],
          ["Start Mining","In My NFT tab, click ⛏️ Mine on your miner. Return in 24 hours."],
          ["Claim & Withdraw","Click 💎 Claim after 24h. When ready, withdraw from My Account → Withdraw."],
        ].map(([t,d],i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",background:"#f8f9fa",borderRadius:10,border:"1px solid #eee"}}>
            <div style={{background:"#1a1a2e",color:"#FF9800",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{i+1}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#222",marginBottom:3}}>{t}</div><div style={{fontSize:12,color:"#666",lineHeight:1.7}}>{d}</div></div>
          </div>
        ))}
      </div>

      <GBSection id="boxes" emoji="📦" title="Mystery Boxes"/>
      <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <img src="/nftimgs/mistery box.png" alt="Mystery Box" style={{width:96,height:96,objectFit:"contain",filter:"drop-shadow(0 4px 16px #FFD60055)",flexShrink:0}}/>
        <div>
          <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:10}}>Each Mystery Box contains <strong>1 random NFT miner</strong>. Rarity is determined at opening — you cannot choose which one you get.</p>
          <p style={{fontSize:14,color:"#444",lineHeight:1.9,margin:0}}>After purchase, an animation reveals your miner. It appears immediately in the NFT tab, ready to mine.</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px 20px",border:"1px solid #eee"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#666",marginBottom:6}}>📦 SINGLE BOX</div>
          <div style={{fontSize:28,fontWeight:900,color:"#FF9800"}}>300 DC</div>
          <div style={{fontSize:11,color:"#aaa",marginTop:4}}>= 3 pathUSD</div>
        </div>
        <div style={{background:"#1a1a2e",borderRadius:12,padding:"18px 20px",border:"2px solid #FF9800",position:"relative"}}>
          <div style={{position:"absolute",top:-11,right:14,background:"#FF9800",color:"#fff",fontSize:9,fontWeight:800,padding:"3px 10px",borderRadius:10}}>BEST VALUE</div>
          <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.5)",marginBottom:6}}>📦 x10 BOXES</div>
          <div style={{fontSize:28,fontWeight:900,color:"#FF9800"}}>2850 DC</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:4}}>5% discount — saves 150 DC</div>
        </div>
      </div>
      <GBCallout type="info">Each box roll is independent. Buying 10 boxes does not guarantee any specific rarity — you get 10 separate random outcomes.</GBCallout>

      <GBSection id="rarities" emoji="💎" title="Miner Rarities"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>There are <strong>6 rarity tiers</strong>. Rarer miners earn more DIGCOIN per day and have longer lifespans, but lower drop chances.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(128px,1fr))",gap:12,marginBottom:22}}>
        {RARITIES.map(r=>(
          <div key={r.id} style={{borderRadius:14,overflow:"hidden",border:`2px solid ${r.color}`,background:"#0d0d1a",textAlign:"center"}}>
            <div style={{padding:"14px 8px 4px",background:`linear-gradient(180deg,${r.bg} 0%,#0d0d1a 100%)`}}>
              <img src={NFT_IMGS[r.id]} alt={r.name} style={{width:66,height:66,objectFit:"contain",filter:`drop-shadow(0 0 8px ${r.color}88)`}}/>
            </div>
            <div style={{padding:"8px 8px 14px"}}>
              <div style={{color:r.color,fontWeight:800,fontSize:11,marginBottom:3}}>{r.name}</div>
              <div style={{color:"rgba(255,255,255,.4)",fontSize:10,marginBottom:7}}>{r.chance} chance</div>
              <div style={{color:"#FFD600",fontWeight:700,fontSize:13}}>{r.dailyMin}–{r.dailyMax}<span style={{color:"rgba(255,255,255,.35)",fontWeight:400,fontSize:10}}> DC/day</span></div>
              <div style={{color:"rgba(255,255,255,.35)",fontSize:10,marginTop:2}}>{r.nftAge} day lifespan</div>
            </div>
          </div>
        ))}
      </div>
      <GBCallout type="warning">A Mythic miner yields roughly <strong>3x more total DIGCOIN</strong> than a Common over its full lifespan. Rarity matters for long-term returns, not just daily rate.</GBCallout>

      <GBSection id="mining" emoji="⛏️" title="The Mining Cycle"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>Every miner moves through a simple 3-state cycle. Mastering this loop is the key to maximizing daily earnings.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:22,borderRadius:12,overflow:"hidden",border:"1px solid #e8e8e8"}}>
        {[["💤","Idle","Miner is waiting. Click ⛏️ Mine to start the 24-hour cycle.","#888"],["⛏️","Mining","Countdown running. Come back when the timer hits 0.","#4CAF50"],["✅","Ready to Claim","Mining complete! Click 💎 Claim to collect your reward.","#FF9800"]].map(([em,st,desc,c],i)=>(
          <div key={i} style={{padding:"18px 14px",background:i===1?"#f0f9f1":i===2?"#fff9f0":"#fafafa",textAlign:"center",borderRight:i<2?"1px solid #e8e8e8":"none"}}>
            <div style={{fontSize:28,marginBottom:8}}>{em}</div>
            <div style={{fontSize:12,fontWeight:800,color:c,marginBottom:8}}>{st}</div>
            <div style={{fontSize:11,color:"#666",lineHeight:1.6}}>{desc}</div>
          </div>
        ))}
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:"#222",marginBottom:10,marginTop:24}}>⚡ Mine All & Claim All</h3>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:12}}>Manage all your miners at once with the batch buttons on the My NFT tab.</p>
      <GBCallout type="info"><strong>Convenience fee: 10 DIGCOIN per miner</strong> for batch actions. With 5 miners, Mine All or Claim All costs 50 DC. Fee is deducted before processing.</GBCallout>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:24}}>After claiming, each miner returns to <strong>Idle</strong>. You must click Mine again to start the next cycle — earnings don’t accumulate passively.</p>

      <GBSection id="lifespan" emoji="⏳" title="Lifespan & Repair"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>Each miner has a finite lifespan in <strong>mining cycles</strong>. Every successful claim decreases the lifespan counter by 1.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px",border:"1px solid #eee"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>📉 When lifespan hits 0</div>
          <div style={{fontSize:12,color:"#666",lineHeight:2}}>• The miner stops mining<br/>• A ⚠️ icon appears on the card<br/>• Repair it to restore full lifespan<br/>• Or let it retire permanently</div>
        </div>
        <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px",border:"1px solid #eee"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>🔧 Repair Cost by Rarity</div>
          {RARITIES.map(r=>(
            <div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderBottom:"1px solid #f0f0f0"}}>
              <span style={{color:r.color,fontWeight:700}}>{r.name}</span>
              <span style={{color:"#555"}}>{r.repair} pathUSD ({r.repair*DIG_RATE} DC)</span>
            </div>
          ))}
        </div>
      </div>
      <GBCallout type="tip">Repair resets to the <strong>original full lifespan</strong>. You can repair unlimited times — a miner never permanently dies unless you choose not to repair it.</GBCallout>

      <GBSection id="withdraw" emoji="🏧" title="Withdrawals"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>Convert your DIGCOIN to pathUSD and withdraw to your wallet. Withdrawals are signed by the server and executed on-chain via the MinerPool smart contract.</p>
      <div style={{background:"#f8f9fa",borderRadius:12,padding:"20px",marginBottom:20,border:"1px solid #eee"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:14}}>💸 Example — Withdrawing 1000 DIGCOIN</div>
        {[["You request","1000 DIGCOIN",false],["Converted to","10 pathUSD",false],["10% protocol fee","−1 pathUSD",false],["You receive","9 pathUSD",true]].map(([l,v,bold])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,padding:"8px 0",borderBottom:"1px solid #e8e8e8"}}>
            <span style={{color:"#888"}}>{l}</span>
            <span style={{fontWeight:bold?900:600,color:bold?"#4CAF50":"#333",fontSize:bold?15:13}}>{v}</span>
          </div>
        ))}
      </div>
      <GBCallout type="warning"><strong>Rules:</strong> 24h cooldown between withdrawals • Minimum 100 DIGCOIN (1 pathUSD) • 10% fee on every withdrawal. Fee stays in the reward pool.</GBCallout>

      <GBSection id="referral" emoji="🤝" title="Referral Program"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>Share your unique referral link and earn <strong>4% of every deposit</strong> your referred friends make — instantly credited to your DIGCOIN balance.</p>
      <div style={{background:"#1a1a2e",borderRadius:12,padding:"20px",marginBottom:20}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Your Referral Link</div>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:12,color:"#FFD600",wordBreak:"break-all"}}>https://digminer.xyz?ref=0xYourWallet</div>
        <div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,.5)",lineHeight:1.7}}>Find your personalized link in the <span style={{color:"#FF9800",fontWeight:700}}>My Account</span> tab after connecting.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[["1","Share your link","Post on social media, groups, or send to friends directly"],["2","Friend deposits","They connect and deposit pathUSD into the game"],["3","You earn 4%","Auto-credited to your DIGCOIN balance instantly"]].map(([n,t,d])=>(
          <div key={n} style={{background:"#f8f9fa",borderRadius:10,padding:"14px",textAlign:"center",border:"1px solid #eee"}}>
            <div style={{fontSize:22,fontWeight:900,color:"#FF9800",marginBottom:6,fontFamily:"'Outfit',sans-serif"}}>{n}</div>
            <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:5}}>{t}</div>
            <div style={{fontSize:11,color:"#888",lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
      <GBCallout type="tip">No cap on referrals. Every deposit your referrals make earns you 4% — indefinitely, with no extra effort required.</GBCallout>

      <GBSection id="roi" emoji="📊" title="ROI & Full Statistics"/>
      <p style={{fontSize:14,color:"#444",lineHeight:1.9,marginBottom:18}}>Complete breakdown of all 6 miner types — earnings, returns, and ROI based on a single box price of 300 DC.</p>
      <div style={{overflowX:"auto",marginBottom:22}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#1a1a2e"}}>
              {["Miner","Chance","Daily Range","Avg/Day","ROI","Lifespan","Total Return","Repair"].map(h=>(
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
      <GBCallout type="info">ROI is calculated from the box price (300 DC). After ROI, all further earnings are pure profit until the miner retires.</GBCallout>
      <div style={{background:"#f8f9fa",borderRadius:12,padding:"18px 20px",marginBottom:28,border:"1px solid #eee"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#333",marginBottom:12}}>📈 Example 10-Box Portfolio</div>
        <div style={{fontSize:12,color:"#666",lineHeight:2.1}}>
          Avg luck: 3 Common, 3 UnCommon, 2 Rare, 1 Super Rare, 1 Legendary<br/>
          <strong style={{color:"#333"}}>Daily income:</strong> ~255 DC/day ≈ 2.55 pathUSD<br/>
          <strong style={{color:"#333"}}>Investment:</strong> 2850 DC (bulk)<br/>
          <strong style={{color:"#333"}}>Estimated ROI:</strong> ~12 days<br/>
          <strong style={{color:"#4CAF50"}}>Profit over full lifespan:</strong> ~9000–12000 DC
        </div>
      </div>

      <GBSection id="faq" emoji="❓" title="Frequently Asked Questions"/>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:36}}>
        {[
          ["Do I pay gas to mine or claim?","No. Mining and claiming are off-chain. Gas only applies to deposits and withdrawals on Tempo."],
          ["What if I forget to claim for more than 24h?","Nothing happens. Rewards stay pending indefinitely. The miner only loses 1 lifespan day per successful claim, not per day elapsed."],
          ["Can I own multiple miners of the same rarity?","Yes. Own as many as you want — all mine independently and simultaneously."],
          ["Is there a limit to how many boxes I can buy?","No limit. Buy as many as your DIGCOIN balance allows."],
          ["What is pathUSD?","pathUSD is a USD-pegged stablecoin on the Tempo blockchain. 1 pathUSD ≈ $1 USD."],
          ["Can I use Rabby Wallet?","Yes. Rabby is fully compatible — it uses the same window.ethereum interface as MetaMask."],
          ["What happens if I switch accounts in MetaMask?","The game logs you out automatically for security. Connect and sign again with the new wallet."],
          ["Is the 10% withdraw fee negotiable?","No. The fee is fixed and goes back into the reward pool to sustain the game economy."],
          ["Can I repair a miner more than once?","Yes, unlimited times. Repair always resets to the original full lifespan."],
          ["Why do I need to sign a message on login?","The signature proves you own the wallet without spending gas. Only you can modify your account."],
        ].map(([q,a],i)=>(
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
        <div style={{fontSize:11,color:"#ccc"}}>DigMiner © 2026 • Powered by Tempo Blockchain</div>
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
  const[adminLoading,setAdminLoading]=useState("");
  const[saleBoxInfo,setSaleBoxInfo]=useState({totalSold:0,walletBought:0,globalRemaining:SALE_BOX_MAX_TOTAL,walletRemaining:SALE_BOX_MAX_PER_WALLET,endTime:null,isActive:true});
  const[saleCountdown,setSaleCountdown]=useState(null);

  const notify=(msg,ok=true)=>{setNotif({msg,ok});setTimeout(()=>setNotif(null),4000);};

  // Sale box countdown ticker
  useEffect(()=>{
    if(!saleBoxInfo.endTime) return;
    const tick=()=>{
      const rem=saleBoxInfo.endTime - Date.now();
      if(rem<=0){setSaleCountdown(null);setSaleBoxInfo(s=>({...s,isActive:false}));return;}
      const m=Math.floor(rem/60000);const s=Math.floor((rem%60000)/1000);
      setSaleCountdown(`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const i=setInterval(tick,1000);
    return()=>clearInterval(i);
  },[saleBoxInfo.endTime]);

  // Check maintenance status on mount and every 30s
  useEffect(()=>{
    const check=()=>fetch("/api/maintenance").then(r=>r.json()).then(d=>setMaintenanceMode(!!d.maintenance)).catch(()=>{});
    check();
    const interval=setInterval(check,30000);
    return()=>clearInterval(interval);
  },[]);

  // Load global stats on mount
  useEffect(()=>{
    fetch("/api/stats").then(r=>r.json()).then(d=>setStats(d)).catch(()=>{});
    loadSaleBoxInfo("");
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
      setReferralLink(`${window.location.origin}?ref=${address}`);
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
      await loadSaleBoxInfo(address);
    }catch(e){console.error("loadPlayer error:",e.message);}
  },[]);

  const loadTransactions=async(address)=>{
    try{
      const res=await authFetch(`/api/history/${address}?limit=30`);
      const data=await res.json();
      setTransactions(data.transactions||[]);
    }catch(e){console.error("tx history error:",e.message);}
  };

  const loadSaleBoxInfo=async(address)=>{
    try{
      const res=await fetch(`/api/box/sale-info?wallet=${address||""}`);
      const data=await res.json();
      setSaleBoxInfo(data);
    }catch(e){console.error("sale box info error:",e.message);}
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

  const loadAdminPlayers=async()=>{
    try{
      const res=await authFetch("/api/admin/players");
      const d=await res.json();
      if(res.ok) setAdminPlayers(d.players||[]);
    }catch(_){}
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

  const buySaleBox=async(qty)=>{
    const cost=SALE_BOX_PRICE*qty;
    if(!saleBoxInfo.isActive) return notify("The sale has ended! Buy a regular box.",false);
    if(digcoin<cost) return notify(`Need ${cost} DIGCOIN. Deposit pathUSD first!`,false);
    if(saleBoxInfo.globalRemaining<=0) return notify("Sale boxes are sold out!",false);
    if(saleBoxInfo.walletRemaining<=0) return notify(`Wallet limit reached (max ${SALE_BOX_MAX_PER_WALLET})`,false);
    try{
      setTxLoading("sale-box");
      const res=await authFetch("/api/box/buy-sale",{method:"POST",body:JSON.stringify({wallet,quantity:qty})});
      const data=await res.json();
      if(!res.ok) return notify(data.error,false);
      if(qty===1){
        setRevealing(data.miners[0]);
      }else{
        setMiners(p=>[...data.miners,...p]);
        notify(`${qty} sale boxes opened! Check My NFT tab.`);
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
      const res=await authFetch(`/api/play/${id}`,{method:"POST",body:JSON.stringify({wallet})});
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
      const res=await authFetch(`/api/claim/${id}`,{method:"POST",body:JSON.stringify({wallet})});
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
      const res=await authFetch("/api/play-all",{method:"POST",body:JSON.stringify({wallet})});
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
      const res=await authFetch("/api/claim-all",{method:"POST",body:JSON.stringify({wallet})});
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
      const res=await authFetch(`/api/repair/${id}`,{method:"POST",body:JSON.stringify({wallet})});
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
  const TABS=["My Account","My NFT","Shop","Calculator","How It Works",...(isAdmin?["⚙️ Admin"]:[])];
  const tabMap={"My Account":"account","My NFT":"nft","Shop":"shop","Calculator":"calc","How It Works":"how","⚙️ Admin":"admin"};

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

    {/* MAINTENANCE OVERLAY — blocks everything for non-admins */}
    {maintenanceMode&&!isAdmin&&(
      <div style={{position:"fixed",inset:0,zIndex:99999,background:"linear-gradient(135deg,#0d0d1a 0%,#1a1a2e 50%,#0d0d1a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24}}>
        <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:90,objectFit:"contain",marginBottom:24,filter:"drop-shadow(0 0 24px #FF9800)"}}/>
        <div style={{fontSize:56,marginBottom:16}}>🔧</div>
        <h1 style={{color:"#FFD600",fontFamily:"'Press Start 2P',monospace",fontSize:16,marginBottom:20,lineHeight:1.8}}>Under Maintenance</h1>
        <p style={{color:"rgba(255,255,255,.75)",fontSize:14,maxWidth:420,lineHeight:1.9,marginBottom:8}}>
          We're upgrading the game to bring you something even better.
        </p>
        <p style={{color:"rgba(255,255,255,.45)",fontSize:12,marginBottom:32}}>Come back soon — it won't take long!</p>
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

    {/* HEADER */}
    <header style={{background:"rgba(0,0,0,.4)",backdropFilter:"blur(10px)",borderBottom:"2px solid #5D4037",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
      <img src="/nftimgs/diglogo.png" alt="DigMiner" style={{height:38,objectFit:"contain"}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
        {TABS.map(n=><button key={n} onClick={()=>setTab(tabMap[n])} style={{padding:"6px 12px",background:tab===tabMap[n]?"#FFD600":"rgba(255,255,255,.15)",border:"1px solid #8D6E63",borderRadius:6,color:tab===tabMap[n]?"#333":"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>{n}</button>)}
        <button onClick={()=>notify("Marketplace coming soon! Stay tuned.",true)} style={{padding:"6px 12px",background:"rgba(255,255,255,.07)",border:"1px dashed #8D6E63",borderRadius:6,color:"rgba(255,255,255,.45)",fontSize:10,fontWeight:600,cursor:"pointer"}}>🏪 Marketplace <span style={{fontSize:8,background:"#FF9800",color:"#fff",borderRadius:3,padding:"1px 4px",marginLeft:3,fontWeight:700,verticalAlign:"middle"}}>SOON</span></button>
        {wallet
          ?<div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{padding:"6px 12px",background:"rgba(0,0,0,.3)",borderRadius:6,color:"#FFD600",fontSize:10,fontWeight:600,border:"1px solid #5D4037"}}>{wallet.slice(0,6)}...{wallet.slice(-4)}</div>
            <button onClick={()=>{setWallet(null);setMiners([]);setDigcoin(0);setTransactions([]);setWithdrawCooldown(0);setIsAdmin(false);setPathUSDBalance("0.0000");localStorage.removeItem(AUTH_KEY);setAuthToken(null);}} style={{padding:"6px 10px",background:"rgba(200,0,0,.35)",border:"1px solid #c62828",borderRadius:6,color:"#ff8a80",fontSize:10,fontWeight:700,cursor:"pointer"}} title="Disconnect wallet">✕</button>
          </div>
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
        {tab==="shop"&&<div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>

          {/* ── SALE BOX (limited + timer) ── */}
          {saleBoxInfo.isActive&&saleBoxInfo.globalRemaining>0&&<div style={{background:"rgba(255,255,255,.97)",borderRadius:14,padding:24,border:"3px solid #E53935",boxShadow:"0 4px 24px rgba(229,57,53,.18)",position:"relative",overflow:"hidden"}}>
            {/* ribbon */}
            <div style={{position:"absolute",top:14,right:-28,background:"#E53935",color:"#fff",fontSize:10,fontWeight:800,padding:"4px 36px",transform:"rotate(40deg)",letterSpacing:1}}>LIMITED</div>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              {/* box image with badge */}
              <div style={{position:"relative",flexShrink:0}}>
                <img src="/nftimgs/mistery box.png" alt="Sale Box" style={{width:110,height:110,objectFit:"contain",filter:"drop-shadow(0 0 16px #E5393588)"}}/>
                <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",background:"#E53935",color:"#fff",fontSize:11,fontWeight:900,borderRadius:6,padding:"3px 10px",whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}>50% OFF</div>
              </div>
              {/* info */}
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                  <h3 style={{fontSize:17,fontWeight:900,color:"#B71C1C",margin:0}}>Sale Mystery Box</h3>
                  {saleCountdown&&<div style={{background:"#B71C1C",color:"#fff",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:800,fontFamily:"monospace",letterSpacing:1}}>⏱ {saleCountdown}</div>}
                </div>
                <p style={{fontSize:12,color:"#555",marginBottom:10,lineHeight:1.6}}>Same odds as the regular box — at half the price. Limited supply, first come first served.</p>
                {/* supply bar */}
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,color:"#555",marginBottom:4}}>
                    <span>Supply: {saleBoxInfo.globalRemaining} / {SALE_BOX_MAX_TOTAL} remaining</span>
                    <span style={{color:"#E53935"}}>{Math.round((saleBoxInfo.totalSold/SALE_BOX_MAX_TOTAL)*100)}% sold</span>
                  </div>
                  <div style={{height:8,borderRadius:4,background:"#eee",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#E53935,#FF7043)",width:`${Math.round((saleBoxInfo.totalSold/SALE_BOX_MAX_TOTAL)*100)}%`,transition:"width .4s"}}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:"#888",marginBottom:12}}>Your wallet: {saleBoxInfo.walletBought} / {SALE_BOX_MAX_PER_WALLET} used&nbsp;·&nbsp;{saleBoxInfo.walletRemaining} left</div>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <div style={{fontSize:26,fontWeight:900,color:"#E53935"}}>{SALE_BOX_PRICE} DC</div>
                  <div style={{fontSize:12,color:"#aaa",textDecoration:"line-through"}}>{BOX_PRICE} DC</div>
                  <button
                    disabled={!!txLoading||saleBoxInfo.walletRemaining<=0||saleBoxInfo.globalRemaining<=0}
                    onClick={()=>buySaleBox(1)}
                    style={{padding:"10px 22px",background:saleBoxInfo.walletRemaining<=0?"#ccc":"linear-gradient(135deg,#E53935,#FF7043)",border:"none",borderRadius:8,fontSize:13,fontWeight:800,cursor:saleBoxInfo.walletRemaining<=0?"not-allowed":"pointer",color:"#fff",boxShadow:"0 4px 14px rgba(229,57,53,.35)"}}>
                    {txLoading==="sale-box"?"Opening...":saleBoxInfo.walletRemaining<=0?"Limit Reached":"Buy 1 Box"}
                  </button>
                </div>
              </div>
            </div>
          </div>}

          {/* sale ended banner */}
          {(!saleBoxInfo.isActive||saleBoxInfo.globalRemaining<=0)&&<div style={{background:"rgba(255,255,255,.95)",borderRadius:14,padding:20,border:"2px solid #ccc",textAlign:"center",color:"#aaa"}}>
            <div style={{fontSize:28,marginBottom:6}}>📦</div>
            <div style={{fontSize:14,fontWeight:700}}>{saleBoxInfo.globalRemaining<=0?"Sale Boxes — Sold Out":"Sale Ended"}</div>
            <div style={{fontSize:12,marginTop:4}}>{saleBoxInfo.globalRemaining<=0?"All 2,000 sale boxes have been claimed.":"The 30-minute launch sale has ended. Regular boxes are still available below."}</div>
          </div>}

          {/* ── regular boxes + stats ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
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
          </div>
        </div>}

        {/* CALCULATOR */}
        {tab==="calc"&&<FarmCalculator miners={miners}/>}

        {/* HOW IT WORKS */}
        {tab==="how"&&<HowItWorks/>}

        {/* ADMIN PANEL */}
        {tab==="admin"&&isAdmin&&<div style={{animation:"fadeIn .3s ease",display:"flex",flexDirection:"column",gap:16}}>

          {/* Maintenance */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:`3px solid ${maintenance?"#EF5350":"#4CAF50"}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>🔧 Maintenance Mode</h2>
                <p style={{fontSize:12,color:"#888"}}>When enabled, all game actions are blocked for every player.</p>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:maintenance?"#EF5350":"#4CAF50"}}>
                  {maintenance?"⚠️ GAME IS DOWN":"✅ Game is Live"}
                </div>
                <button disabled={adminLoading==="maint"} onClick={toggleMaintenance} style={{padding:"10px 32px",background:maintenance?"#4CAF50":"#EF5350",border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",minWidth:200}}>
                  {adminLoading==="maint"?"Updating...":(maintenance?"🟢 Bring Game Back Online":"🔴 Put Game in Maintenance")}
                </button>
              </div>
            </div>
          </div>

          {/* Send DIGCOIN */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>💸 Send DIGCOIN</h2>
            <p style={{fontSize:12,color:"#888",marginBottom:16}}>Send DIGCOIN directly to any wallet — for giveaways, influencers, or payments.</p>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:10,alignItems:"end",flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>Wallet Address</div>
                <input value={adminTo} onChange={e=>setAdminTo(e.target.value)} placeholder="0x..." style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12,fontFamily:"monospace"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>Amount (DIGCOIN)</div>
                <input type="number" min="1" value={adminAmt} onChange={e=>setAdminAmt(e.target.value)} placeholder="e.g. 1000" style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#888",marginBottom:4}}>Reason (optional)</div>
                <input value={adminReason} onChange={e=>setAdminReason(e.target.value)} placeholder="giveaway, influencer..." style={{width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:12}}/>
              </div>
              <button disabled={adminLoading==="send"} onClick={adminSendDigcoin} style={{padding:"9px 24px",background:"linear-gradient(135deg,#FF9800,#FFD600)",border:"none",borderRadius:8,color:"#333",fontSize:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
                {adminLoading==="send"?"Sending...":"Send 💸"}
              </button>
            </div>
            {adminLog.length>0&&<div style={{marginTop:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#555",marginBottom:8}}>Recent Sends</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#f9f9f9"}}>{["Wallet","Amount","Reason","Time"].map(h=><th key={h} style={{padding:"6px 10px",borderBottom:"1px solid #eee",textAlign:"left",color:"#888"}}>{h}</th>)}</tr></thead>
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

          {/* Players list */}
          <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:24,border:"1px solid #ddd"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><h2 style={{fontSize:18,fontWeight:800,color:"#333",marginBottom:4}}>👥 All Players</h2><p style={{fontSize:12,color:"#888"}}>Top 100 by DIGCOIN balance</p></div>
              <button onClick={loadAdminPlayers} style={{padding:"7px 16px",background:"#2196F3",border:"none",borderRadius:8,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>Load Players</button>
            </div>
            {adminPlayers.length>0&&<div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:"#f5f5f5"}}>{["Wallet","Balance (DC)","Deposited ($)","Earned (DC)","Boxes","Joined"].map(h=><th key={h} style={{padding:"8px 10px",borderBottom:"2px solid #ddd",textAlign:"left",color:"#555"}}>{h}</th>)}</tr></thead>
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
            {adminPlayers.length===0&&<div style={{textAlign:"center",padding:20,color:"#bbb",fontSize:12}}>Click "Load Players" to view</div>}
          </div>

        </div>}
      </>}

      {/* FOOTER */}
      <div style={{textAlign:"center",padding:"36px 0 16px",color:"rgba(255,255,255,.5)",fontSize:9}}>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
          <span style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer"}}>Roadmap</span>
          <a href="https://t.me/+RFYExBlVNwk0NmE0" target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer",color:"rgba(255,255,255,.5)",textDecoration:"none"}}>Telegram</a>
          <a href="https://x.com/digminertempo" target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",background:"rgba(0,0,0,.2)",borderRadius:4,cursor:"pointer",color:"rgba(255,255,255,.5)",textDecoration:"none"}}>Twitter</a>
        </div>
        DigMiner © 2026 • Powered by Tempo Blockchain
      </div>
    </main>
  </div>);
}
