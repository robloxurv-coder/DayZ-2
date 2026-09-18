'use strict';
// Synthesized effects only: no downloads or audio files.
WL.audio = {
  context:null,master:null,rain:null,rainGain:null,noiseCache:new Map(),
  init() {
    try {
      if(!this.context){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;this.context=new AudioCtx();this.master=this.context.createGain();this.master.connect(this.context.destination);this.setVolume(WL.settings?.volume ?? .5);}
      if(this.context.state==='suspended')this.context.resume().catch(()=>{});
    }catch(e){/* Gameplay remains available without Web Audio. */}
  },
  setVolume(v){if(this.master)this.master.gain.value=v*.55;},
  tone(freq,duration,volume=.15,type='sine',end=0){
    if(!this.context||this.context.state!=='running')return;
    const c=this.context,t=c.currentTime,osc=c.createOscillator(),gain=c.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,t);if(end)osc.frequency.exponentialRampToValueAtTime(Math.max(end,1),t+duration);
    gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.master);osc.start(t);osc.stop(t+duration);
  },
  noise(duration,volume,cutoff=1500){
    if(!this.context||this.context.state!=='running')return;
    const c=this.context;let buffer=this.noiseCache.get(duration);if(!buffer){buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);if(this.noiseCache.size<16)this.noiseCache.set(duration,buffer);}
    const source=c.createBufferSource(),gain=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cutoff;source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.gain.value=volume;gain.connect(this.master);source.start();
  },
  play(name){
    if(name.startsWith('shoot-')){const heavy=name==='shoot-shotgun'||name==='shoot-rifle';this.noise(heavy?.2:.13,heavy?.7:.45,3200);this.tone(heavy?75:110,.12,.25,'triangle',32);}
    if(name==='swing')this.noise(.09,.09,650);
    if(name==='impact'){this.noise(.07,.19,900);this.tone(95,.06,.1,'triangle',45);}
    if(name==='fire')this.noise(.18,.035,700);
    if(name==='infected')this.tone(65,.32,.025,'triangle',48);
    if(name==='shoot'){this.noise(.16,.9,3500);this.tone(105,.14,.45,'triangle',32);}
    if(name==='step')this.noise(.05,.09,500);
    if(name==='attack'){this.noise(.14,.38,800);this.tone(80,.18,.25,'sawtooth',38);}
    if(name==='loot'){this.tone(640,.09,.13,'sine');setTimeout(()=>this.tone(900,.12,.1),65);}
    if(name==='reload'){this.noise(.12,.2,2600);this.tone(210,.07,.1,'square');}
    if(name==='empty')this.tone(180,.035,.08,'square');
    if(name==='door')this.noise(.16,.2,420);
    if(name==='use')this.tone(440,.2,.1,'sine',660);
  },
  setRain(active){
    if(!this.context)return;
    if(active&&!this.rain){const c=this.context,b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.rain=c.createBufferSource();this.rain.buffer=b;this.rain.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1600;this.rainGain=c.createGain();this.rainGain.gain.value=.045;this.rain.connect(f);f.connect(this.rainGain);this.rainGain.connect(this.master);this.rain.start();}
    if(!active&&this.rain){try{this.rain.stop();}catch(e){}this.rain.disconnect();this.rain=null;}
  }
};
