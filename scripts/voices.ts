import { execFileSync } from 'node:child_process';
import { existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunSchema,RunSummarySchema } from '@eulogy/shared';
const base='data/runs/louis-demo';
const summary=RunSummarySchema.parse(JSON.parse(readFileSync(base+'.summary.json','utf8')));
const runs=readFileSync(base+'.jsonl','utf8').trim().split('\n').map(s=>RunSchema.parse(JSON.parse(s)));
const temp=mkdtempSync(join(tmpdir(),'eulogy-voice-'));
const voices:Record<string,string>={lea:'Samantha',anne:'Kathy',camille:'Flo (English (US))',jules:'Daniel'};
if(existsSync('.env'))process.loadEnvFile('.env');
const clips:Record<string,string>={};
try{
for(const run of runs.filter(r=>[summary.most_probable_run_id,summary.best_run_id].includes(r.run_id))){
  const dir='apps/web/public/audio/'+run.run_id;mkdirSync(dir,{recursive:true});
  for(const e of run.eulogies.filter(e=>e.speaks)){
    const key=run.run_id+'/'+e.relative_id;
    const voice=process.env['ELEVENLABS_VOICE_'+e.relative_id.toUpperCase()];
    if(voice && process.env.ELEVENLABS_API_KEY){
      const result=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voice),{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'content-type':'application/json'},body:JSON.stringify({text:e.text,model_id:'eleven_multilingual_v2'})});
      if(!result.ok)throw Error('ElevenLabs HTTP '+result.status);
      writeFileSync(dir+'/'+e.relative_id+'.mp3',Buffer.from(await result.arrayBuffer()));clips[key]='/audio/'+key+'.mp3';
    }else{
      const interim=join(temp,'speech.aiff');
      execFileSync('say',['-v',voices[e.relative_id]??'Daniel','-r','155','-o',interim,e.text]);
      execFileSync('afconvert',['-f','m4af','-d','aac','-b','64000',interim,dir+'/'+e.relative_id+'.m4a']);clips[key]='/audio/'+key+'.m4a';
    }
  }
}
writeFileSync('apps/web/src/data/audio.json',JSON.stringify(clips,null,2)+'\n');
}finally{rmSync(temp,{recursive:true,force:true});}
