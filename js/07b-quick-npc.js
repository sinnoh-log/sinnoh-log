'use strict';
/* Sinnoh Trainer Log · 07b-quick-npc. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* Quick & Simple NPCs V2 (the GM's rule document), as data: trainer classes with their Skilled, Experienced and Ace features,
   the Type Ace passives, the six wild classes and the five Enhanced classes. t: tier, n: name, x: exact text, l: limit, a: what the site applies. */
const QN=[{"k": "athlete", "n": "Athlete", "g": "basic", "u": "All", "alt": "Rangers, any speed-focused trainer, trainers who train their Pokemon's physique.", "f": [{"t": "skilled", "n": "Swift", "x": "Your Pokémon have +10ft movement speed and ignore difficult terrain.", "l": ""}, {"t": "exp", "n": "Zigzag", "x": "Whenever your Pokémon moves at least 20ft during their turn, the next attack targeting them gets -3 accuracy against them.", "l": ""}, {"t": "ace", "n": "Deft Dodge", "x": "When a move misses your Pokémon, the attacker is Dazed and your Pokémon may move 15ft.", "l": ""}]}, {"k": "competitor", "n": "Competitor", "g": "basic", "u": "All", "alt": "Ace Trainers, any power-focused trainer, trainers who purchase rare, powerful Pokemon.", "f": [{"t": "skilled", "n": "Improved Attacks", "x": "Your Pokémon deal +2 damage with all moves.", "l": "", "a": {"dmg": 2}}, {"t": "exp", "n": "Ace", "x": "Your last Pokémon each combat gets +8 max HP and +2 to its highest two stats.", "l": ""}, {"t": "ace", "n": "Even Better", "x": "Your Pokémon deal an additional +6 damage with all moves.", "l": "", "a": {"dmg": 6}}]}, {"k": "caretaker", "n": "Caretaker", "g": "basic", "u": "All", "alt": "Breeders, any defense-focused trainer, trainers who use their favorite Pokemon.", "f": [{"t": "skilled", "n": "Good Breeding", "x": "Your Pokémon have +1 Defense and Special Defense.", "l": "", "a": {"def": 1, "spd": 1}}, {"t": "exp", "n": "Favorite Child", "x": "Your last Pokémon each combat gets +8 max HP and +2 to its highest two stats.", "l": ""}, {"t": "ace", "n": "Top Percentage", "x": "Your Pokémon gain an additional +3 Defense and Special Defense.", "l": "", "a": {"def": 3, "spd": 3}}]}, {"k": "performer", "n": "Performer", "g": "basic", "u": "All", "alt": "Coordinators, any technique-focused trainer, trainers who favor good-looking Pokemon.", "f": [{"t": "skilled", "n": "Show-Off", "x": "Your Pokémon learn Helping Hand and Flash as bonus moves.", "l": "", "a": {"mv": ["Helping Hand", "Flash"]}}, {"t": "exp", "n": "Contest Training", "x": "2/combat, have your Pokémon use an Effect move that targets others as a free action.", "l": "2/combat"}, {"t": "ace", "n": "Beguiling", "x": "2/combat, when your Pokémon hits with a move, one target of the move who was hit is Entranced by your Pokémon.", "l": "2/combat"}]}, {"k": "tactician", "n": "Tactician", "g": "basic", "u": "All", "alt": "Researchers, any strategy-focused trainer, trainers who pick Pokemon based on 'competitive' strategies and metagames.", "f": [{"t": "skilled", "n": "Organize", "x": "At the start of each round, choose one of your allies. This round, they get +4 Speed for the purposes of turn order only.", "l": ""}, {"t": "exp", "n": "Game Plan", "x": "2/combat, you can move each allied Pokémon except your own Pokémon up to 20ft.", "l": "2/combat"}, {"t": "ace", "n": "Leadership", "x": "Organize now affects two of your allies each round, and raises their effective Speed by +8 instead.", "l": ""}]}, {"k": "rogue", "n": "Rogue", "g": "grunt", "u": "Common Pokemon focused on offense, or that are Poison- or Flying-type.", "alt": "", "f": [{"t": "skilled", "n": "Sneak Attack", "x": "2/combat, after your Pokémon deals damage with a move, give Defense▼ or SpDefense▼ to one target hit by that move. If they are adjacent to one of your allies, also deal +4 damage.", "l": "2/combat"}, {"t": "exp", "n": "Slippery", "x": "Your Pokémon have Slippery (After you hit with a Melee move, move up to 10ft.)", "l": "", "a": {"ps": [{"n": "Slippery", "x": "After you hit with a Melee move, move up to 10ft."}]}}, {"t": "ace", "n": "Robbery", "x": "When your Pokémon uses Sneak Attack, if the target has no allies within 10ft of them, deal an extra +2d8 damage and steal the target's held item.", "l": ""}]}, {"k": "thug", "n": "Thug", "g": "grunt", "u": "Common Pokemon focused on bulk, or that are Normal- or Fighting-type.", "alt": "", "f": [{"t": "skilled", "n": "Crusher", "x": "2/combat, after your Pokémon deals damage with a move, give Attack▼ or SpAttack▼ to one target hit by that move and push them 10ft.", "l": "2/combat"}, {"t": "exp", "n": "Bully", "x": "Your Pokémon have Bully (Enemies deal -4 damage to you unless one of their allies is adjacent to you.)", "l": "", "a": {"ps": [{"n": "Bully", "x": "Enemies deal -4 damage to you unless one of their allies is adjacent to you."}]}}, {"t": "ace", "n": "Thick Skull", "x": "2/combat, when your Pokémon is hit by a move, they take half damage from that move, but are Dazed.", "l": "2/combat"}]}, {"k": "trickster", "n": "Trickster", "g": "grunt", "u": "Common Pokemon focused on speed, or that are Dark- or Ground-type.", "alt": "", "f": [{"t": "skilled", "n": "Befuddle", "x": "2/combat, after your Pokémon deals damage with a move, give Speed▼ to one target hit by that move and pull them up to 10ft in any direction.", "l": "2/combat"}, {"t": "exp", "n": "Body Shield", "x": "Your Pokémon have Body Shield (Enemies have -3 accuracy against you if there is an adjacent character other than them without this passive.)", "l": "", "a": {"ps": [{"n": "Body Shield", "x": "Enemies have -3 accuracy against you if there is an adjacent character other than them without this passive."}]}}, {"t": "ace", "n": "Mastermind", "x": "1/combat, when one of your Pokémon is missed by an attack, force the attacker to reroll the Accuracy check, targeting a target of your choice in range of them.\nNote:\nGrunts are meant to be mixed and matched within an encounter, rather than using all of one Trainer class or another. Rogues can prey on foes that attempt to open up Thugs to attacks; Thugs provide cover for Tricksters; and Tricksters reposition enemies to be vulnerable to Thieves. Additionally, many specialists can be easily reflavored as a unique criminal. A good encounter has a mixture of different foe types working together, so feel free to experiment!", "l": "1/combat"}]}, {"k": "typeace", "n": "Type Ace", "g": "type", "u": "Pokémon of the specialist's type", "alt": "", "f": [{"t": "skilled", "n": "Elemental Grit", "x": "2/combat, if your [Type]-type Pokémon is hit by a super-effective or extremely-effective attack, the attack is treated as a resisted successful attack.", "l": "2/combat"}, {"t": "exp", "n": "Specialist Training", "x": "Your Pokémon each gain an ability passive depending on your preferred type (see next page).", "l": ""}, {"t": "ace", "n": "Overflowing Power", "x": "2/combat, as your Pokémon uses a [Type]-type move, it deals +12 damage to one target, and if the attack would be treated as resisted, shielded, or immune, it is normally effective instead.\n+------------------------------------------------------------------------+\n|", "l": "2/combat"}]}, {"k": "artist", "n": "Artist", "g": "spec", "u": "Smeargle, Normal-types", "alt": "TM Scientists, move tutors, disguise artists/spies.", "f": [{"t": "skilled", "n": "Libero", "x": "2/combat, when your Pokémon uses a move or is hit by a move, give them a Type Coat matching the move after the move resolves.", "l": "2/combat"}, {"t": "exp", "n": "Sketch", "x": "Your Smeargle can use Sketch as a free action. Your non-Smeargle Pokémon know Mimic as a bonus move.", "l": "", "a": {"mv": ["Mimic"]}}, {"t": "ace", "n": "Paint", "x": "2/combat, change your Pokémon's next move this turn to any type you choose.", "l": "2/combat"}], "also": "Watcher"}, {"k": "backpacker", "n": "Backpacker", "g": "spec", "u": "Grass-types, Ground-types", "alt": "Sumo wrestlers, tough trainers, Defense aces.", "f": [{"t": "skilled", "n": "Endurance", "x": "Your Pokémon get Endurance (After you take damage from an enemy's move, for the remainder of the round you take -8 damage from all moves.)", "l": "", "a": {"ps": [{"n": "Endurance", "x": "After you take damage from an enemy's move, for the remainder of the round you take -8 damage from all moves."}]}}, {"t": "exp", "n": "Breather", "x": "2/combat, your Pokémon may take an action to rest, healing 10 HP. Until their next turn, they take -8 damage from all attacks, and their next move deals +8 damage on hit.", "l": "2/combat"}, {"t": "ace", "n": "Endless Energy", "x": "2/combat, when your Pokémon would receive an Affliction or ▼, they ignore it.", "l": "2/combat"}], "also": "Survivalist"}, {"k": "biker", "n": "Biker", "g": "spec", "u": "Poison-types, Fire-types, Dark-types", "alt": "Stage magicians, gadgeteers, Strategists.", "f": [{"t": "skilled", "n": "Rough Riding", "x": "Your Pokémon ignore dangerous terrain and all Hazards while moving during their turn (but not as they end their turn). They learn Spikes and Smokescreen as bonus moves.", "l": "", "a": {"mv": ["Spikes", "Smokescreen"]}}, {"t": "exp", "n": "Ripcord", "x": "2/combat, have your Pokémon use a Hazard move as a free action during their turn.", "l": "2/combat"}, {"t": "ace", "n": "Hit & Run", "x": "1/combat, when your Pokémon hits with a Melee move, add \"On hit: The target is pushed 10ft and you move 20ft\" to the move.", "l": "1/combat"}], "also": "Dirty Fighter"}, {"k": "camper", "n": "Camper", "g": "spec", "u": "Forest, Grasslands", "alt": "Scavenger / hobos, scouts, forest rangers, vigilant trainers, Sp.Defense aces.", "f": [{"t": "skilled", "n": "Weather Alert", "x": "Your Pokémon and allied Pokémon within 15ft of them do not take damage from weather, and take -4 damage from area-of-effect moves.", "l": ""}, {"t": "exp", "n": "Scavenge", "x": "2/combat, your Pokémon produces a Snack held item. As their action, they can eat it or feed it to an adjacent Pokémon. When eaten, it heals 15 HP and one affliction.", "l": "2/combat"}, {"t": "ace", "n": "Wide Guard", "x": "If your Pokémon does not move during their turn, then until their next turn, the range of Weather Alert increases to 30ft, and it applies a -8 penalty instead of -4 until then.", "l": ""}]}, {"k": "gymtrainer", "n": "Gym Trainer", "g": "spec", "u": "Types matching the Gym.", "alt": "", "f": [{"t": "skilled", "n": "Lesson 1: Type Advantage", "x": "Choose a type. Your Pokémon of that type take -4 damage from resisted and shielded hits, and your Pokémon deal +4 damage with super-effective and extremely-effective hits of that type.", "l": ""}, {"t": "exp", "n": "Lesson 2: Stat Adjustments", "x": "Your Pokémon gets +2 accuracy with all moves unless they have two or more total Stat ▼.", "l": ""}, {"t": "ace", "n": "Lesson 3: Field Effects", "x": "Choose a Weather, Zone, or Terrain. Your Pokémon deal +4 damage while inside that Weather, Zone, or Terrain, and do not take damage from it.", "l": ""}]}, {"k": "idol", "n": "Idol", "g": "spec", "u": "Urban", "alt": "Team Leaders and Bosses.", "f": [{"t": "skilled", "n": "Idolized", "x": "Your Pokémon each know Helping Hand as a bonus move. When they use Helping Hand, it targets two allies in range.", "l": "", "a": {"mv": ["Helping Hand"]}}, {"t": "exp", "n": "Star of the Show", "x": "2/combat, as your Pokémon starts their turn, they deal -8 damage with all moves until the start of their next turn, but until then, other allied Pokémon within 30ft take -4 damage when hit by moves.", "l": "2/combat"}, {"t": "ace", "n": "Fandom", "x": "2/combat, copy a Stance, Coat, or Stat ▲ from your Pokémon to all their allies within 30ft of them (Only copy one ▲ from Stat ▲).", "l": "2/combat"}], "also": "Rising Star"}, {"k": "ladygentleman", "n": "Lady/Gentleman", "g": "spec", "u": "Pokemon based on \"IRL House Pets\" (Cats, Dogs, Birds, Fish)", "alt": "Maids, teachers, musicians.", "f": [{"t": "skilled", "n": "Good Manners", "x": "Choose a rule and a non-HP stat. Your Pokémon cannot violate it. Whenever a Pokémon within 40ft of your Pokémon violates your Rule, that Pokémon is Dazed, gets Stat▼ in that stat, and cannot recover from Dazed this turn.\nExample rules:\n- Stop Roughhousing: No super-effective moves.\n- No Running In The Halls: Cannot move more than 20ft on your turn.\n- Dueling Code: When using a move that targets, must target a foe who has targeted you since your previous turn, if any have.\n- Robert's Rules: Cannot take Priority turns.", "l": ""}, {"t": "exp", "n": "Take Out The Trash", "x": "When an enemy Pokémon violates your Rule, your Pokémon deal +4 damage to it during their next turn.", "l": ""}, {"t": "ace", "n": "Supreme Court", "x": "1/combat, add a new Rule related to the actions a Pokémon may or may not choose to take on their turn. It lasts for the remainder of combat.", "l": "1/combat"}]}, {"k": "medic", "n": "Medic", "g": "spec", "u": "Healers", "alt": "Martial artists (pressure points), bodyguards.", "f": [{"t": "skilled", "n": "Healer", "x": "Your Pokémon have Healer (After acting, you may roll 1d20. On 16 or higher, any adjacent allies are cured of all afflictions.)", "l": "", "a": {"ps": [{"n": "Healer", "x": "After acting, you may roll 1d20. On 16 or higher, any adjacent allies are cured of all afflictions."}]}}, {"t": "exp", "n": "Bedside Manner", "x": "2/combat, when your Pokémon directly targets an ally with a move, that ally heals 15 HP.", "l": "2/combat"}, {"t": "ace", "n": "Aura of Mercy", "x": "Allies within 30ft of your Pokémon get +4 to Affliction checks.", "l": ""}], "also": "Medic"}, {"k": "musician", "n": "Musician", "g": "spec", "u": "Pokemon with sound based attacks, Poison-types, Electric-types", "alt": "Demagogues, news reporters", "f": [{"t": "skilled", "n": "Rock Out", "x": "If your Pokémon hasn't moved during their turn, their sound-based attacks gain \"On hit, on 16+ on AC, target is Dazed if they are an enemy.\"", "l": ""}, {"t": "exp", "n": "Soloist", "x": "2/combat, as your Pokémon starts their turn while not Dazed, they begin a solo. While it lasts, their sound-based moves get +4 accuracy, +10ft radius, and +20ft range. Their solo ends if they move (including forced movement), at which point they are Dazed.", "l": "2/combat"}, {"t": "ace", "n": "Final Act", "x": "1/day, your Pokémon may use Perish Song as their action as a bonus move. They are not affected by the Perish Song.", "l": "1/day"}]}, {"k": "ninja", "n": "Ninja", "g": "spec", "u": "Urban, Poison-types, Bug-types", "alt": "Spies, illusionists", "f": [{"t": "skilled", "n": "Camouflage", "x": "After acting, your Pokémon may gain a Type Coat matching its current terrain or weather. If they are in a grassy field, Grass type; if they are in water, Water type; if they are on Sand, Ground type; etc.", "l": ""}, {"t": "exp", "n": "Shell Game", "x": "2/combat, as a free action, your Pokémon creates a DT Hazard with 1 HP within 5ft of them, and gains \"Stance: At the start and end of your turn, you may move each DT Hazard up to 10ft or swap places with one of them within 20ft.\"", "l": "2/combat"}, {"t": "ace", "n": "Move Silently", "x": "Your Pokémon have Move Silently(You cannot be directly targeted by moves and ignore all enemy hazards. This effect is deactivated while an enemy is adjacent to you.)", "l": "", "a": {"ps": [{"n": "Move Silently", "x": "You cannot be directly targeted by moves and ignore all enemy hazards. This effect is deactivated while an enemy is adjacent to you."}]}}]}, {"k": "officer", "n": "Officer", "g": "spec", "u": "Canines, Urban, Horses.", "alt": "Ranger in an urban area. Poachers, trackers, trappers.", "f": [{"t": "skilled", "n": "Police Dog", "x": "Your Pokémon may know Odor Sleuth as a bonus move. When they use Odor Sleuth, they choose a Pokémon within 30ft; the next attack against them gets advantage.", "l": "", "a": {"mv": ["Odor Sleuth"]}}, {"t": "exp", "n": "Pursue", "x": "2/combat, when your Pokémon hits with a Melee attack, the target is Bound to them for 1d4 rounds.", "l": "2/combat"}, {"t": "ace", "n": "The Law", "x": "Your Pokémon cannot get Dazed, Drowsy, or Infatuated from enemies. When an enemy breaks adjacency with them, that enemy takes 2d6 damage.", "l": ""}], "also": "Officer"}, {"k": "pokemaniac", "n": "Pokemaniac", "g": "spec", "u": "Monster egg group", "alt": "Mad scientists. Attack Aces.", "f": [{"t": "skilled", "n": "Rage", "x": "At the end of every single turn, if your Pokémon was hit and damaged by a move, they deal 1d8 damage to a random adjacent character (even one of their allies).", "l": ""}, {"t": "exp", "n": "Rampage", "x": "2/combat, when your Pokémon moves, their movement must be in a straight line, but they ignore and destroy Hazards they move through, and can move through enemies, dealing 1d6 damage to each enemy they move through this way.", "l": "2/combat"}, {"t": "ace", "n": "Nuclear Charge", "x": "2/combat, your Pokémon may use Hyper Beam or Giga Impact as a bonus move.", "l": "2/combat"}]}, {"k": "rancher", "n": "Rancher", "g": "spec", "u": "Tauros, Miltank, Mareep, Common", "alt": "Bodybuilder, chef, monster Pokemon enthusiast.", "f": [{"t": "skilled", "n": "Heavyweight Champion", "x": "Your Pokémon's Melee moves get \"On hit, on 16+ on AC, push the target 10ft unless they are heavier than you. \" Whenever your Pokémon causes a foe to collide, that foe gets Defense ▼.", "l": ""}, {"t": "exp", "n": "Large and in Charge", "x": "Your Pokémon cannot be knocked back, Bound, or Latched On by smaller foes. You may have them increase one size and weight category.", "l": ""}, {"t": "ace", "n": "Unstoppabull", "x": "2/combat, when your Pokémon takes a critical hit and/or affliction, they may ignore that affliction and/or convert the critical hit into a normal hit, then become Dazed.", "l": "2/combat"}]}, {"k": "ranger", "n": "Ranger", "g": "spec", "u": "Any native to the environment.", "alt": "Druid, hypnotists, hermit of the woods, tag battlers, any trainer with backup.", "f": [{"t": "skilled", "n": "Styler Call", "x": "1/combat, a wild Pokémon with max HP of 36 or less comes to aid you. It attacks your foes, attempting to use a random move each turn against the nearest foe.", "l": "1/combat"}, {"t": "exp", "n": "Distracting Styler", "x": "After you see which random move was selected, you may either replace it with a different known move of your choice; or to choose how the Pokémon moves and chooses targets this turn.", "l": ""}, {"t": "ace", "n": "Hyper Styler", "x": "Styler Aid can now call Pokémon with up to 48 max HP. It can be used twice per combat, but only if the first Pokémon has been defeated.", "l": ""}]}, {"k": "reportercameraman", "n": "Reporter/Cameraman", "g": "spec", "u": "Flying-types, Electric-types", "alt": "Detectives, con artists, Sp. Attack aces.", "f": [{"t": "skilled", "n": "Headshot", "x": "On their first turn, your Pokémon may use the move Flash once as a free action, without knowing the move.", "l": ""}, {"t": "exp", "n": "Interview", "x": "2/combat, interview a Trainer you can see. They must name one of their Pokémon's moves. If they command their Pokémon to use that move during their next turn, it gets -4 accuracy, if they don't, their Pokémon is Dazed afterwards and doesn't recover from Dazed that turn.", "l": "2/combat"}, {"t": "ace", "n": "Breaking News", "x": "1/combat, at the start of any round after the first one, you may declare that it's an important moment. During this round, all Pokémon deal +8 damage on hit with damaging moves.", "l": "1/combat"}]}, {"k": "rider", "n": "Rider", "g": "spec", "u": "Large rideable pokemon", "alt": "Emergency workers, racers.", "f": [{"t": "skilled", "n": "Ride On", "x": "Your Pokémon can carry an allied Pokémon of equal or smaller size, and move them around. While they do, they share the higher Speed when determining initiative, movement and defense from Effect moves.", "l": ""}, {"t": "exp", "n": "Barding", "x": "The mounted Pokémon and mount may use the higher Defense stat and Special Defense stat between the two of them.", "l": ""}, {"t": "ace", "n": "As One", "x": "When the rider is attacked, the mount can intercept the damage, or split it evenly with the rider.", "l": ""}], "also": "Rider"}, {"k": "rival", "n": "Rival", "g": "spec", "u": "All.", "alt": "", "f": [{"t": "skilled", "n": "Outmatched", "x": "You have a grudge against one Trainer, your Nemesis. Your Pokémon have +2 accuracy against your Nemesis's Pokémon.", "l": ""}, {"t": "exp", "n": "Talk Trash", "x": "2/combat, as an action, distract your Nemesis. Until they pass a DC 16 flat check at the end of their turn, they can't use their features that take an Action or Reaction.", "l": "2/combat"}, {"t": "ace", "n": "Outmaneuvered", "x": "When your Pokémon hits one of your Nemesis's Pokémon, they remove one level of the target's Stat▲. If the target has none, then instead, on a 12+ on AC, the target is Dazed.", "l": ""}]}, {"k": "sailor", "n": "Sailor", "g": "spec", "u": "Ratatta, Machop, Water-types, Freshwater, Ocean, Fish pokemon", "alt": "Meteorologists, airplane pilots.", "f": [{"t": "skilled", "n": "Read The Wind", "x": "At the start of combat, pick a cardinal direction (shared by all Sailors in the combat) to be 'downwind'. Each round after the first, rotate 'downwind' 90 degrees clockwise at the start of each round.\nEnemy Pokémon take a -2 accuracy penalty against your Pokémon if the attacker is further 'downwind' than your Pokémon.", "l": ""}, {"t": "exp", "n": "Salty Dog", "x": "Your Pokémon resist Electric-type and Water-type damage, instead of its normal type effectiveness.", "l": ""}, {"t": "ace", "n": "Perfect Storm", "x": "2/combat, at the start of a round, summon a powerful gale. At the end of the round, push all Medium Pokémon 20ft 'downwind'. Light and Featherweight Pokémon are pushed 40ft. Any Pokémon except yours that are pushed and collide take 2d8 damage.", "l": "2/combat"}]}, {"k": "scientistsupernerd", "n": "Scientist/Super Nerd", "g": "spec", "u": "Poison-types, Electric-types", "alt": "Rich trainers with plenty of potions, religious figures wielding healing charms.", "f": [{"t": "skilled", "n": "Potioneer", "x": "At the start of each combat, create 4 Super Potions/Hyper Potions/Max Potions, depending on your Rank. They spoil at the end of combat.", "l": ""}, {"t": "exp", "n": "Quick Hands", "x": "When you recall a Pokémon to their Pokeball, you may also use a medicine item on them as a free action.", "l": ""}, {"t": "ace", "n": "Power Pill", "x": "2/combat, as an action, use a Medicine item at a range of up to 60ft. The Pokémon who heals from it also gets ▲ in two stats of your choice.", "l": "2/combat"}], "also": "Scientist"}, {"k": "skater", "n": "Skater", "g": "spec", "u": "Flying-types, Electric-types, Urban", "alt": "Dancers, athletes, hit & run pickpockets, Speed aces.", "f": [{"t": "skilled", "n": "Accelerate", "x": "When your Pokémon move at least 20ft in a straight line on their turn, once per turn, they get Speed ▲ (to max ▲▲▲), but once per turn, when they receive forced movement or voluntarily enter dangerous or difficult terrain, they immediately lose one Speed ▲.", "l": ""}, {"t": "exp", "n": "Max Speed", "x": "If your Pokémon has at least Speed ▲▲, they deal +8 damage with moves and can move 10ft after each time they attack. If it was a Melee move, they can move 30ft instead.", "l": ""}, {"t": "ace", "n": "Redline", "x": "2/combat, when your Pokémon attacks with at least Speed ▲▲, you can cause the attack to become a critical hit if it hits.", "l": "2/combat"}], "also": "Choreographer"}];
const QN_TP={"Bug": {"cls": "Bugcatcher", "ps": [{"n": "Avenger", "x": "Whenever an ally is knocked out, your next damaging attack deals +4 damage. This effect can stack."}], "raw": "Avenger (Whenever an ally is knocked out, your next damaging attack deals +4 damage. This effect can stack.)"}, "Dark": {"cls": "Roughneck / Thug / Delinquent", "ps": [{"n": "Aftermath", "x": "When knocked out by a melee attack, the attacker loses 1d20 HP."}], "raw": "Aftermath (When knocked out by a melee attack, the attacker loses 1d20 HP.)"}, "Dragon": {"cls": "Dragon Tamer", "ps": [{"n": "Competitive", "x": "If a foe gives you any ▼, you get SpAttack▲▲."}, {"n": "Defiant", "x": "If a foe gives you any ▼, you get Attack▲▲."}], "raw": "Competitive (If a foe gives you any ▼, you get SpAttack▲▲.), and/or Defiant (If a foe gives you any ▼, you get Attack▲▲.)"}, "Electric": {"cls": "Engineer", "ps": [{"n": "Battery", "x": "Allies within 15ft of you deal +4 damage with Special moves."}], "raw": "Battery (Allies within 15ft of you deal +4 damage with Special moves.)"}, "Fairy": {"cls": "Furisode Girl / Fairy Tale Girl", "ps": [{"n": "Cute Charm", "x": "Whenever you are hit with a melee attack, roll 1d4. On 4, Infatuate the attacker."}], "raw": "Cute Charm (Whenever you are hit with a melee attack, roll 1d4. On 4, Infatuate the attacker.)"}, "Fighting": {"cls": "Martial Artist / Black Belt", "ps": [{"n": "Scrappy", "x": "Your Normal-type and Fighting-type attacks can hit Ghost-type targets."}], "raw": "Scrappy (Your Normal-type and Fighting-type attacks can hit Ghost-type targets.)"}, "Fire": {"cls": "Firebreather", "ps": [{"n": "Blaze", "x": "Your Fire-type moves deal +4 damage while below 20 HP."}], "raw": "Blaze (Your Fire-type moves deal +4 damage while below 20 HP.)"}, "Flying": {"cls": "Bird Keeper / Pilot", "ps": [{"n": "Gale Wings", "x": "If you use a Flying-type Move during your turn, you get Speed▲"}], "raw": "Gale Wings (If you use a Flying-type Move during your turn, you get Speed▲)"}, "Ghost": {"cls": "Hex Maniac / Medium", "ps": [{"n": "Unnerve", "x": "Foes within 25ft of you cannot consume food."}], "raw": "Unnerve (Foes within 25ft of you cannot consume food.)"}, "Grass": {"cls": "Botanist / Aroma Lady / Gardener", "ps": [{"n": "Regrowth", "x": "At the start of your turn while below 20 HP, heal 1d8 HP if you are conscious"}], "raw": "Regrowth (At the start of your turn while below 20 HP, heal 1d8 HP if you are conscious)"}, "Ground": {"cls": "Ruin Maniac / Archeologist", "ps": [{"n": "Keen Eye", "x": "Your attack rolls can't be negatively affected by foes"}], "raw": "Keen Eye (Your attack rolls can't be negatively affected by foes)."}, "Ice": {"cls": "Skier / Boarder", "ps": [{"n": "Dynamic Entry", "x": "You have +3 to your first accuracy check each combat."}], "raw": "Dynamic Entry (You have +3 to your first accuracy check each combat.)"}, "Normal": {"cls": "Office Worker", "ps": [{"n": "Scrappy", "x": "Your Normal-type and Fighting-type attacks can hit Ghost-type targets."}], "raw": "Scrappy (Your Normal-type and Fighting-type attacks can hit Ghost-type targets.)"}, "Poison": {"cls": "Punk / Janitor / Chemist", "ps": [{"n": "Toxic Focus", "x": "You deal +4 damage on hit against foes who are Poisoned or Toxified."}], "raw": "Toxic Focus(You deal +4 damage on hit against foes who are Poisoned or Toxified.)"}, "Psychic": {"cls": "Psychic / Magician", "ps": [{"n": "Unnerve", "x": "Foes within 25ft of you cannot consume food."}], "raw": "Unnerve (Foes within 25ft of you cannot consume food.)"}, "Rock": {"cls": "Hiker", "ps": [{"n": "Solid Rock", "x": "Super-effective attacks against you deal –4 damage."}], "raw": "Solid Rock (Super-effective attacks against you deal –4 damage.)"}, "Steel": {"cls": "Knight", "ps": [{"n": "Friend Guard", "x": "Adjacent allies without this passive take -4 damage when hit"}], "raw": "Friend Guard (Adjacent allies without this passive take -4 damage when hit)"}, "Water": {"cls": "Swimmer / Diver / Surfer / Fisher", "ps": [{"n": "Splash Zone", "x": "As a free action, spend a use of Tidepools and use Tidepools"}], "raw": "Splash Zone (As a free action, spend a use of Tidepools and use Tidepools); also know Tidepools as a bonus move.", "mv": ["Tidepools"]}};
const QN_WC=[{"k": "bruiser", "n": "Bruiser", "cap": "Thick Hide (+1 Defense) or Vigilant (+1 SpDefense)", "f": [{"t": "skilled", "n": "Durable", "x": "2/combat, when you hit with a damaging move, give Attack▼ and SpAttack▼ to one target hit by that move. Additionally, you have Durable (You take -4 damage from Melee moves.).", "l": "2/combat"}]}, {"k": "hunter", "n": "Hunter", "cap": "Power Up (+1 Attack) or Focused (+1 SpAttack).", "f": [{"t": "skilled", "n": "Hunter's Eye", "x": "2/combat, when you hit with a Melee move, one target is Latched until their next turn. If they voluntarily end adjacency while Latched, they take 2d8 damage. Additionally, you have Hunter's Eye (Deal +4 damage to Latched or Bound foes, or those with afflictions.)", "l": "2/combat"}]}, {"k": "leader", "n": "Leader", "cap": "Thick Hide (+1 Defense) or Vigilant (+1 SpDefense)", "f": [{"t": "skilled", "n": "Leader", "x": "2/combat, when you hit with a move, another allied Pokémon may move up to 20ft, then use an At-Will move. They add no damage bonuses to this move if it hits- only roll the damage dice. Additionally, you have Leader (Allies within 10ft without this passive get +2 accuracy.)", "l": "2/combat"}]}, {"k": "lurker", "n": "Lurker", "cap": "Power Up (+1 Attack) or Focused (+1 SpAttack).", "f": [{"t": "skilled", "n": "Duelist", "x": "2/combat, when you hit with a damaging move, give Defense▼ and SpDefense▼ to one target hit by that move. Additionally, you have Duelist (Deal +4 damage to enemies that have none of their allies adjacent.)", "l": "2/combat"}]}, {"k": "skirmisher", "n": "Skirmisher", "cap": "Nimble (+1 Speed)", "f": [{"t": "skilled", "n": "Evasive", "x": "2/combat, after you hit with a move, you may move 30ft. You must end their movement adjacent to an allied Pokémon if there are any in the combat. Additionally, you have Evasive (You take -4 damage from Ranged moves.).", "l": "2/combat"}]}, {"k": "trickster", "n": "Trickster", "cap": "Nimble (+1 Speed)", "f": [{"t": "skilled", "n": "Trickster", "x": "2/combat, when you hit with a damaging move,the target drops their held item if they have one, or give them Speed▼ otherwise. Additionally, you have Trickster (Your moves that can inflict status effects have +2 accuracy and -4 damage).", "l": "2/combat"}]}];
const QN_EN=[{"k": "titan", "n": "Titan", "cap": "Giant (You are one size and weight category greater than usual. You have +8 max HP.)", "f": [{"t": "exp", "n": "Enormous", "x": "This Pokémon is, at minimum, Huge and Superweight, and has Reach(15ft). When they use a Melee or Ranged move, they can make its range Melee(15ft burst) or Ranged(50ft, 10ft blast), as appropriate.", "l": ""}, {"t": "ace", "n": "Juggernaut", "x": "Always passes Affliction checks, and if they have three or more Stat▼ or Afflictions, they may make two Affliction checks in one turn. If they have no Stat▼ or Afflictions, they heal 20 HP instead of making an Affliction check.", "l": ""}]}, {"k": "alpha", "n": "Alpha", "cap": "Ferocity (Deal +4 damage with moves while below 20 HP.)", "f": [{"t": "exp", "n": "Champion of The Wild", "x": "This Pokémon takes two turns each round; one is a Priority turn, during which all their moves have Priority, and one is an ordinary turn.", "l": ""}, {"t": "ace", "n": "Apex Of Battle", "x": "2/combat, this Pokémon may charge a tremendous strike as their first action in a round. Their next turn is last, after all other characters have gone, but their move that turn gets advantage, bypasses Reactions, and reduces one target it hits to 0 HP, but has a recharge turn.", "l": "2/combat"}]}, {"k": "totem", "n": "Totem", "cap": "Blessed (Pokémon from your species line will listen to you and perform small tasks as you ask.)", "f": [{"t": "exp", "n": "Trial of the Tapu", "x": "2/combat, if this Pokémon has no Swarm aiding it, they can call a three-member Swarm of allies as an action. Each Swarm member arrives with ▲ in their highest stat.", "l": "2/combat"}, {"t": "ace", "n": "The True Trial", "x": "When this Pokémon is reduced below half HP for the first time in a combat, they gain ▲▲ in each stat.", "l": ""}]}, {"k": "ultrabeast", "n": "Ultra Beast", "cap": "Beast Boost (When you defeat another Pokémon, gain Stat▲ in your highest stat.)", "f": [{"t": "exp", "n": "From Alien Stars", "x": "This Pokémon's type weaknesses and resistances are not set by its typing. Instead, it has five type resistances and two type weaknesses, randomly distributed. Pokedexes and similar features do not work on it. Additionally, one of its moves is wholly unique to it- either a type-shifted version of an existing move, or a completely unique move. It gains +4 accuracy when using this move.", "l": ""}, {"t": "ace", "n": "Beast Boost", "x": "When this Pokémon defeats another Pokémon with a move, they gain Stat▲ in a stat of their choice (to max. ▲▲), and heal 15 HP.", "l": ""}]}, {"k": "paradox", "n": "Paradox", "cap": "Photosynthesis / Quark Drive (You are designed or evolved for a particular Zone, Terrain, or Weather. When you start your turn there, gain Stat▲ in your highest stat.)", "f": [{"t": "exp", "n": "Proto Drive", "x": "This Pokémon is designed or evolved for a particular Zone, Terrain, or Weather. When they start their turn in that field effect, they gain ▲▲ to their highest stat. Additionally, 2/combat, as a free action during their turn, they create that field effect.", "l": ""}, {"t": "ace", "n": "Evolutionary / Design Niche", "x": "Double all bonuses provided by your Skilled passive, and choose two additional ability passives (except unique ability passives) as bonus passives. Your Skilled feature may be used 4/combat, and its numerical effects are doubled (inflict ▼▼ instead of ▼, affect two targets instead of 1, etc.)", "l": ""}]}];

/* ---------- Quick NPCs (Update 52) ----------
   An NPC trainer's sheet can be Full (level, class, stats) or Quick (rank, quick class, templates and features from the document).
   Its data lives in the NPC's GM-only document under q: {on, r: '1'|'2'|'2s'|'3'|'4', cls, ty, vc, vt, boss, sq, ch, u: {b, k}}.
   ch: the choices some features ask for (a Rule, a Nemesis, a type to teach), as the GM's own words (Update 54).
   When a Quick NPC's Pokémon enter a battle, the plain numbers are applied to them (damage, Defense and Special Defense, bonus moves
   and passives), their natures are neutral, and their 3/day moves become 2 per combat. Everything else shows as text for the GM.
   A foe can also be given a wild rank (q r below) and wild Pokémon can be added as a Swarm. None of it is shown to players. */
const QN_RANKS=[['1','Novice',1],['2','Skilled',2],['2s','Specialist',2],['3','Experienced',3],['4','Ace',4]];
const QN_RANK_TXT={
  '1':'Amateurs: one or two Pokémon, none evolved. May carry healing items but do not use them in battle. Most trainers without badges, civilians and many grunts.',
  '2':'Has a battling style. Mostly first-stage Pokémon and a few evolved; may hold common berries for important battles. Most trainers with a badge or six months of battling.',
  '2s':'Specialised early: has the Experienced feature of their class but not the Skilled one. Not every class works well this way.',
  '3':'Several badges; most Pokémon evolved at least once. Some tutored moves, maybe a reusable held item. Uses Super Potions and status cures where allowed.',
  '4':'A strong team is their life: Team Admins, experienced Gym Leaders, professionals. Pokémon fully evolved with held items and several tutored moves; carries Full Restores and Hyper Potions.'};
const QN_TIER={skilled:'Skilled',exp:'Experienced',ace:'Ace'};
const QN_WRANKS=[['','None'],['skilled','Skilled'],['exp','Experienced'],['ace','Ace']];
const qnCls=k=>QN.find(c=>c.k===k)||null;
const qnOf=nt=>nt&&nt.q&&nt.q.on?nt.q:null;
const qnRankName=r=>(QN_RANKS.find(x=>x[0]===r)||[0,''])[1];
const qnRankNum=r=>(QN_RANKS.find(x=>x[0]===r)||[0,'',0])[2];
const qnTiers=r=>r==='2'?['skilled']:r==='2s'?['exp']:r==='3'?['skilled','exp']:r==='4'?['skilled','exp','ace']:[];
const qnLimN=l=>{const m=/^(\d)\//.exec(l||'');return m?+m[1]:0;};
function qnF(c,f,q,src){
  let x=f.x,a=f.a?JSON.parse(JSON.stringify(f.a)):null;
  if(c.k==='typeace'){
    const tp=QN_TP[q.ty];
    if(f.t==='exp'){x=tp?'Your Pokémon each gain '+tp.raw:'Your Pokémon each gain an ability passive for your type. Choose the type above.';a=tp?{ps:tp.ps.filter(p=>p.x),mv:tp.mv||[]}:null;}
    x=x.replace(/\[Type\]/g,q.ty||'[Type]');
  }
  return {key:c.k+'.'+f.t,cls:c.k,cn:c.n,t:f.t,n:f.n,x,l:f.l,a,src,boss:false};
}
/* the features an NPC has, cumulative by rank, plus a Veteran's extra feature; a Champion's chosen feature is marked */
function qnFeats(q){
  const out=[];
  if(!q)return out;
  const c=qnCls(q.cls);
  if(c)qnTiers(q.r).forEach(t=>{const f=c.f.find(z=>z.t===t);if(f)out.push(qnF(c,f,q,'class'));});
  if(q.vc&&(q.r==='3'||q.r==='4')){
    const vc=qnCls(q.vc),vt=q.vt==='exp'?'exp':'skilled';
    const f=vc&&vc.f.find(z=>z.t===vt);
    if(f&&!out.some(o=>o.key===vc.k+'.'+vt))out.push(qnF(vc,f,q,'veteran'));
  }
  if(q.r==='4'&&q.boss){const o=out.find(z=>z.key===q.boss);if(o)o.boss=true;}
  return out;
}
/* the plain numbers applied to the NPC's Pokémon in a battle; a Champion's chosen feature counts twice */
function qnApplied(q){
  const r={dmg:0,def:0,spd:0,mv:[],ps:[]};
  qnFeats(q).forEach(f=>{
    if(!f.a)return;
    const k=f.boss?2:1;
    r.dmg+=num(f.a.dmg)*k;r.def+=num(f.a.def)*k;r.spd+=num(f.a.spd)*k;
    (f.a.mv||[]).forEach(m=>{if(r.mv.indexOf(m)<0)r.mv.push(m);});
    (f.a.ps||[]).forEach(p=>{if(!r.ps.some(z=>z.n===p.n))r.ps.push(p);});
  });
  return r;
}
function qnAppliedTxt(q){
  const a=qnApplied(q),bits=[];
  if(a.dmg)bits.push('+'+a.dmg+' damage with all moves');
  if(a.def||a.spd)bits.push('+'+a.def+' Defense and +'+a.spd+' Special Defense');
  if(a.mv.length)bits.push('bonus moves: '+a.mv.join(', '));
  if(a.ps.length)bits.push('passives: '+a.ps.map(p=>p.n).join(', '));
  bits.push('3/day moves become 2 per combat');
  bits.push('natures are neutral');
  return bits;
}
const qnSquadAct=sq=>Math.ceil(num(sq)/2);
/* ----- use dots. An NPC's dots belong to the current battle, so they start again in the next one. ----- */
function qnUsed(nt,key){
  const u=nt&&nt.q&&nt.q.u;
  return u&&num(u.b)===num(BT().bid)?num((u.k||{})[key]):0;
}
function qnSpend(id,key,j){
  const nt=NTS()[id];
  if(!S.me.admin||!nt)return;
  const u=nt.q&&nt.q.u&&num(nt.q.u.b)===num(BT().bid)?Object.assign({},nt.q.u.k):{};
  const cur=num(u[key]);
  u[key]=j<cur?j:j+1;
  edit('gt',id,'q.u',{b:num(BT().bid),k:u});
  render();
}
function qnPips(n,used,attrs,label){
  return h`<span class="pips" role="group" aria-label="${label}">${Array.from({length:n},(_,j)=>h`<button class="pip ${j<used?'spent':''}" ${raw(attrs)} data-j="${j}" aria-label="Use ${j+1}${j<used?', spent':''}"></button>`)}</span>`;
}
function qnFeatHtml(f,used,attrs){
  const n=qnLimN(f.l);
  return h`<div class="qnf"><div class="row qnf1"><b>${f.n||f.cn}</b><span class="pill">${f.src==='veteran'?'Veteran · '+f.cn+' ':''}${QN_TIER[f.t]||''}</span>${f.boss?h`<span class="pill gm">Champion: numbers doubled</span>`:''}${n?h`${qnPips(n,used,attrs+' data-k="'+esc(f.key)+'"',(f.n||'Feature')+' uses')}<span class="sub">${f.l}</span>`:''}</div>
    <p class="qnx">${f.x}</p></div>`;
}
/* ----- the NPC sheet in Quick mode ----- */
const qnChoices=q=>String((q&&q.ch)||'').trim()?h`<p class="sub qnch"><b>Choices:</b> ${String(q.ch).trim()}</p>`:'';
/* the Quick NPC settings a pack row may carry (Update 54); anything not in the rules is dropped */
function qnFromPack(x){
  if(!x||typeof x!=='object')return null;
  const r=QN_RANKS.some(z=>z[0]===String(x.r))?String(x.r):'';
  const cls=qnCls(x.cls)?x.cls:'';
  if(!r||!cls)return null;
  const q={on:true,r,cls,ty:TYPES.indexOf(x.ty)>=0?x.ty:'',vc:'',vt:'skilled',boss:'',sq:clamp(Math.round(num(x.sq)),0,20),ch:String(x.ch||'').slice(0,600)};
  if((r==='3'||r==='4')&&qnCls(x.vc)){q.vc=x.vc;q.vt=x.vt==='exp'?'exp':'skilled';}
  if(r==='4'&&x.boss&&qnFeats(q).some(f=>f.key===x.boss))q.boss=x.boss;
  return q;
}
const qnPackRank=x=>QN_RANKS.some(z=>z[0]===String(x))?String(x):'';
/* ----- Gym Leaders as Quick NPCs (Update 55) -----
   Each Leader is a Type Ace in their Gym's type, plus a Veteran feature that fits them. Their rank follows the challenger's
   badges, like their teams: Novice at 0-1 badges, Skilled at 2-4, Experienced at 5-6, Ace at 7 or more. A Leader whose tier
   teams are saved under Team growth gets the rank on each saved team, so loading the team for a challenger sets it.
   Without saved teams, the rank comes from the team's size (2, 3, 4, 5+ Pokémon, as on the vault's tier lists). */
const GL_QUICK={
  roark:{ty:'Rock',vc:'backpacker',vt:'skilled',ch:'Endurance from his Backpacker feature: a miner who takes the hit and keeps working.'},
  gardenia:{ty:'Grass',vc:'ranger',vt:'skilled',ch:'Styler Call: an Eterna Forest native answers her (Budew, Cherubi or Combee).'},
  maylene:{ty:'Fighting',vc:'athlete',vt:'skilled',ch:'Swift, from her conditioning work with cadets.'},
  klevin:{ty:'Fairy',vc:'ladygentleman',vt:'skilled',ch:'Good Manners: Robert\'s Rules (cannot take Priority turns), stat Speed. He asks permission and names the rule before the battle.'},
  fantina:{ty:'Ghost',vc:'performer',vt:'exp',ch:'Contest Training: her free Effect moves are her showpieces (Confuse Ray, Will-O-Wisp, Hypnosis).'},
  byron:{ty:'Steel',vc:'gymtrainer',vt:'exp',ch:'Lesson 2: Stat Adjustments, the apprenticeship master\'s lesson.'},
  candice:{ty:'Ice',vc:'skater',vt:'skilled',ch:'Accelerate: her Pokémon pick up speed on straight runs, like a ski run.'},
  marina:{ty:'Flying',vc:'sailor',vt:'skilled',ch:'Read The Wind: she calls the first downwind from the gulls on the roof.'},
  volkner:{ty:'Electric',vc:'gymtrainer',vt:'skilled',ch:'Lesson 1: Type Advantage, type Electric.'},
  'crasher wake':{ty:'Water',vc:'gymtrainer',vt:'skilled',ch:'Lesson 1: Type Advantage, type Water.'}
};
const glKey=nt=>{const n=String((nt&&nt.name)||'').toLowerCase();return Object.keys(GL_QUICK).find(k=>new RegExp('(^|[^a-z])'+k+'($|[^a-z])').test(n))||'';};
const glIs=nt=>!!nt&&(ntCat(nt)==='gym');
const glRank=bd=>{bd=num(bd);return bd>=7?'4':bd>=5?'3':bd>=2?'2':'1';};
const glTeamRank=team=>{const n=(team||[]).length;return n>=5?'4':n===4?'3':n===3?'2':'1';};
/* Leaders who have not been given a rank yet */
const glTodo=()=>ntIds().filter(id=>{const nt=NTS()[id];return glIs(nt)&&!(nt.q&&nt.q.r);});
function glProfile(nt){
  const k=glKey(nt);
  if(k)return Object.assign({},GL_QUICK[k]);
  /* a Leader not on the list: the type most of their Pokémon share, and the Gym Trainer's first lesson in it */
  const cnt={};
  const all=ntTeam(nt).concat(...(Array.isArray(nt.stages)?nt.stages:[]).map(s=>s&&Array.isArray(s.team)?s.team:[]));
  all.forEach(m=>(m.ty||[]).forEach(t=>{if(t)cnt[t]=(cnt[t]||0)+1;}));
  const ty=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'';
  return {ty,vc:'gymtrainer',vt:'skilled',ch:ty?'Lesson 1: Type Advantage, type '+ty+'.':'Lesson 1: Type Advantage. Choose the Gym\'s type.'};
}
function glSetup(){
  if(!S.me.admin)return [];
  const done=[];
  glTodo().forEach(id=>{
    const nt=NTS()[id],p=glProfile(nt);
    const st=Array.isArray(nt.stages)?nt.stages:[];
    const cur=st.find(x=>x.id===nt.grown);
    const r=cur?glRank(cur.bd):glTeamRank(ntTeam(nt));
    edit('gt',id,'q',Object.assign({},nt.q||{},{on:true,r,cls:'typeace',ty:TYPES.indexOf(p.ty)>=0?p.ty:'',vc:p.vc,vt:p.vt,boss:'',sq:0,ch:p.ch}));
    if(st.length)edit('gt',id,'stages',st.map(x=>Object.assign({},x,{qr:glRank(x.bd)})));
    done.push(ntName(nt));
  });
  return done;
}
function qnClassOpts(){return QN.map(c=>[c.k,c.n+(c.g==='grunt'?' (grunt)':c.g==='spec'?' (specialist)':'')]);}
function qnSheet(id,nt,ed){
  const q=nt.q||{};
  const who=ntName(nt);
  const feats=qnFeats(q);
  const c=qnCls(q.cls);
  /* a Gym Leader's rank is a handicap for the challenger's tier; out of battle they are a professional (Update 55) */
  const gl=glIs(nt);
  const rn=gl?4:qnRankNum(q.r);
  const glTxt=gl?h`<p class="sub qnch"><b>Gym Leader:</b> the rank follows the challenger's badges: Novice at 0–1, Skilled at 2–4, Experienced at 5–6, Ace at 7 or more. Saved tier teams under Team growth carry their rank, so load the right team before the battle. Skill checks use +4 at every tier.</p>`:'';
  if(ed)return h`<div class="ntsheet qn">
    <div class="ph"><h3>Quick NPC</h3><span class="sub">From the Quick & Simple NPCs rules. Only you see this.</span></div>
    <div class="fgrid">
      ${fSel('Rank','gt',id,'q.r',nt,QN_RANKS.map(x=>[x[0],x[1]]),{blank:'Choose a rank'})}
      ${fSel('Class','gt',id,'q.cls',nt,qnClassOpts(),{blank:'Choose a class'})}
      ${q.cls==='typeace'?fSel('Type','gt',id,'q.ty',nt,TYPES,{blank:'Choose a type'}):''}
      ${q.r==='3'||q.r==='4'?h`${fSel('Veteran: extra feature from','gt',id,'q.vc',nt,qnClassOpts(),{blank:'Not a Veteran'})}${q.vc?fSel('Veteran feature','gt',id,'q.vt',nt,[['skilled','Skilled'],['exp','Experienced']],{}):''}`:''}
      ${q.r==='4'?fSel('Champion or Boss: doubled feature','gt',id,'q.boss',nt,feats.map(f=>[f.key,(f.n||f.cn)+' ('+QN_TIER[f.t]+')']),{blank:'Not a Champion'}):''}
      ${fNum('Squad: number of trainers (0 if not a squad)','gt',id,'q.sq',nt,{min:0,max:20})}
    </div>
    ${fArea('Choices for their features','gt',id,'q.ch',nt,{rows:2,ph:'A Rule and stat for Good Manners, a Nemesis, the type a Gym Trainer teaches…'})}
    ${glTxt}
    ${q.r&&!gl?h`<p class="sub">${QN_RANK_TXT[q.r]}</p>`:''}
    ${c?h`<p class="sub"><b>${c.n}</b>${c.u?' · Pokémon used: '+c.u:''}${c.alt?' · Also: '+c.alt:''}</p>`:''}
    ${num(q.sq)>0&&num(q.sq)<3?h`<p class="sub">A Squad needs three or more trainers.</p>`:''}
    <p class="sub">Their team below is added as usual. Build it to match the rank.</p>
  </div>`;
  const sq=num(q.sq)>=3?num(q.sq):0;
  return h`<div class="ntsheet qn rd">
    <div class="ph"><h3>${q.r?qnRankName(q.r):'No rank yet'} ${c?c.n:'(no class yet)'}${q.cls==='typeace'&&q.ty?' · '+q.ty:''}</h3><span class="pill gm">GM only</span></div>
    ${sq?h`<p class="sub"><b>Squad of ${sq} trainers.</b> Only ${qnSquadAct(sq)} of them command Pokémon or use features each round. One member uses one limited feature each round; the dots below are the squad's shared pool.</p>`:''}
    ${gl?glTxt:q.r?h`<p class="sub">${QN_RANK_TXT[q.r]}</p>`:h`<p class="sub">Choose a rank and class in Edit details.</p>`}
    <div class="row"><button class="btn sm" data-act="nt_roll" data-label="${who}: skill check" data-bonus="${rn}" data-tal="0">Skill check (d20 + ${rn})</button><button class="btn sm" data-act="nt_roll" data-label="${who}: skill check in their line of work" data-bonus="${rn}" data-tal="3">In their line of work (+3 more)</button><label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret</span></label></div>
    ${feats.length?h`<div class="qnfs">${feats.map(f=>qnFeatHtml(f,qnUsed(nt,f.key),'data-act="nt_qpip" data-id="'+esc(id)+'"'))}</div>`:(q.r==='1'?h`<p class="sub">Novices have no useful features.</p>`:'')}
    ${qnChoices(q)}
    <p class="sub">Each feature is a free action on the NPC's turn, and an NPC uses at most one feature a round. Dots start again in each battle.</p>
    ${q.r?h`<p class="sub"><b>Their Pokémon in a battle:</b> ${qnAppliedTxt(q).join('; ')}.</p>`:''}
  </div>`;
}
/* ----- an NPC's Pokémon entering a battle ----- */
function qnMove(name){
  const L=PTA.lists,d=L&&L.moveMap&&L.moveMap.get(dexKey(name));
  return d?{name:d.n,freq:d.f||'At-Will',kind:d.k||'Physical',range:d.r||'',type:d.t||'Normal',dice:d.d||'',text:d.x||'',used:0,qb:1}
    :{name,freq:'At-Will',kind:'Effect',range:'',type:'Normal',dice:'',text:'Bonus move from a Quick NPC feature. Fill it in from the handbook.',used:0,qb:1};
}
function qnFoe(f,nt,id){
  const q=qnOf(nt);
  if(!q)return f;
  const a=qnApplied(q);
  f.bonus=Object.assign(zeroStats(),f.bonus);
  f.bonus.def=num(f.bonus.def)+a.def;f.bonus.spd=num(f.bonus.spd)+a.spd;
  a.mv.forEach(n=>{if(!(f.mv||[]).some(x=>dexKey(x.name)===dexKey(n)))f.mv=(f.mv||[]).concat([qnMove(n)]);});
  a.ps.forEach(p=>{if(!(f.ps||[]).some(x=>dexKey(x.name)===dexKey(p.n)))f.ps=(f.ps||[]).concat([{name:p.n,text:p.x,q:1}]);});
  f.up='';f.down='';f.natureName='';
  f.pc=2;
  f.qn={id,dmg:a.dmg,def:a.def,spd:a.spd,sq:num(q.sq)>=3?num(q.sq):0};
  return f;
}
/* a move as it is shown and rolled for this holder: per-combat uses for Quick NPC and ranked wild Pokémon, otherwise the rules in use */
function effMove(x,m){
  if(!x)return x;
  if(m&&m.pc){
    const freq=String(x.freq||'').replace(/^(\s*)3(\s*\/\s*)day/i,'$1'+m.pc+'$2combat');
    const dice=hbDice(x.dice,monDie(m));
    return freq===x.freq&&dice===x.dice?x:Object.assign({},x,{freq,dice});
  }
  return hbMove(x,monDie(m));
}
/* ----- wild ranks and Swarms, on a foe's sheet ----- */
const qwCls=k=>QN_WC.find(c=>c.k===k)||null;
const qwEnh=k=>QN_EN.find(c=>c.k===k)||null;
/* the HP a wild rank gives, from the written Pokédex HP */
function qwHp(r,base){
  return r==='skilled'?base+8:r==='exp'?base*2:r==='ace'?base*2+150:r==='swarm'?Math.max(1,Math.round(base/2)):base;
}
function qwUndo(f){
  if(!f||!f.qr)return f;
  const h0=f.qr.h0||{},mx=Math.max(1,num(f.hp&&f.hp.max)),cur=num(f.hp&&f.hp.cur);
  const m0=Math.max(1,num(h0.max));
  f.hp={cur:cur<=0?0:clamp(Math.round(m0*cur/mx),1,m0),max:m0};
  if(f.qr.x0!=null)f.hpx=f.qr.x0;else delete f.hpx;
  delete f.qr;delete f.pc;
  return f;
}
function qwApply(f,r,wc,en){
  const keep=f.qr?{wc:f.qr.wc,en:f.qr.en,u:f.qr.u}:{};
  qwUndo(f);
  if(!r)return f;
  const hp=f.hp||{cur:20,max:20};
  const x0=f.hpx!=null?num(f.hpx):null;
  const base=Math.max(1,Math.round(num(hp.max)/hpxOf(f)));
  const max=qwHp(r,base);
  const cur=num(hp.cur)<=0?0:clamp(Math.round(max*num(hp.cur)/Math.max(1,num(hp.max))),1,max);
  f.qr={r,wc:wc!==undefined?wc:(keep.wc||''),en:en!==undefined?en:(keep.en||''),h0:{cur:hp.cur,max:hp.max},x0,u:keep.u||{}};
  f.hp={cur,max};f.hpx=1;
  f.pc=r==='ace'?5:2;
  return f;
}
function qwFeats(qr){
  const out=[];
  if(!qr)return out;
  if(qr.r==='swarm')return out;
  const wc=qwCls(qr.wc),en=qwEnh(qr.en);
  if(wc)wc.f.forEach(f=>out.push({key:'w.'+wc.k,cn:wc.n,t:'skilled',n:wc.n+': '+f.n,x:f.x,l:f.l,src:'wild'}));
  if(en&&(qr.r==='exp'||qr.r==='ace'))en.f.filter(f=>f.t==='exp'||qr.r==='ace').forEach(f=>out.push({key:'e.'+en.k+'.'+f.t,cn:en.n,t:f.t,n:en.n+': '+f.n,x:f.x,l:f.l,src:'enh'}));
  return out;
}
const qwBig=f=>!!(f&&f.qr&&(f.qr.r==='exp'||f.qr.r==='ace'));
function qwRankTxt(qr){
  if(!qr)return '';
  if(qr.r==='swarm')return 'Swarm member: max HP halved, and only a quarter of the swarm takes turns each round. Members that are not acting may still move 10 ft on their initiative.';
  return {skilled:'Skilled: +8 max HP.',exp:'Experienced: double max HP, +4 to Affliction checks (the Battle helper adds it), and cannot be caught by Poké Balls unless below 30 HP.',
    ace:'Ace: double max HP plus 150, 3/day moves are 5 per combat, +4 to Affliction checks (the Battle helper adds it), may make a Difficulty 16 Affliction check to clear all ▼ in one stat, and cannot be caught by Poké Balls unless below 30 HP.'}[qr.r]||'';
}
function qwSet(cid,r,wc,en){
  if(!S.me.admin)return;
  const f0=foeOf(cid);
  if(!f0)return;
  if(foeKind(f0)){toast('Set this foe’s Alpha, Totem or Titan kind back to Normal first. A foe uses one or the other.');return;}
  const f=JSON.parse(JSON.stringify(f0));
  if(r===undefined)r=f.qr?f.qr.r:'';
  if(!r&&(wc!==undefined||en!==undefined)){toast('Choose a rank first.');return;}
  qwApply(f,r,wc,en);
  ['hp','qr','pc','hpx'].forEach(k=>edit('gb','battle','foes.'+cid+'.'+k,f[k]===undefined?null:f[k]));
  foePublish(cid);
  render();
}
function qwSpend(cid,key,j){
  const f=foeOf(cid);
  if(!S.me.admin||!f||!f.qr)return;
  const u=Object.assign({},f.qr.u||{});
  const cur=num(u[key]);
  u[key]=j<cur?j:j+1;
  edit('gb','battle','foes.'+cid+'.qr.u',u);
  render();
}
/* the GM-only rows on a foe's Edit details */
function qwRow(cid,f){
  const qr=f.qr||{},r=qr.r||'',k=foeKind(f);
  if(qr.r==='swarm')return h`<div class="mgd secret fkind"><span class="fl">GM only · Swarm</span><p class="sub">${qwRankTxt(qr)} Remove it from the battle to drop it.</p></div>`;
  return h`<div class="mgd secret fkind"><span class="fl">GM only · Quick wild rank</span>
    ${k?h`<p class="sub">This foe is an ${k==='alpha'?'Alpha':k==='totem'?'Totem':'Titan'} by the GM Guide rules. Set its kind back to Normal to give it a wild rank instead.</p>`:h`
    <div class="row evchips" role="group" aria-label="Wild rank">${QN_WRANKS.map(([v,l])=>h`<button class="btn sm chk" data-act="b_qrank" data-cid="${cid}" data-r="${v}" aria-pressed="${String(r===v)}">${l}</button>`)}</div>
    ${r?h`<p class="sub">${qwRankTxt(qr)}</p>
      <span class="fl">Wild class (its Skilled feature)</span>
      <div class="row evchips" role="group" aria-label="Wild class">${QN_WC.map(c=>h`<button class="btn sm chk" data-act="b_qwc" data-cid="${cid}" data-v="${c.k}" aria-pressed="${String(qr.wc===c.k)}">${c.n}</button>`)}</div>
      ${r==='exp'||r==='ace'?h`<span class="fl">Enhanced class (its ${r==='ace'?'Experienced and Ace features':'Experienced feature'})</span>
      <div class="row evchips" role="group" aria-label="Enhanced class">${[['','None']].concat(QN_EN.map(c=>[c.k,c.n])).map(([v,l])=>h`<button class="btn sm chk" data-act="b_qen" data-cid="${cid}" data-v="${v}" aria-pressed="${String((qr.en||'')===v)}">${l}</button>`)}</div>`:''}`
      :h`<p class="sub">Give this wild Pokémon a rank from the Quick NPC rules. Its HP is worked out from its written Pokédex HP; choose None to undo it.</p>`}`}
  </div>`;
}
/* GM-only box on a foe's read view: its trainer's Quick features, or its wild rank's features */
function qnFoeBox(cid,f){
  if(!S.me.admin||!f)return '';
  if(f.qn&&f.qn.id){
    const nt=NTS()[f.qn.id],q=qnOf(nt);
    if(!q)return '';
    const feats=qnFeats(q);
    const sq=num(q.sq)>=3?num(q.sq):0;
    return h`<div class="mgd secret qnbox"><span class="fl">GM only · ${ntName(nt)}: ${qnRankName(q.r)} ${(qnCls(q.cls)||{}).n||''}${sq?' · Squad of '+sq:''}</span>
      ${sq?h`<p class="sub">Only ${qnSquadAct(sq)} of the ${sq} trainers command Pokémon or use features each round; one limited feature a round from the shared pool.</p>`:''}
      ${feats.length?feats.map(x=>qnFeatHtml(x,qnUsed(nt,x.key),'data-act="nt_qpip" data-id="'+esc(f.qn.id)+'"')):h`<p class="sub">No features.</p>`}
      ${qnChoices(q)}
      <p class="sub">Applied to this Pokémon: ${qnAppliedTxt(q).join('; ')}.</p></div>`;
  }
  if(f.qr){
    const feats=qwFeats(f.qr);
    return h`<div class="mgd secret qnbox"><span class="fl">GM only · ${f.qr.r==='swarm'?'Swarm':'Wild rank: '+(QN_WRANKS.find(x=>x[0]===f.qr.r)||['',''])[1]}</span>
      <p class="sub">${qwRankTxt(f.qr)}</p>
      ${feats.map(x=>qnFeatHtml(x,num((f.qr.u||{})[x.key]),'data-act="b_qpip" data-cid="'+esc(cid)+'"'))}
      ${f.qr.r!=='swarm'&&!f.qr.wc?h`<p class="sub">No wild class chosen yet (Edit details).</p>`:''}</div>`;
  }
  return '';
}
/* pills on a foe's row in the turn order (GM only) */
function qnPill(f){
  if(!S.me.admin||!f)return '';
  if(f.sw&&num(f.sw.n))return h`<span class="pill gm" title="Swarm: a quarter of the swarm takes turns each round">Swarm: ${Math.max(1,Math.ceil(num(f.sw.n)/4))} of ${num(f.sw.n)} act</span>`;
  if(f.qn&&num(f.qn.sq))return h`<span class="pill gm" title="Squad: half the trainers command each round">Squad: ${qnSquadAct(f.qn.sq)} of ${num(f.qn.sq)} command</span>`;
  if(f.qr&&f.qr.r&&f.qr.r!=='swarm'){
    const twice=f.qr.en==='alpha'&&(f.qr.r==='exp'||f.qr.r==='ace');
    return h`<span class="pill gm">${(QN_WRANKS.find(x=>x[0]===f.qr.r)||['',''])[1]}${f.qr.wc?' '+(qwCls(f.qr.wc)||{}).n:''}</span>${twice?h`<span class="pill gm" title="Champion of the Wild: two turns a round, one of them a Priority turn">Two turns</span>`:''}`;
  }
  return '';
}
/* what a ranked wild Pokémon or a Quick NPC's Pokémon loses when it is caught or given to a trainer */
function qnStrip(g){
  let note='';
  if(g.qr){
    const qr=g.qr,wc=qwCls(qr.wc),en=qwEnh(qr.en);
    if(qr.r!=='swarm'){
      const caps=[wc&&wc.cap,en&&(qr.r==='exp'||qr.r==='ace')&&en.cap].filter(Boolean);
      note=' Its wild rank bonuses are gone.'+(caps.length?' Captured: it gains '+caps.join('; and ')+'.':'');
    }
    qwUndo(g);
  }
  if(g.qn){
    g.bonus=Object.assign(zeroStats(),g.bonus);
    g.bonus.def=num(g.bonus.def)-num(g.qn.def);g.bonus.spd=num(g.bonus.spd)-num(g.qn.spd);
    g.mv=(g.mv||[]).filter(x=>!x.qb);g.ps=(g.ps||[]).filter(x=>!x.q);
    delete g.qn;delete g.pc;
  }
  delete g.sw;
  return note;
}
function qnBattleAct(d){
  switch(d.act){
    case 'b_qrank':qwSet(d.cid,d.r||'');return true;
    case 'b_qwc':{const f=foeOf(d.cid);qwSet(d.cid,undefined,f&&f.qr&&f.qr.wc===d.v?'':d.v);return true;}
    case 'b_qen':qwSet(d.cid,undefined,undefined,d.v||'');return true;
    case 'b_qpip':qwSpend(d.cid,d.k,num(d.j));return true;
    case 'b_swarm':S.ui.bt.foeSw=!S.ui.bt.foeSw;render();return true;
  }
  return false;
}
