// Cloudflare Worker + D1. Binding D1 nommé DB. Données publiques, pas d'identité vérifiée.
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
function json(v,status=200){return new Response(JSON.stringify(v),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
const names=['Ferrari','Mercedes','Red Bull','Alpine','McLaren'];
export default {async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 let url=new URL(req.url);try{
 if(req.method==='GET'&&url.pathname==='/leaderboard'){
 let [drivers,laps,races,teams]=await Promise.all([
 env.DB.prepare('SELECT player_id, MAX(name) name, MAX(tag) tag, MAX(team) team, SUM(points) points, COUNT(*) races FROM results GROUP BY player_id ORDER BY points DESC, races DESC LIMIT 30').all(),
 env.DB.prepare('SELECT r.name,r.track,r.best_lap FROM results r JOIN (SELECT track, MIN(best_lap) best FROM results WHERE best_lap IS NOT NULL GROUP BY track) x ON x.track=r.track AND x.best=r.best_lap ORDER BY r.best_lap LIMIT 30').all(),
 env.DB.prepare('SELECT name,track,laps,MIN(finish) finish FROM results GROUP BY player_id,track,laps ORDER BY finish ASC LIMIT 30').all(),
 env.DB.prepare('SELECT team,SUM(points) points FROM results GROUP BY team ORDER BY points DESC').all()
 ]);return json({drivers:drivers.results,laps:laps.results,races:races.results,teams:teams.results})}
 if(req.method==='POST'&&url.pathname==='/results'){
 const body=await req.text();if(body.length>4096)return json({error:'too large'},413);let r=JSON.parse(body);
 const str=(v,n)=>String(v??'').trim().slice(0,n);let player_id=str(r.player_id,90),name=str(r.name,18),tag=str(r.tag,3),team=str(r.team,25),track=str(r.track,50),laps=Number(r.laps),finish=Number(r.finish),best_lap=r.best_lap==null?null:Number(r.best_lap),position=Number(r.position),difficulty=Number(r.difficulty),points=[10,7,5,3,1][position-1]||0;
 if(!/^[a-zA-Z0-9-]{10,90}$/.test(player_id)||!name||!names.includes(team)||!track||!Number.isInteger(laps)||laps<1||laps>100||!Number.isFinite(finish)||finish<10||finish>200000||best_lap!==null&&(!Number.isFinite(best_lap)||best_lap<2||best_lap>finish)||!Number.isInteger(position)||position<1||position>10||![0,1,2].includes(difficulty))return json({error:'invalid result'},400);
 // Protection basique contre les doublons ; ne constitue pas un anti-triche.
 let fingerprint=player_id+'|'+track+'|'+laps+'|'+finish.toFixed(2);
 await env.DB.prepare('INSERT OR IGNORE INTO results (fingerprint,player_id,name,tag,team,track,laps,finish,best_lap,position,points,difficulty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(fingerprint,player_id,name,tag,team,track,laps,finish,best_lap,position,points,difficulty).run();return json({ok:true})}
 return json({error:'not found'},404)
 }catch(e){return json({error:'server error',detail:String(e.message||e)},500)}}};
