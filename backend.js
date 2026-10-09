/* Sinnoh Trainer Log: standalone backend.
   Signs people in with Firebase Authentication, checks that they have joined the table,
   and then offers the app the same small interface it uses inside claude.ai
   (window.claude.use('db' | 'user' | 'downloads' | 'room')) on top of Cloud Firestore.
   Nothing in this file is secret. Access is enforced by firestore.rules on Google's servers. */
(function(){
'use strict';

var CFG=window.APP_CFG||{};
var FB=CFG.firebase||{};
var gate=null,card=null,shell=document.getElementById('shell');
var auth=null,db=null,provider=null;
var resolveReady,ready=new Promise(function(r){resolveReady=r;});
var caps={};
var entered=false,checking=false,pendingJoin=null,current=null;

/* ---------- the interface the app expects ---------- */
window.claude={use:function(name){return ready.then(function(){return caps[name]||null;});}};

/* ---------- tiny DOM helper (text is always set with textContent) ---------- */
function el(tag,attrs,kids){
  var n=document.createElement(tag);
  if(attrs)Object.keys(attrs).forEach(function(k){
    if(k==='text')n.textContent=attrs[k];
    else if(k==='class')n.className=attrs[k];
    else if(attrs[k]===true)n.setAttribute(k,'');
    else if(attrs[k]!==false&&attrs[k]!=null)n.setAttribute(k,attrs[k]);
  });
  (kids||[]).forEach(function(c){if(c)n.appendChild(typeof c==='string'?document.createTextNode(c):c);});
  return n;
}

/* ---------- gate styling and frame ---------- */
function buildGate(){
  var css=document.getElementById('gate-css')?null:document.createElement('style');
  if(css)css.id='gate-css';
  if(css)
  css.textContent=
    '#gate{position:fixed;inset:0;z-index:200;overflow:auto;background:var(--bg,#E8ECF2);color:var(--ink,#172033);display:grid;place-items:center;padding:20px 16px}'+
    '#gate .g-card{width:min(440px,100%);background:var(--raised,#fff);border:1px solid var(--line,#CBD3E0);border-radius:12px;padding:22px 20px;display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow,0 8px 24px rgba(18,28,48,.1))}'+
    '#gate .g-brand{display:flex;gap:12px;align-items:center}'+
    '#gate .g-brand b{font:600 20px/1.15 var(--f-display,system-ui);display:block}'+
    '#gate .g-brand small{color:var(--muted,#566178);font-size:13px}'+
    '#gate form{display:flex;flex-direction:column;gap:12px}'+
    '#gate h1{font:600 18px/1.2 var(--f-display,system-ui);margin:0}'+
    '#gate .g-msg{font-size:13px;border:1px solid var(--bad,#B3341E);color:var(--bad,#B3341E);border-radius:8px;padding:8px 10px;background:var(--panel,#F4F6FA)}'+
    '#gate .g-msg.ok{border-color:var(--good,#2C7A4B);color:var(--good,#2C7A4B)}'+
    '#gate .g-links{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px}'+
    '#gate .g-link{appearance:none;border:0;background:none;padding:0;color:var(--accent,#2756A3);font:600 13px var(--f-body,system-ui);cursor:pointer;text-decoration:underline}'+
    '#gate .g-or{display:flex;align-items:center;gap:10px;color:var(--muted,#566178);font-size:12px}'+
    '#gate .g-or:before,#gate .g-or:after{content:"";flex:1;border-top:1px solid var(--line,#CBD3E0)}'+
    '#gate .btn{justify-content:center;padding:9px 12px;font-size:14px}'+
    '#gate details{font-size:13px;color:var(--muted,#566178)}'+
    '#gate summary{cursor:pointer;font-weight:600}'+
    '#gate code{font:500 12px var(--f-mono,monospace);background:var(--panel,#F4F6FA);border:1px solid var(--line-soft,#DFE5EE);border-radius:4px;padding:2px 5px;overflow-wrap:anywhere;user-select:all}'+
    '#gate ol{margin:6px 0 0 18px;padding:0;display:flex;flex-direction:column;gap:4px}';
  if(css)document.head.appendChild(css);
  gate=el('div',{id:'gate',role:'dialog','aria-modal':'true','aria-labelledby':'gate-h'});
  card=el('div',{class:'g-card'});
  gate.appendChild(card);
  document.body.appendChild(gate);
  if(shell)shell.inert=true;
}
function frame(title,kids){
  card.textContent='';
  var meta=CFG.title||'Sinnoh Trainer Log';
  card.appendChild(el('div',{class:'g-brand'},[
    el('span',{class:'logo lcd','aria-hidden':'true',text:'LOG'}),
    el('div',null,[el('b',{text:meta}),el('small',{text:'Players and Game Master sign in here'})])
  ]));
  card.appendChild(el('h1',{id:'gate-h',text:title}));
  kids.forEach(function(k){if(k)card.appendChild(k);});
  var f=card.querySelector('input:not([type=hidden])');
  /* focus the first field, unless the person has already clicked into one */
  if(f)setTimeout(function(){var a=document.activeElement;if(a&&a!==document.body&&card.contains(a))return;try{f.focus({preventScroll:true});}catch(e){}},30);
}
function field(label,name,type,o){
  o=o||{};
  var input=el('input',{type:type||'text',name:name,id:'g-'+name,required:o.required!==false,autocomplete:o.ac||'off',maxlength:o.max||false,minlength:o.min||false,placeholder:o.ph||false,spellcheck:'false',autocapitalize:'off'});
  if(o.value)input.value=o.value;
  return el('label',{class:'fld'},[el('span',{class:'fl',text:label}),input]);
}
function msg(text,ok){return text?el('p',{class:'g-msg'+(ok?' ok':''),role:ok?'status':'alert',text:text}):null;}
function linkBtn(text,fn){var b=el('button',{type:'button',class:'g-link',text:text});b.addEventListener('click',fn);return b;}
function submitBtn(text){return el('button',{type:'submit',class:'btn primary',text:text});}
function googleBtn(fn){
  if(CFG.google===false)return null;
  var b=el('button',{type:'button',class:'btn',text:'Continue with Google'});
  b.addEventListener('click',fn);
  return el('div',{style:'display:flex;flex-direction:column;gap:12px'},[el('div',{class:'g-or',text:'or'}),b]);
}
function busy(form,on){
  Array.prototype.forEach.call(form.querySelectorAll('button,input'),function(x){x.disabled=!!on;});
}
function vals(form){
  var o={};
  Array.prototype.forEach.call(form.elements,function(x){if(x.name)o[x.name]=x.value;});
  return o;
}

/* ---------- friendly errors ---------- */
function authMsg(e){
  var c=(e&&e.code)||'';
  var m={
    'auth/email-already-in-use':'That email already has an account. Use Sign in instead.',
    'auth/invalid-email':'That email address does not look right.',
    'auth/weak-password':'Choose a password with at least 6 characters.',
    'auth/invalid-credential':'Email or password is not right.',
    'auth/wrong-password':'Email or password is not right.',
    'auth/user-not-found':'Email or password is not right.',
    'auth/too-many-requests':'Too many attempts. Wait a few minutes and try again.',
    'auth/network-request-failed':'Could not reach Google. Check your connection and try again.',
    'auth/popup-closed-by-user':'The Google window was closed before finishing.',
    'auth/cancelled-popup-request':'',
    'auth/operation-not-allowed':'This sign-in method is not turned on yet. The GM needs to enable it in Firebase (Authentication, Sign-in method).',
    'auth/unauthorized-domain':'This web address is not authorized for sign-in yet. The GM needs to add it in Firebase (Authentication, Settings, Authorized domains).',
    'auth/user-disabled':'This account has been disabled.',
    'auth/missing-password':'Enter your password.'
  };
  if(c in m)return m[c];
  return 'Something went wrong ('+(c||'unknown')+'). Try again.';
}
function dbMsg(e){
  var c=(e&&e.code)||'';
  if(c==='permission-denied')return 'Access was refused. If you are the GM setting this up, check that firestore.rules is published.';
  if(c==='unavailable')return 'Could not reach the database. Check your connection and try again.';
  return 'Could not check your access ('+(c||'unknown')+').';
}

/* ---------- views ---------- */
function showLoading(text){
  frame('One moment',[el('p',{class:'sub',role:'status',text:text||'Checking your sign-in…'})]);
}
function showFatal(title,text,extra){
  frame(title,[el('p',{text:text}),extra||null]);
}
function showSignIn(m,ok,prefill){
  var f=el('form',null,[
    field('Email','email','email',{ac:'email',value:prefill}),
    field('Password','password','password',{ac:'current-password'}),
    msg(m,ok),
    submitBtn('Sign in')
  ]);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=vals(f);busy(f,true);
    auth.signInWithEmailAndPassword(v.email.trim(),v.password).catch(function(e){
      showSignIn(authMsg(e),false,v.email);
    });
  });
  frame('Sign in',[f,googleBtn(function(){google(null);}),
    el('div',{class:'g-links'},[linkBtn('Create an account',function(){showSignUp();}),linkBtn('Forgot your password?',function(){showReset();})])]);
}
function showSignUp(m,keep){
  keep=keep||{};
  var f=el('form',null,[
    field('Display name','name','text',{ac:'nickname',max:40,ph:'What the table should call you',value:keep.name}),
    field('Email','email','email',{ac:'email',value:keep.email}),
    field('Password','password','password',{ac:'new-password',min:6,ph:'At least 6 characters'}),
    field('Table code','code','text',{ph:'From your GM (GM: leave blank)',value:keep.code,required:false}),
    msg(m),
    submitBtn('Create account')
  ]);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=vals(f);
    var name=v.name.trim().slice(0,40);
    if(!name){showSignUp('Enter a display name.',v);return;}
    busy(f,true);
    pendingJoin={name:name,code:v.code.trim()};
    auth.createUserWithEmailAndPassword(v.email.trim(),v.password).then(function(c){
      return c.user.updateProfile({displayName:name}).catch(function(){});
    }).catch(function(e){
      pendingJoin=null;
      showSignUp(authMsg(e),{name:v.name,email:v.email,code:v.code});
    });
  });
  frame('Create your account',[f,
    googleBtn(function(){
      var v=vals(f);
      google({name:'',code:(v.code||'').trim()});
    }),
    el('div',{class:'g-links'},[linkBtn('I already have an account',function(){showSignIn();})])]);
}
function showReset(m,ok,prefill){
  var f=el('form',null,[field('Email','email','email',{ac:'email',value:prefill}),msg(m,ok),submitBtn('Send reset link')]);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=vals(f);busy(f,true);
    auth.sendPasswordResetEmail(v.email.trim()).then(function(){
      showReset('If that email has an account, a reset link is on its way.',true,v.email);
    }).catch(function(e){showReset(authMsg(e),false,v.email);});
  });
  frame('Reset your password',[f,el('div',{class:'g-links'},[linkBtn('Back to sign in',function(){showSignIn();})])]);
}
function copyBtn(text){
  var b=el('button',{type:'button',class:'btn sm',text:'Copy'});
  b.addEventListener('click',function(){
    function done(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy';},1500);}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,function(){});
  });
  return b;
}
function showJoin(user,m,keep){
  keep=keep||{};
  var nm=keep.name!=null?keep.name:(user.displayName||(user.email?user.email.split('@')[0]:''));
  var f=el('form',null,[
    field('Display name','name','text',{ac:'nickname',max:40,value:nm}),
    field('Table code','code','text',{ph:'From your GM',value:keep.code}),
    msg(m),
    submitBtn('Join the table')
  ]);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=vals(f);
    var name=v.name.trim().slice(0,40);
    if(!name){showJoin(user,'Enter a display name.',v);return;}
    busy(f,true);
    join(user,name,v.code.trim()).then(function(){
      return enter(user,false);
    }).catch(function(e){
      if(e&&e.code==='permission-denied')showJoin(user,'That table code did not work. Check it with your GM.',v);
      else showJoin(user,dbMsg(e),v);
    });
  });
  var gm=el('details',null,[
    el('summary',{text:'Setting this site up as the GM?'}),
    el('p',{text:'Your account ID is:'}),
    el('div',{style:'display:flex;gap:8px;align-items:center;flex-wrap:wrap'},[el('code',{text:user.uid}),copyBtn(user.uid)]),
    el('ol',null,[
      el('li',{text:'In the Firebase console, open Firestore Database.'}),
      el('li',{text:'Create a collection named admins, with a document whose ID is the account ID above and one field: gm (boolean) = true.'}),
      el('li',{text:'Create a collection named config, with a document named invite and one field: code (string) = the table code you want to give your players.'}),
      el('li',{text:'Reload this page.'})
    ])
  ]);
  frame('Join the table',[
    el('p',{class:'sub',text:'You are signed in as '+(user.email||user.displayName||'a guest')+'. Enter the table code from your GM to join.'}),
    f,gm,
    el('div',{class:'g-links'},[linkBtn('Use a different account',function(){signOut();})])
  ]);
}
function showAccessError(user,e){
  var retry=el('div',{class:'g-links'},[
    linkBtn('Try again',function(){afterAuth(user);}),
    linkBtn('Sign out',function(){signOut();})
  ]);
  frame('Could not open the table',[el('p',{text:dbMsg(e)}),retry]);
}

/* ---------- auth flow ---------- */
function google(join){
  pendingJoin=join;
  var p=new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(p).catch(function(e){
    pendingJoin=null;
    if(e&&e.code==='auth/popup-blocked'){auth.signInWithRedirect(p);return;}
    var t=authMsg(e);
    showSignIn(t,false);
  });
}
function signOut(){
  var go=function(){auth.signOut().then(function(){location.reload();},function(){location.reload();});};
  if(entered&&db&&current){
    var done=false,fin=function(){if(!done){done=true;go();}};
    setTimeout(fin,1500);
    db.doc('presence/'+current.uid).delete().then(fin,fin);
  }else go();
}
function checkAccess(user){
  return db.doc('admins/'+user.uid).get().then(function(a){
    if(a.exists)return 'gm';
    return db.doc('members/'+user.uid).get().then(function(m){return m.exists?'member':'none';});
  });
}
function join(user,name,code){
  name=String(name||'').trim().slice(0,40);
  /* a person who is already a member (for example after a dropped connection) is simply let in */
  return db.doc('members/'+user.uid).get().then(function(s){
    if(s.exists)return;
    return db.doc('members/'+user.uid).set({code:code,joinedAt:Date.now()});
  }).then(function(){
    return db.doc('profiles/'+user.uid).set({name:name}).catch(function(){});   /* enter() makes one if this failed */
  }).then(function(){
    return user.updateProfile({displayName:name}).catch(function(){});
  });
}
function afterAuth(user){
  if(checking)return;
  checking=true;
  current=user;
  showLoading('Opening the table…');
  checkAccess(user).then(function(role){
    if(role==='gm')return enter(user,true);
    if(role==='member')return enter(user,false);
    var pj=pendingJoin;pendingJoin=null;
    if(pj&&pj.code){
      var name=String(pj.name||user.displayName||(user.email?user.email.split('@')[0]:'Player')).slice(0,40);
      return join(user,name,pj.code).then(function(){return enter(user,false);}).catch(function(e){
        if(e&&e.code==='permission-denied')showJoin(user,'That table code did not work. Check it with your GM.',{name:name,code:pj.code});
        else showAccessError(user,e);
      });
    }
    showJoin(user);
  }).catch(function(e){showAccessError(user,e);}).then(function(){checking=false;});
}

/* ---------- once inside ---------- */
function enter(user,isGM){
  if(entered)return Promise.resolve();
  entered=true;
  /* make sure there is a name for other people to read */
  var ensure=db.doc('profiles/'+user.uid).get().then(function(s){
    if(s.exists&&s.data()&&s.data().name)return;
    var n=(user.displayName||(user.email?user.email.split('@')[0]:'')||(isGM?'GM':'Player')).slice(0,40);
    return db.doc('profiles/'+user.uid).set({name:n});
  }).catch(function(){});
  return ensure.then(function(){
    buildCaps(user,isGM);
    CFG.api=makeApi(user);
    if(shell)shell.inert=false;
    if(gate&&gate.parentNode)gate.parentNode.removeChild(gate);
    gate=null;
    resolveReady();
    if(!isGM)watchMembership(user);
  });
}
/* if the GM removes this person while the page is open, close the table behind them */
function watchMembership(user){
  db.doc('members/'+user.uid).onSnapshot(function(s){
    if(!s.exists&&!s.metadata.fromCache)showRemoved();
  },function(){});
}
function showRemoved(){
  if(gate)return;
  buildGate();
  frame('Your access has ended',[
    el('p',{text:'The GM has removed you from this table. If that is a mistake, ask them for the table code and join again.'}),
    el('div',{class:'g-links'},[linkBtn('Sign out',function(){signOut();})])
  ]);
}
function makeApi(user){
  var pw=(user.providerData||[]).some(function(p){return p&&p.providerId==='password';});
  return{
    uid:user.uid,
    email:function(){return user.email||'';},
    displayName:function(){return user.displayName||'';},
    canReset:function(){return pw&&!!user.email;},
    signOut:signOut,
    setName:function(n){
      return db.doc('profiles/'+user.uid).set({name:n}).then(function(){return user.updateProfile({displayName:n}).catch(function(){});});
    },
    resetPassword:function(){return auth.sendPasswordResetEmail(user.email);}
  };
}

/* ---------- capabilities ---------- */
var profileCache={};
function buildCaps(user,isGM){
  var uid=user.uid;
  caps.db=db;
  caps.user={
    isOwner:function(){return Promise.resolve(!!isGM);},
    canEdit:function(){return Promise.resolve(!!isGM);},
    can:function(){return Promise.resolve(true);},
    id:function(){return Promise.resolve(uid);},
    me:function(){return Promise.resolve({id:uid,name:user.displayName||'',isMe:true});},
    profiles:function(ids){
      var list=(ids||[]).slice(0,100);
      return Promise.all(list.map(function(id){
        if(!profileCache[id]){
          profileCache[id]=db.doc('profiles/'+id).get().then(function(s){
            var d=s.exists?s.data():null;
            return{id:id,name:(d&&typeof d.name==='string')?d.name:'',avatarUrl:'',isMe:id===uid,guest:false};
          },function(){return{id:id,name:'',avatarUrl:'',isMe:id===uid,guest:false};});
        }
        return profileCache[id];
      })).then(function(rows){var o={};rows.forEach(function(r){o[r.id]=r;});return o;});
    }
  };
  caps.downloads={
    save:function(o){
      return new Promise(function(res,rej){
        try{
          var blob=new Blob([o.data],{type:o.mime||'application/json'});
          var a=document.createElement('a');
          a.href=URL.createObjectURL(blob);
          a.download=o.filename||'download';
          document.body.appendChild(a);a.click();
          setTimeout(function(){URL.revokeObjectURL(a.href);if(a.parentNode)a.parentNode.removeChild(a);},1500);
          res({status:'saved'});
        }catch(e){rej(e);}
      });
    }
  };
  caps.room=makeRoom(uid);
}

/* presence: who has the table open right now */
function makeRoom(uid){
  var subs=[],docs={},myTab='',started=false,timer=0,sweep=0;
  var FRESH=100000;
  function write(){
    if(typeof document!=='undefined'&&document.visibilityState==='hidden')return Promise.resolve();
    return db.doc('presence/'+uid).set({tab:String(myTab).slice(0,24),at:firebase.firestore.FieldValue.serverTimestamp()}).catch(function(){});
  }
  function emit(){
    var now=Date.now(),peers=[];
    Object.keys(docs).forEach(function(id){
      var d=docs[id];
      if(id!==uid&&now-d.at>FRESH)return;
      peers.push({peer:id,by:id,isMe:id===uid,sameTab:false,kind:'viewer',guest:false,presence:{tab:d.tab},updatedAt:d.at});
    });
    if(!docs[uid])peers.push({peer:uid,by:uid,isMe:true,sameTab:false,kind:'viewer',guest:false,presence:{tab:myTab},updatedAt:now});
    var ch={peers:peers,joined:[],left:[],updated:[]};
    subs.slice().forEach(function(fn){try{fn(ch);}catch(e){}});
  }
  function start(){
    if(started)return;
    started=true;
    db.collection('presence').onSnapshot(function(snap){
      docs={};
      snap.docs.forEach(function(d){
        var v=d.data({serverTimestamps:'estimate'})||{};
        var at=v.at&&typeof v.at.toMillis==='function'?v.at.toMillis():Date.now();
        docs[d.id]={tab:typeof v.tab==='string'?v.tab:'',at:at};
      });
      emit();
    },function(){});
    write();
    timer=setInterval(write,40000);
    sweep=setInterval(emit,30000);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')write();});
    window.addEventListener('pagehide',function(){try{db.doc('presence/'+uid).delete();}catch(e){}});
  }
  return{
    presence:function(p){myTab=(p&&p.tab)||'';return write();},
    onPeers:function(fn){
      subs.push(fn);
      start();
      setTimeout(emit,0);
      return function(){var i=subs.indexOf(fn);if(i>=0)subs.splice(i,1);};
    }
  };
}

/* ---------- start ---------- */
function configured(){
  return !!(FB.apiKey&&FB.projectId&&FB.appId&&!/PASTE|YOUR_|XXXX/i.test(FB.apiKey+FB.projectId+FB.appId));
}
function init(){
  buildGate();
  if(!configured()){
    showFatal('Not connected to Firebase yet','This copy of the site has no Firebase settings. Open firebase-config.js, paste in the settings from your Firebase project, and reload. The README walks through it.');
    return;
  }
  if(!window.firebase||!firebase.auth||!firebase.firestore){
    showFatal('Could not load the sign-in service','The Firebase scripts did not load. Check your connection, turn off any content blocker for this site, and reload.');
    return;
  }
  try{
    firebase.initializeApp(FB);
    auth=firebase.auth();
    db=firebase.firestore();
    db.settings({ignoreUndefinedProperties:true,experimentalAutoDetectLongPolling:true,merge:true});
    /* the app treats a missing document on update() like the claude.ai database does */
    var DR=firebase.firestore.DocumentReference;
    if(DR&&DR.prototype&&!DR.prototype.__stlPatched){
      var u0=DR.prototype.update;
      DR.prototype.update=function(){
        return u0.apply(this,arguments).catch(function(e){
          if(e&&e.code==='not-found'){var x=new Error(e.message);x.code='invalid_argument';throw x;}
          throw e;
        });
      };
      DR.prototype.__stlPatched=true;
    }
  }catch(e){
    showFatal('Could not start','Firebase rejected the settings in firebase-config.js ('+((e&&e.code)||(e&&e.message)||'error')+').');
    return;
  }
  showLoading();
  auth.onAuthStateChanged(function(user){
    if(user){
      if(entered)return;
      afterAuth(user);
    }else{
      if(entered){location.reload();return;}
      current=null;
      showSignIn();
    }
  },function(e){showFatal('Sign-in problem',authMsg(e));});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
