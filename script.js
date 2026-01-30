/* ========= Brad Bitt — Fusion (Intro + Menu + Niveau 1-0) ========= */
const COLORS = { cyan:'#32C0C1', pink:'#F53098', white:'#FFFFFF', grey:'#888888', gold:'#FFD700' };
const SAVE_KEY = 'bradBittSave';
const SETTINGS_KEY = 'gameSettings';

/* ---- Gestion des paramètres ---- */
function getSettings(){
  const s = localStorage.getItem(SETTINGS_KEY);
  if(s){ try{ return JSON.parse(s); }catch(e){} }
  const d = { difficulty:'Normal', music:true, sfx:true };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(d));
  return d;
}
function setSettings(v){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)); }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function resetSave(){ localStorage.removeItem(SAVE_KEY); }

/* ---- Gestion audio ---- */
class AudioMgr{
  static scene=null; static music=null;
  static init(scene){ this.scene = scene; }
  static play(key,vol=0.9){ const s=getSettings(); if(s.sfx && this.scene) this.scene.sound.play(key,{volume:vol}); }
  static playMusic(key,vol=0.6){
    const s=getSettings(); if(!s.music||!this.scene) return;
    if(this.music){ this.music.stop(); this.music.destroy(); }
    this.music=this.scene.sound.add(key,{volume:vol,loop:true});
    this.music.play();
  }
}

/* ======================= SCÈNES ======================= */

/* 1) Préchargement */
class PreloadScene extends Phaser.Scene{
  constructor(){ super('PreloadScene'); }
  preload(){
    const t=this.add.text(790,585,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff'}).setOrigin(1,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;t.setText('Chargement'+'.'.repeat(d));}});
    [
      'click','hover','open','poweroff','start','continue','back',
      'jump','land_heavy','wind_whoosh','punch','stomp_hit','clong_helmet',
      'enemy_hurt','spikes_toggle_on','spikes_toggle_off','timer_tick',
      'pause_on','pause_off'
    ].forEach(k=>this.load.audio(k,`assets/sounds/${k}.wav`));
    this.load.audio('level1_intro_theme','assets/music/level1_intro_theme.mp3');
    this.load.spritesheet('brad','assets/img/player/brad_48x48.png',{frameWidth:48,frameHeight:48});
    this.load.once('complete',()=>this.scene.start('IntroScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* 2) Logos d’intro */
class IntroScene extends Phaser.Scene{
  constructor(){ super('IntroScene'); }
  create(){
    this._logo('IMAGINe','Studio',COLORS.cyan,COLORS.pink,()=>{
      this._logo('Engine','HwR',COLORS.pink,COLORS.cyan,()=>{
        this.cameras.main.fadeOut(500,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene'));
      });
    });
  }
  _logo(Ltxt,Rtxt,Lcol,Rcol,done){
    const cx=480,cy=300;
    const L=this.add.text(cx,cy,Ltxt,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:Lcol}).setOrigin(1,0.5).setAlpha(0);
    const R=this.add.text(cx,cy,Rtxt,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:Rcol}).setOrigin(0,0.5).setAlpha(0);
    AudioMgr.play('open',0.8);
    this.tweens.add({targets:[L,R],alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.time.delayedCall(2300,()=>{
      AudioMgr.play('poweroff',0.9);
      this.tweens.add({targets:[L,R],scaleY:0.05,alpha:0.8,duration:500,ease:'quad.in',
        onComplete:()=>{L.destroy();R.destroy();this.time.delayedCall(400,done);}});
    });
  }
}

/* 3) Menu principal */
class MenuScene extends Phaser.Scene{
  constructor(){ super('MenuScene'); }
  create(){
    AudioMgr.init(this);
    const title=this.add.text(480,110,'BRAD BITT',{fontFamily:'"Press Start 2P"',fontSize:'36px',color:COLORS.gold,stroke:'#fff',strokeThickness:2})
      .setOrigin(0.5).setAlpha(0);
    this.tweens.add({targets:title,alpha:1,scale:{from:0.9,to:1},duration:600});
    this.add.text(480,155,'mais le jeu',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.white}).setOrigin(0.5);

    const items=[
      {label:'NOUVELLE PARTIE',id:'new'},
      {label:'CONTINUER',id:'continue',disabled:!hasSave()},
      {label:'OPTIONS',id:'options'},
      {label:'CREDITS',id:'credits'}
    ];
    const arrow=this.add.text(0,0,'▶',{fontFamily:'"Press Start 2P"',fontSize:'16px',color:'#fff'}).setVisible(false);
    let y=250;
    items.forEach(e=>{
      const t=this.add.text(480,y,e.label,{fontFamily:'"Press Start 2P"',fontSize:'16px',color:e.disabled?COLORS.grey:COLORS.white}).setOrigin(0.5);
      y+=50;
      if(!e.disabled){
        t.setInteractive({useHandCursor:true});
        t.on('pointerover',()=>{AudioMgr.play('hover',0.7); t.setColor(COLORS.gold);
          arrow.setPosition(t.x-t.displayWidth/2-22,t.y+1).setVisible(true);});
        t.on('pointerout',()=>{t.setColor(COLORS.white); arrow.setVisible(false);});
        t.on('pointerdown',()=>{AudioMgr.play('click'); this._select(e.id);});
      }
    });

    this.add.text(20,580,'Accès Dev. - Version Alpha 0.3.2',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(0,1);
    this.add.text(940,580,'by IMAGINe Studio & Engine HwR',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(1,1);

    this._buildOptions(); this._buildCredits();
  }

  _select(id){
    if(id==='new'){
      if(hasSave()) return this._warnNewGame();
      AudioMgr.play('start'); this.scene.start('BootScene');
    }
    if(id==='continue'&&hasSave()){ AudioMgr.play('continue'); this.scene.start('BootScene'); }
    if(id==='options') this._toggleOptions(true);
    if(id==='credits') this._toggleCredits(true);
  }

  _warnNewGame(){
    AudioMgr.play('open');
    const overlay=document.createElement('div'); overlay.className='popup-overlay';
    const box=document.createElement('div'); box.className='warning-popup';
    box.innerHTML=`
      <div class="warning-symbol">⚠️</div>
      <div class="warning-content">
        <p>Toute progression actuelle sera effacée.<br>Es-tu sûr de vouloir recommencer ?</p>
        <div class="warning-buttons">
          <button id="w-cancel">ANNULER</button>
          <button id="w-ok" class="danger">CONTINUER</button>
        </div>
      </div>`;
    overlay.appendChild(box); document.body.appendChild(overlay);
    document.getElementById('w-cancel').onclick=()=>{AudioMgr.play('back'); document.body.removeChild(overlay);};
    document.getElementById('w-ok').onclick=()=>{AudioMgr.play('click'); resetSave(); document.body.removeChild(overlay); this.scene.start('BootScene');};
  }

  /* ---- OPTIONS ---- */
  _buildOptions(){
    const cx=480,cy=300,s=getSettings(),p=(k)=>AudioMgr.play(k,0.8);
    this.optOverlay=this.add.rectangle(480,300,960,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-190,cy-130,380,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-190,cy-130,380,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'OPTIONS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5).setVisible(false);

    const diffLab=this.add.text(cx-130,cy-45,'Difficulté',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const diffVal=this.add.text(cx+36,cy-45,s.difficulty,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const L=this.add.text(cx-12,cy-45,'<',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const R=this.add.text(cx+84,cy-45,'>',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const diffs=['Facile','Normal','Difficile'],setD=d=>{const s=getSettings();s.difficulty=d;setSettings(s);diffVal.setText(d);};
    L.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+2)%3]);});
    R.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+1)%3]);});

    const musLab=this.add.text(cx-130,cy,'Musique',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const musVal=this.add.text(cx+60,cy,getSettings().music?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan}).setOrigin(0.5).setInteractive().setVisible(false);
    musVal.on('pointerdown',()=>{p('click');const s=getSettings();s.music=!s.music;setSettings(s);musVal.setText(s.music?'ON':'OFF');if(!s.music&&AudioMgr.music){AudioMgr.music.stop();}});

    const sfxLab=this.add.text(cx-130,cy+45,'Sons',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const sfxVal=this.add.text(cx+60,cy+45,getSettings().sfx?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan}).setOrigin(0.5).setInteractive().setVisible(false);
    sfxVal.on('pointerdown',()=>{p('click');const s=getSettings();s.sfx=!s.sfx;setSettings(s);sfxVal.setText(s.sfx?'ON':'OFF');});

    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleOptions(false);});

    this.optElems=[g,title,diffLab,diffVal,L,R,musLab,musVal,sfxLab,sfxVal,back];
  }
  _toggleOptions(v){this.optOverlay.setVisible(v);this.optElems.forEach(e=>e.setVisible(v));}

  /* ---- CRÉDITS ---- */
  _buildCredits(){
    const cx=480,cy=300,p=(k)=>AudioMgr.play(k,0.8);
    this.credOverlay=this.add.rectangle(480,300,960,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-210,cy-130,420,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-210,cy-130,420,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'CREDITS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const text=this.add.text(cx,cy-25,"Site imaginé par Brad Bitt.\n\nMusique : Échantillons créés par Mixvibes,\nassemblés par Lilyo.",{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff',align:'center'}).setOrigin(0.5).setVisible(false);
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleCredits(false);});
    this.credElems=[g,title,text,back];
  }
  _toggleCredits(v){this.credOverlay.setVisible(v);this.credElems.forEach(e=>e.setVisible(v));}
}

/* 4) Boot du niveau */
class BootScene extends Phaser.Scene{
  constructor(){super('BootScene');}
  preload(){
    const t=this.add.text(480,560,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;t.setText('Chargement'+'.'.repeat(d));}});
    this.load.once('complete',()=>this.scene.start('DifficultyScene'));
  }
  create(){AudioMgr.init(this);}
}

/* 5) Choix difficulté */
class DifficultyScene extends Phaser.Scene{
  constructor(){super('DifficultyScene');}
  create(){
    AudioMgr.init(this);
    const overlay=this.add.rectangle(480,300,960,600,0x000000,0.35);
    const panel=this.add.rectangle(480,300,460,240,0x0b0b0f,0.98).setStrokeStyle(2,0xffffff);
    const title=this.add.text(480,240,'CHOISIS LA DIFFICULTÉ',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5);
    const opts=['Facile','Normal','Difficile']; let x=480-140;
    opts.forEach(label=>{
      const btn=this.add.text(x,300,label,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive({useHandCursor:true});
      btn.on('pointerover',()=>{AudioMgr.play('hover',0.7);btn.setColor(COLORS.gold);});
      btn.on('pointerout',()=>btn.setColor('#fff'));
      btn.on('pointerdown',()=>{AudioMgr.play('click');const st=getSettings();st.difficulty=label;setSettings(st);
        this.tweens.add({targets:[overlay,panel,title],alpha:0,duration:400,onComplete:()=>this.scene.start('GameIntroScene')});});
      x+=140;
    });
    this.add.text(480,360,'Appuie pour lancer le niveau 1-0',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#ccc'}).setOrigin(0.5);
  }
}

/* 6) Niveau 1-0 */
class GameIntroScene extends Phaser.Scene{
  constructor(){super('GameIntroScene');}
  create(){
    AudioMgr.init(this);
    this.physics.world.setBounds(0,0,4000,800);
    this.physics.world.gravity.y=1200;

    // --- Fond (dégradé code) ---
    const sky = this.add.graphics();
    const W = this.scale.width;
    const H = this.scale.height;
    const top = Phaser.Display.Color.GetColor(20,36,74);
    const mid = Phaser.Display.Color.GetColor(34,76,130);
    const bottom = Phaser.Display.Color.GetColor(56,108,182);
    sky.fillGradientStyle(top, top, mid, mid, 1); sky.fillRect(0,0,W,H*0.6);
    sky.fillStyle(bottom,1); sky.fillRect(0,H*0.6,W,H*0.4);
    sky.setScrollFactor(0);

    // --- Sol avec herbe + terre ---
    const ground=this.add.graphics().setScrollFactor(1);
    ground.fillStyle(0x5a3c1e,1).fillRect(0,760,4000,40); // terre
    ground.fillStyle(0x3fbf3f,1).fillRect(0,740,4000,20); // herbe
    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(2000,760,null).setDisplaySize(4000,40).refreshBody();

    // --- Joueur ---
    this.player = this.physics.add.sprite(200, 600, 'brad', 0);
    this.player.setDepth(10).setAlpha(1);
    this._initBradAnims();               // animations robustes selon nb de frames
    this.player.play('brad_idle', true);
    this.player.setCollideWorldBounds(true);

    // Hitbox propre (ajuste si besoin selon ton sprite)
    this.player.setSize(24, 36).setOffset(12, 12);

    // Collider
    this.physics.add.collider(this.player, this.platforms, () => this._onLand());

    // Caméra
    this.cameras.main.setBounds(0,0,4000,800);
    this.cameras.main.startFollow(this.player,true,0.12,0.12);

    // Entrées
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyZ=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    AudioMgr.play('wind_whoosh',0.6);
  }

  update(){
    if(!this.player.body) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    if(this.cursors.left.isDown){
      this.player.setVelocityX(-200);
      this.player.setFlipX(true);
      if(onGround) this.player.play('brad_walk',true);
    }else if(this.cursors.right.isDown){
      this.player.setVelocityX(200);
      this.player.setFlipX(false);
      if(onGround) this.player.play('brad_walk',true);
    }else{
      this.player.setVelocityX(0);
      if(onGround) this.player.play('brad_idle',true);
    }

    if((Phaser.Input.Keyboard.JustDown(this.keyZ)||Phaser.Input.Keyboard.JustDown(this.keySpace)) && onGround){
      this.player.setVelocityY(-550);
      AudioMgr.play('jump',0.6);
      this.player.play('brad_jump',true);
    }
  }

  _onLand(){
    if(!this.landed){
      AudioMgr.play('land_heavy',0.7);
      this.landed=true;
      AudioMgr.playMusic('level1_intro_theme',0.35);
    }
  }

  // === Animations robustes (s’adaptent au nombre réel de frames) ===
  _initBradAnims(){
    if(this.anims.exists('brad_idle')) return;

    const tex = this.textures.get('brad');
    // Nombre de frames réellement disponibles (ignore la frame __BASE si présente)
    let total = 0;
    if (tex) {
      const names = tex.getFrameNames();             // ex: ["0","1","2","3",...]
      total = Math.max(0, names.length);
    }

    // Helpers pour borner proprement
    const clampEnd = (start, want) => Math.min(start + want, Math.max(0,total-1));

    // On part du principe (si dispo) :
    // idle : frames 0..3, walk : 4..7, jump : 8..11
    const idleStart = 0, idleEnd = clampEnd(0, 3);
    const walkStart = Math.min(4, Math.max(0,total-1));
    const walkEnd   = clampEnd(walkStart, 3);
    const jumpStart = Math.min(8, Math.max(0,total-1));
    const jumpEnd   = clampEnd(jumpStart, 3);

    // Si total == 0, on sort (texture non trouvée)
    if(total === 0){
      // fallback: rien à faire, le sprite restera sur frame 0
      return;
    }

    this.anims.create({
      key:'brad_idle',
      frames:this.anims.generateFrameNumbers('brad',{ start: idleStart, end: idleEnd }),
      frameRate: Math.max(2, Math.min(8, (idleEnd-idleStart+1)*2 )),
      repeat:-1
    });

    this.anims.create({
      key:'brad_walk',
      frames:this.anims.generateFrameNumbers('brad',{ start: walkStart, end: walkEnd }),
      frameRate: Math.max(4, Math.min(12, (walkEnd-walkStart+1)*3 )),
      repeat:-1
    });

    this.anims.create({
      key:'brad_jump',
      frames:this.anims.generateFrameNumbers('brad',{ start: jumpStart, end: jumpEnd }),
      frameRate: Math.max(4, Math.min(12, (jumpEnd-jumpStart+1)*3 )),
      repeat:-1
    });
  }
}

/* === CONFIGURATION PHASER === */
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 600,
  pixelArt: true,
  transparent: true,
  physics: { default:'arcade', arcade:{ gravity:{y:1000}, debug:false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PreloadScene, IntroScene, MenuScene, BootScene, DifficultyScene, GameIntroScene]
});
