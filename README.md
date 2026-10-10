# Sinnoh Trainer Log: GitHub Pages edition

A shared campaign tracker for your table. Everyone creates an account, signs in, and controls their own trainer and Pokémon. The GM sees and changes everything.

- **Hosting:** GitHub Pages (free). The site is plain files, so there is nothing to build.
- **Accounts and data:** Firebase (Google), free "Spark" plan. No credit card needed.
- **Who gets in:** only people who create an account **and** enter a table code that you choose.

## What each person can do

| | Players | GM |
|---|---|---|
| Their own trainer sheet and Pokémon | edit | edit |
| Other players' sheets | read only | edit (for example, awarding badges and levels) |
| Deleting a trainer or a Pokémon | their own (type the name to confirm) | anyone's |
| People and leads | add and edit (anyone), delete their own | edit or delete anything |
| Journal, timeline, map pins | add, and edit or delete their own | edit or delete anything |
| Region map, place pages, banner, table settings | read | edit |
| Honors and awards | see | give and revoke |
| Loyalty scores, NPC secrets, GM place notes, foe sheets, NPC trainers' sheets, items, rosters and secrets | never sent to players | read and edit |
| Battle page: turn order, health, stages, status | see the order and what the GM reveals; change their own Pokémon | run the whole battle, change anyone's |
| Dice rolls and the table's roll log | roll for their own Pokémon and trainer; everyone sees the log | roll for foes, apply damage, clear the log |
| Giving a Pokémon to a trainer | no | yes (GM Desk, or from a foe in a battle) |
| NPC trainers: making them, their picture, stats, items and Pokémon, putting them in a battle, Mega Evolving their Pokémon | no | yes (NPC Trainers page and Battle page) |
| Seeing an NPC trainer (picture, level, class, stats, items, held items, Mega form) | only after the GM shows it, and only what the GM ticked | everything |
| Pokédex: seen and caught marks | their own (while the Pokédex is not locked) | anyone's, and the lock |
| Private notes | only they can read them | only they can read theirs |
| Table code and player list | no access | change code, remove players |

These limits are enforced on Google's servers by `firestore.rules`, not just hidden in the page.

A player can edit every field of their own sheet, including level and badges. If you want those to be GM-only, ask for a rules change.

## Set-up (about 20 minutes, once)

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and choose **Add project**. Name it anything. You can turn Google Analytics off.
2. On the project's home page, click the **web** icon (`</>`) to add a web app. Give it a nickname. Do **not** tick Firebase Hosting.
3. Firebase shows a block of settings called `firebaseConfig`. Keep that page open. You can find it again later under the gear icon → **Project settings → General → Your apps**.

Firebase rearranges its console menus from time to time. If a label below does not match what you see, use the search box at the top of the console.

### 2. Paste the settings into this folder

Open `firebase-config.js` in any text editor. Replace each `PASTE_...` value with the matching value from `firebaseConfig`. Save the file.

These settings are not passwords, and it is normal for them to be public in your repository.

### 3. Turn on sign-in

In the Firebase console left menu: **Security → Authentication** (older layouts put it under **Build**). Click **Get started**, then the **Sign-in method** tab.

- Turn on **Email/Password**.
- Optional: turn on **Google** (it asks for a support email). If you would rather not offer it, set `google: false` in `firebase-config.js`.

Then open **Authentication → Settings → Authorized domains** and **Add domain**: `YOURNAME.github.io` (your GitHub user name, lower case, no `https://`, no repository name). `localhost` is already listed for testing on your own computer.

### 4. Create the database

In the left menu open **Databases & Storage → Firestore** and click **Add database**. Choose **Standard edition**, leave the database ID as `(default)`, pick a location near your players (it cannot be changed later), and start in **Production mode**.

### 5. Publish the security rules

In Firestore, open the **Rules** tab, delete what is there, paste in the whole contents of `firestore.rules`, and click **Publish**.

Do this before you share the link with anyone.

### 6. Put the site on GitHub

1. Create a new repository on GitHub. On a free account it has to be public.
2. Upload everything in this folder, including the `vendor` folder: **Add file → Upload files**.
3. In the repository, open **Settings → Pages**, set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, and save.
4. After a minute or two the site is live at `https://YOURNAME.github.io/REPOSITORY-NAME/`.

### 7. Make yourself the GM

1. Open your site and choose **Create an account**. Leave **Table code** blank, because you have not made one yet.
2. You land on **Join the table**. Open **Setting this site up as the GM?** and copy your **account ID**. (You can also find it later in the console under **Authentication → Users**, in the **User UID** column.)
3. In the Firebase console, open Firestore and its **Data** tab, click **Start collection**, and create two things:
   - Collection `admins`, document ID = your account ID, one field: `gm` (boolean) = `true`.
   - Collection `config`, document ID = `invite`, one field: `code` (string) = the table code you want to give players. Use at least 6 characters, such as a short phrase.
4. Reload the site. You are now signed in as the GM and a **GM Desk** appears in the menu.

From then on you can change the table code, and see and remove players, on **GM Desk → Table access**.

### 8. Upload the map

Open the **Map** page and choose **Upload map**, then pick your Sinnoh map image. The hover highlights, place cards and place pages switch on when the picture has the same shape as the original map (the page tells you if it does not).

The map image is stored in your Firebase database, not in the repository, so it is not publicly downloadable from GitHub.

### 9. Invite your players

Send them the site address and the table code. Use a code that is not easy to guess (for example three unrelated words), because anyone who knows it can join. They choose **Create an account**, enter a display name, email, password and the code, and they land on their own empty sheet.

## Running it on your own computer

In this folder run `python3 -m http.server 8000` and open <http://localhost:8000>. It uses the same Firebase project and data as the live site.

## Updating the site

When you get a new version of these files:

1. In your GitHub repository, choose **Add file → Upload files** and drag in the new files over the old ones (including the `vendor` folder if it is included; this release adds `vendor/fonts`). **Do not** replace your own `firebase-config.js` unless you re-enter your settings in the new one.
2. If `firestore.rules` changed, open Firebase console → **Firestore → Rules**, paste in the new contents, and click **Publish**. Do this before players use the new version. The rules have not changed since the delete-your-own-trainer update, so if you already published those there is nothing to do for Mega Evolution, the handbook data, evolution, the Battle page, the combat reference, the Pokédex or NPC trainers (including their pictures, stats, items and Mega Evolution): they are all stored in documents the existing rules already cover (the secret foe sheets go in `gm/battle` and each NPC trainer in `gm/nt_…`, which only you can read; what the table is shown of an NPC goes in `meta/npcs`, which only you can write, and an NPC's shared picture goes in `mapimg/npc_…`, in the same collection as the map, which members can read and only you can write; a player's Seen and Caught marks go on their own trainer sheet; the Pokédex lock goes in `meta/mega`, which only you can write).
3. GitHub Pages takes a minute or two to update (check the repository's **Actions** tab for a green tick). Each person should refresh the page once, holding Shift while clicking reload.
4. **Check that the new version is running.** The very bottom of every page says **Version** followed by a date and a name (this release: `Version 2026-10-10 · NPC pictures`). If it is missing or shows something older, the browser is still using the old files. Reload with Shift held, or open the site in a private window. If a private window is also old, the upload did not replace the files: check that `app.js` and `index.html` are in the top level of the repository (not in a sub-folder) and that you pressed **Commit changes**.

Nothing in your database changes when you update the files. The handbook data is a separate step (see **Handbook data** below). The handbook data is version 2 (`pta-handbook-data.json`): it adds evolution lines and five species the first file missed (Bisharp, Heliolisk, Amoonguss, Stantler and Azumarill). **If you have already imported that file, this release needs no new import.** If you have not, import it once (**GM Desk → Handbook data → Import again**). Until then everything else keeps working, but Pokémon show no Evolution panel, foes and gifts fall back to basic numbers, and the GM Desk says a re-import is needed.

## How it looks

- **Pokémon cards** are tinted with their type colours (a Fire and Fighting Pokémon shades from orange to red) and show a Pokémon-game sprite chosen from the species name. "Alolan Raichu" or "Shiny Lucario" still find the right species. If a Pokémon has an uploaded picture, that is shown instead. If the species is not recognised, or the sprite cannot load, the card shows the first letter of its name.
- **Where sprites come from.** The pictures are loaded when someone opens the page, from the public PokeAPI sprite collection on GitHub (`raw.githubusercontent.com/PokeAPI/sprites`). They are not stored in your repository or your database. If you ever open the site in a place that blocks that address, the letter tiles appear instead and nothing else is affected.
- **Bag icons.** Items in a trainer's inventory, and a Pokémon's held item, show an item icon when the name matches one from the games. The Item and Held item fields suggest names as you type. Capitals, accents and plurals do not matter ("great balls" finds Great Ball, "Oran" finds Oran Berry). Items the games do not have, such as something you invented, show the first letter instead. Mega Stones and the Mega Bracelet and Key Stone have icons too. Icons come from the same public PokeAPI sprite collection as the Pokémon pictures.
- **Badge case.** The eight Sinnoh badges sit in a case on the trainer sheet. Dull slots are not earned yet. Tap one to light it up. Only the trainer's owner and the GM can change a case. A full case glows gold.
- **Day and Night.** Use the sun or moon button at the top, or **Account → Appearance**. Auto follows the device. The choice is remembered on that device only.
- **Fonts** (Pixelify Sans, Nunito and VT323) are included in `vendor/fonts`, so the site does not call Google Fonts. They are free to use under the SIL Open Font License; the licence files are in the same folder.

## Handbook data: stats, passives and moves

Once you import the PTA 3 Pokédex data, typing a species fills in everything the book lists for it, and typing a move or passive name fills in that row.

**Import it once.** The data is in `pta-handbook-data.json`, which came with the update as a separate download. **Do not upload that file to GitHub.** The book's text would then be public. Instead: sign in as the GM, open **GM Desk → Handbook data**, tap **Import handbook data** and choose the file. It takes a few seconds and stores the data in your Firebase database, where only signed-in members of your table can read it. The panel then shows how many Pokémon are in the database. Importing again simply replaces it, so you can use that if you ever get a corrected file. Nobody else needs to do anything.

**What a species fills in.** Type a species (including the book's own variants, such as "Zigzagoon (Urban)" or "Raichu (Island)", which now appear in the suggestion list) and move on. Types, the book's real stats (HP, Attack, Defense, Special Attack, Special Defense, Speed), size, weight, skills, passives with their full text, and the three moves with kind, type, range, uses, damage and effect are all filled in. These are the book's numbers, not the ÷15 conversion used before. Things to know:

- A field you changed after the last fill is **kept** when the species changes (change a passive, and the passives stay; the moves you did not touch still follow the new species). A short note says what was kept.
- The **Fill from the handbook** button under the species box puts everything back on purpose. If it would replace passives or moves you wrote, it asks you to tap a second time.
- Passives the book only names (it defines each one in the first Pokémon that has it) are filled in from that first definition.
- Species the book does not list, such as regional forms ("Alolan Vulpix"), still get the basic types and base stats described below.
- A Pokémon can now hold up to 8 passives, since some entries have five or more.

**Moves and passives by name.** In a move row, type a move's name (the list of suggestions has all 527 in the book) and, if the row's **Effect** and **Damage** are still empty, its kind, type, range, uses, damage and effect fill in. In a passive row, typing a passive's name fills in its effect. A row with text you wrote is never overwritten.

**Mega Evolution numbers.** For the 43 Mega forms in the Players Handbook 2, the Mega panel uses the book's stat bonuses and Mega passive instead of an approximation. Mega details that were filled in automatically update by themselves the next time the owner opens the app after the import. Ones a player edited by hand are left alone.

## Species auto-fill and Mega Evolution

**Auto-fill.** Without the handbook data (or for a species it does not list), type a species in a Pokémon's **Species** box and move on. The app fills in its types and base stats, and adds its Mega details if it has a Mega form. Regional forms work too (try "Hisuian Zorua" or "Alolan Vulpix"). Base stats are the games' base stat divided by 15, rounded, never below 1 (Bulbasaur's 49/49/65/65/45 becomes 3/3/4/4/3). That scale is a starting point, so change any number you like. Anything a player has already changed is kept when the species changes. The **Fill types and base stats** button under the fields overwrites them on purpose.

**Mega Evolution.** Every Pokémon with a Mega form gets a **Mega Evolution** panel on its card. It lists what the form needs, and each line turns green when met:

- the Pokémon is holding the right Mega Stone (typed in its **Held item** box),
- the trainer has a **Key Stone** in their inventory (the name "Key Stone", "Mega Bracelet", "Mega Ring" and the like all count),
- that Key Stone has not been used yet this battle (**once per battle for the whole trainer**),
- **you, the GM, have approved that Pokémon.**

When all four are met, the player taps **Mega Evolve**. The card gets a rainbow ring and a Mega sprite, the types, stat bonuses and ability switch to the Mega form, and the trainer's Key Stone shows as **spent**. **Revert to normal** goes back but does not recharge the Key Stone.

**Your approval.** Nothing can Mega Evolve until you mark it **Allowed**. Do that on the **GM Desk** (the Mega Evolution panel lists every Pokémon with a Mega form, by trainer) or on the Pokémon's own card. Players never see these switches. The approval is stored in `meta/mega`, which the existing rules already limit to you.

**Ending a battle.** **End battle** on the Pokémon page reverts that trainer's Mega forms and recharges their Key Stone. **Pokémon Center** and **Rest 8h** do the same. On the GM Desk, **End battle for everyone** does it for the whole table.

**Editing a Mega form.** **Edit details** on the panel lets you change the form's name, stone, types, ability and stat bonuses, or reset them to the official values. Once you edit a value, a later change of species leaves that Mega alone.

## Evolution

Once the new handbook data is imported (see above), every Pokémon whose species evolves in the PTA 3 Pokédex (471 species, 511 evolution links) gets an **Evolution** panel on its card. It lists what the book says it can become and the condition printed for each (level, stone, trade, time of day and so on).

**Your approval.** Evolving works like Mega Evolution: nothing happens until you allow it. Two ways:

- **Per Pokémon.** On the **GM Desk → Evolution** panel (or on the Pokémon's own card) switch a Pokémon to **Allowed**. If it has a branching line, such as Eevee, you can also pick which form it may become, or leave it open to all of them. Players never see these switches.
- **Everyone.** At the top of the Desk's Evolution panel, choose **Players may evolve freely** (the other choice is **I approve each one**). Players can then evolve any Pokémon whose line allows it, with no approval.

A per-Pokémon approval **closes itself** the moment that Pokémon evolves, so the next stage needs a new approval. You can always evolve a Pokémon yourself, and the GM's view of a card has a box for **any other species** with an **Evolve into it** button, for things the book does not cover (a regional form, a story evolution).

**What the player sees.** Tapping an evolution shows a preview before anything changes: the new types, the old and new stat blocks side by side, the passives and skills that change, and the moves. Then **Evolve** applies it.

- **Replaced:** types, base stats, HP, size and weight come from the new species.
- **Kept:** the nickname, held item, notes, nature, and the **Adj** boxes (the stat adjustments the player or you have entered).
- **HP:** the damage already taken is kept. A Pokémon that was at 10 HP below full is still 10 below full after evolving. A fainted Pokémon stays fainted.
- **Passives and skills:** the new species' list is used. If the player had changed the text of a passive that also exists on the new species, their version is kept. Passives and skills the player wrote themselves are kept, up to the limit of 8 passives.
- **Moves:** the Pokémon keeps its current moves, and the new species' moves fill any free slots up to the limit of 6. In the preview each move is a chip the player can switch on or off. If more than six are on, **Evolve** is disabled until some are switched off. **Use the handbook’s moves** instead picks only the new species' moves.
- **Evolution stones.** If the condition names a stone (Fire Stone, Thunder Stone and so on) and the trainer has it in the bag, one is used up.
- **Undo.** Right after evolving, the card offers **Undo evolution** (puts everything back exactly as it was) or **Keep it**.

**Stat passives and the Adj boxes.** The stats printed in the Pokédex already include the effect of passives such as Power Up (+1 Attack) or Mighty (+2 Attack), so the app does **not** add them again. Because of that, if a player adds, removes or changes one of those passives by hand, the shown stats do not move by themselves. The app notices and offers a note on the card, **Passives changed**, with the stat change the passive implies. **Add to Adj** applies it to the Adj boxes, and **Leave it** dismisses it. The same prompt appears after an evolution if the new species' passives differ from the old. Situational passives (such as Guts) are not part of the printed numbers and are never counted.

## Battle

**Table → Battle** runs a fight. Everyone sees the turn order, the round, and whose turn it is, and the page updates for everyone as you change it. The menu shows **LIVE** next to Battle while one is running.

**Setting up (GM).** Under **Who is fighting**, add a whole party, single Pokémon, and foes. Then tap **Roll initiative**. Two ways to decide the order, switchable any time:

- **Highest Speed first** (the default): each one's Speed, with ties settled by a hidden d20.
- **d20 + Speed**: each rolls a d20 and adds Speed.

**Next turn** moves on and counts the rounds. A Pokémon at 0 HP is marked **Down** and skipped. If someone's Speed changes mid-fight (a Speed ▲ is +5 Speed per step), **Re-sort by Speed** puts everyone back in order. On any row, **Acts now** jumps the turn there, ↑ and ↓ move it in the order, and **Remove from battle** (two taps) takes it out. Only the GM adds or removes Pokémon.

**Health, stages and status.** Open a row with **Details**. Players can do this for their own Pokémon, and you can for anyone. You can change HP with the −5 / −1 / +1 / +5 buttons or by typing an **Amount** and tapping **Damage** or **Heal**. HP is capped between 0 and the maximum. Under it are the status chips (Bound, Burned, Confused, Dazed, Disabled, Drowsy, Entranced, Frostbitten, Paralyzed, Poisoned, Toxified) and the **combat stages**: each of Atk, Def, SpAtk, SpDef and Spd goes from −3 to +3 and shows as ▲ or ▼. These are saved on the Pokémon's own card too (Pokémon page → Combat stages), so the two stay the same. Stages change rolls like this:

- Each Attack or Sp. Attack ▲ on the attacker adds **1 die** to the damage, and each ▼ removes one.
- Each Defense or Sp. Defense ▼ on the target adds 1 die, and each ▲ removes one.
- Speed ▲ and ▼ move Speed by 5 per step (for initiative and for Effect-move accuracy).

**End battle** (two taps) clears the order and every foe, and also does what **End battle** on the Pokémon page does for each trainer: Mega forms revert, Key Stones recharge, and stages reset to zero.

### Foes the players cannot see

A foe has its own sheet (species, types, HP, stats, moves, passives, your notes). It is filled in from the handbook data when the species is listed, otherwise it starts from basic numbers (you can edit every field). Add several of the same species at once with **How many** (up to 8).

**The sheet is stored in `gm/battle`, a document that Firestore's rules let only you read.** A player's browser never receives it, so there is nothing hidden "behind" the screen to find. What the table sees is a separate, smaller document (`meta/battle`) that holds only what you have chosen to show:

- By default a foe is just **Foe A**, **Foe B**… with a question-mark picture, **Types unknown**, and **Health hidden**.
- Open the foe and use **GM only · what the players see**: tick **Name**, **Picture**, **Types**, and **Status and stages** as you like, and set **Health** to **Hidden**, **Bar only** (a bar with no numbers), or **Numbers**. **Show everything** and **Hide everything** do the lot at once. **Name while hidden** lets you rename "Foe A" to something like "Shadow in the grass". A line under the controls spells out exactly what players now see.
- A foe's initiative number and Speed are never shared. Players just see where it stands in the order.
- Your **Notes** on a foe are yours only.
- A foe at 0 HP shows as **Down** to everyone, even if its health is hidden. (Otherwise the order would stall with no reason given.)

**Moves and rolling for a foe.** Each move on the sheet has **Roll attack** (accuracy and damage) and **Damage only**. Pick a **Target** among the Pokémon in the fight first, and the roll compares against that Pokémon's Defense and types. Typing a move's name into an empty row fills in the rest from the handbook. The table log shows a foe's roll as **totals only** (accuracy 14, hit, damage 21), never its dice or its stats. Tick **Roll in secret** to keep a roll off the shared log.

**Caught.** On a foe's sheet, pick a trainer under **Caught by** and tap **Give to trainer**: its sheet and current HP are copied into that trainer's party (or box if the party is full) and it leaves the fight.

## NPC trainers

**Game Master → NPC Trainers** is where you make the people your table meets who have Pokémon of their own: a rival, a gym leader, a stranger on a route. Nothing you put there reaches the players until you decide to show it.

**Making one.** Tap **New NPC trainer** and fill in the name, role or title, where you met, **notes the table learns once you show them**, and a **secret** that only you ever see. Then use **Give this NPC a Pokémon**: type a species (and a name if you like) and tap **Add Pokémon**. Its types, stats, passives and moves fill in from the handbook data, like a foe. Tap **Edit** on a Pokémon to change anything: HP, stats (Base and Adj), held item, nature, moves (typing a move's name into an empty row fills in the rest), passives and your notes about it. **Fill from the handbook** (two taps) puts the handbook numbers back. **Remove Pokémon** and **Delete this NPC** also take two taps.

**Where it is kept.** Each NPC is one document, `gm/nt_…`, that Firestore's rules let only you read. A player's browser never receives it, so the secret, the notes and every sheet are not hidden "behind" the page: they are simply not there. What the table may see is a separate, small document, `meta/npcs`, that holds only the NPCs you have shown and, for each one, only what you ticked.

**Showing an NPC.** In **GM only · what the players see**, tick **Show this NPC to the table**. That alone shows just the name. Then tick any of **Role**, **Where you met**, **Your notes**, **Picture**, **Level and class**, **Stats** and **Items** to add those. The line below spells out what the players see right now. Players find them on the **People** page, under **Trainers you have met** (you see the same panel there, marked as what the players see). Untick **Show this NPC** and she disappears from their screens again; what you ticked is remembered for next time.

**Showing a Pokémon.** Every Pokémon starts fully hidden. On its sheet, tick **Name**, **Picture** and **Types** to show those on the NPC's card (**Show all** and **Hide all** do the lot). Tick **Held item** to show what it is holding ("holding Garchompite"). With the name hidden the card says "Unknown Pokémon" and the picture does not give the name away; the moves, stats, nature, passives and your notes are never shown. A Pokémon only appears on the card once the NPC herself is shown. A Pokémon with its picture shown on a card counts as **seen** in the Pokédex.

**In a battle.** On the NPC's page, **Add to battle** puts one Pokémon in and **Add the whole team to the battle** puts them all in. (The Battle page has the same buttons under **Who is fighting → NPC trainers**.) They join as **foes**, with the full sheet in `gm/battle`, so everything in **Foes the players cannot see** applies: they start as "Foe A", "Foe B" with no picture, types or health, and you show what you like. A foe remembers whose it is: you see "Foe · Cynthia" on its row and "Belongs to Cynthia" on its sheet. The players see her name on it only once you have shown her.

**Pictures.** On an NPC's page, **Upload picture** (beside her name) takes a photo or drawing from your device and shrinks it to a small JPEG, the same way a trainer's portrait works. **Change picture** and **Remove** appear once there is one. A small version also shows on her card in your list, and her first letter shows until you add one. The table sees nothing until she is shown **and** you tick **Picture**; then the portrait appears beside her name under **People → Trainers you have met**. Unticking **Picture**, hiding the NPC, removing the picture or deleting her takes the table's copy away at once, and the line under the picture says which of the two states it is in. Her Pokémon keep using the species pictures.

*Where the picture is kept:* her own copy sits on her private sheet (`gm/nt_…`), which only you can read. While it is shared, the table's copy is one small document, `mapimg/npc_…`, in the collection the map picture already uses (the existing rules let members read it and only you write it, so nothing needs republishing). The public NPC document, `meta/npcs`, never holds picture data.

**Trainer sheet and items.** Open an NPC and, under **Trainer sheet**, give her a **level**, a **class** (and an **advanced class** once the class has one), **HP** and the five stats, the same way a player's sheet has them. Each stat shows its modifier and a **d20** button; **Skills and features** opens her skills (tap a skill's badge to mark a talent) with a **Roll** beside each, and a **Features** list for abilities you want to keep track of. Rolls are made by you and appear in the table's roll log under your name as, for example, "Cynthia: Attack check". Tick **Roll in secret (not shared)** to roll without logging it. **Inventory** takes any items, each with a quantity and a note that only you see; typing "Key Stone" (or "Mega Bracelet", "Mega Ring") gives her one, and a **Key Stone ready** chip says so. NPCs saved by the last update get these fields, at level 1, 20 HP and stats of 2, the first time you open them. The table sees none of it until you tick **Level and class**, **Stats** (maximum HP and the five stats; her current HP is never shown) or **Items** (the item names and how many, never your notes or features).

**Their Pokémon: held item and nature.** On a Pokémon's sheet there is a **Held item** box (with its icon), and **Nature**, **Nature raises** and **Nature lowers**. The stat tiles include the nature, just as on a player's sheet.

**Mega Evolution for NPCs.** A Pokémon with a Mega form gets a **Mega Evolution** panel on its sheet, and a **Mega-ready** tag on the roster row when it holds its stone and she carries a Key Stone. **Add Mega Evolution details** fills in the form, stone, types, ability and stat bonuses from the handbook (an older Garchomp offers this; new ones get it when you add them). If the species has more than one Mega form, pick the one you want. **Give it the stone and a Key Stone** does both at once; the checklist shows what is still missing and says, in plain words, "Normally needs…. You can still do it", because you decide. **Edit details** changes the numbers or resets them to the official ones. The NPC has **one Key Stone use per battle**, shared by her whole team, and **End battle** (on the Battle page or the GM Desk) recharges it.

In a battle, the foe copy keeps the held item, nature and Mega details. Its sheet has **Mega Evolve** and **Revert to normal** buttons, and the stats, types, sprite and ability switch to the Mega form. **Mega Evolve** spends her Key Stone (one use per battle, as for the players). Any foe whose species has a Mega form can do this, whether or not it belongs to an NPC. Nothing about the Mega Evolution reaches the players until you tick **Mega form** on the foe's "what the players see" row; then they see a **Mega** mark, and the Mega picture, name and types follow the **Picture**, **Name** and **Types** ticks you already have. **Held item** shows what it carries. Leave these unticked and the players see only what they saw before.

**Good to know.**

- A foe is a **copy**. Damage, status and moves used in the battle change the foe, not the roster, so the NPC's Pokémon are back at full strength the next time. What you had ticked to show on the roster is copied into the battle when you add the Pokémon (after that the battle's own controls rule).
- Deleting an NPC, or removing a Pokémon, does not touch foes already in a battle: they stay, without the link and without her name.
- NPC against NPC is not set up: foes are always the GM's side.
- The NPC does not take a turn herself: her stats, items and rolls are for you to use at the table. The Pokémon are what fight.
- Damage, Mega Evolution and used items in a battle are **not** written back to the roster. A foe that Mega Evolves does not make the roster's Pokémon Mega, and the Key Stone's charge returns at **End battle**.
- **Give to trainer** on a foe's sheet works for an NPC's Pokémon too, if a player ends up with one.
- **Download my backup** includes your NPC trainers and what is shown, when you are the GM.

## Combat reference

At the bottom of the **Battle** page is a **Combat reference** with five folding sections: **Afflictions**, **Stat ▲ and ▼**, **Weather, terrain and zones**, **Type matchups** and **Rolls at a glance**. It is a short reminder in plain words, condensed from the PTA 3.5 Players Handbook (the handbook has the full rules). Everyone sees it.

- **Statuses explain themselves.** When a Pokémon or foe on the Battle page has an affliction ticked, a small note under the status buttons says what it does (the damage, the cure check, who is immune).
- **Type matchups** has a three-box helper: pick the attacking type and one or two defending types and it says how the move lands and how many dice that adds or removes, then lists every attacking type under Extremely effective, Super effective, Resisted, Shielded and No effect. It uses the same chart as the rolls.
- Nothing here is saved or shared. It is just a page to look things up.

## Pokédex

**Table → Pokédex** is a book of every species (1025), with a search and filters, and a page for each one.

**The list.** Search by name or number (`pika`, `25`, `#393`; punctuation does not matter). Filter by **Region** (National, or **Sinnoh**, the 210-species Platinum order with its own numbers), **Generation**, **Type**, and **Show** (everything, seen or caught, caught, not caught yet). The list shows 60 at a time with **Show more**.

**An entry** has, from top to bottom:

- The picture, number, types, and the **Seen / Caught** buttons.
- **Game entry.** The in-game description (the Platinum text where there is one, otherwise the newest) and the genus, such as "Mouse Pokémon". This is read live from PokeAPI's public data on GitHub when you open the entry. It is **not stored** and **needs an internet connection**. If it cannot load, the entry says so and offers **Retry**.
- **Handbook.** The PTA entry: size, weight, HP and stats, skills, passives, moves, and what it evolves into with the stone or condition. This comes from the handbook data you imported (see **Handbook data** above), so it is the same text as in your sheets. A species with several entries (Raichu and its Island form, Meowth's climates, Wormadam's cloaks) shows each. A species the handbook does not list (most legendaries) says so and shows the game stats divided by 15 instead. If you have not imported the handbook yet, that is shown for everything.
- **Evolution family.** The whole line as a tree. Tap any member to open it. This is the games' evolution line, which can differ from the handbook's wording.
- **Other forms:** regional forms and Mega Evolutions, when there are any.
- **← →** step to the previous or next entry in whatever list you were looking at.

**Seen and caught.** Marks are kept per trainer, on the trainer sheet. A Pokémon in your party or box counts as **caught** automatically, and a foe the GM has shown you in battle (its picture is visible) counts as **seen**. Two buttons appear when they would help: **Record … owned species as caught** (saves your current Pokémon as caught, so they stay caught if you release them) and **Set “Pokédex owned” … ** (copies the caught count onto the Trainer sheet's *Pokédex owned* box, which drives the certificate every 30). Neither runs by itself.

**For the GM.**

- Use the trainer buttons at the top to view and mark any trainer's book.
- **Mark seen for every trainer** (on an entry) is for "the whole party saw a Gible".
- **Lock the Pokédex for players** turns the book into a discovery game. A species the trainer has not met shows as **???**: no name, no picture, no handbook text, and it cannot be found by typing its name (a number still finds the empty slot). A **seen** species shows its name, picture, types and family. A **caught** species shows everything, except that what it evolves into stays **???** until you have met that one too. While it is locked, players cannot change their own marks: the book fills in from their Pokémon and from battles, and you can mark anything by hand. You always see everything.
- The lock is a **spoiler guard, not security**. It hides things in the page, and a determined player could still look the species up elsewhere. The handbook data itself is readable by every member either way, as before.

**Where it comes from.** Names, types and base stats of all 1025 species, the evolution lines and the Sinnoh order are built into `app.js` (taken from the open-source `@pkmn/dex` data and PokeAPI's Pokédex lists). Pictures come from the PokeAPI sprites repository on GitHub, the same place the Pokémon sprites already come from. Nothing about the Pokédex needs a new import or a new database rule.

## Dice and the roll log

**Rolling a move.** Every move on a Pokémon card has a **Roll …** button (players do not get it on another player's Pokémon, which they can only read). It opens a small form:

- **Target:** the others in the battle, by the names the table can see. Optional.
- **Type advantage:** **Automatic** uses the PTA type chart when the target's types are known (a player's Pokémon, or a foe whose types you have shown), and treats it as neutral otherwise. Or pick Neutral, Super effective (+1 die), Extremely effective (+2), Resisted (−1), Shielded (−2) or No effect yourself, for example once the GM tells you.
- **Accuracy bonus** and **Damage bonus**, for anything the handbook gives you.
- **Normal / Advantage / Disadvantage** (the same switch as the skill checks): two d20s, taking the higher or lower.
- **Critical hit (damage only)**, for when you rolled the 20 yourself or the GM says so.

**Roll attack** makes the accuracy check and the damage roll together, following the PTA 3.5 handbook:

- **Accuracy:** d20 + the modifier of Attack (Physical), Sp. Attack (Special), or Speed (Effect moves). When the target's Defense (or Sp. Defense, or Speed) is visible, as with another player's Pokémon, it says **Hit** or **Miss**. Against a hidden foe it does not say, because that would reveal its Defense: the GM calls it.
- **Damage:** the move's dice (for example 3d8), plus 1 die per step of type advantage or stage, minus 1 per step of resistance, then plus the stat modifier and **+4 if the move's type matches one of the Pokémon's types**. **No effect** deals 0.
- **Critical hit:** a natural 20 on the accuracy roll. Every die then counts as its highest face.
- **Effect moves** roll accuracy only. A move with no dice listed also rolls accuracy only.

**Damage only** rolls just the damage (use the critical box when it applies).

**Where results go.** The Pokétch box at the corner shows the full working. The same roll is saved on the player's trainer sheet and shows in **Battle → Table rolls** for everyone, with its working. Skill and stat checks from the Trainer sheet go there too. The newest 20 rolls per player (and 20 of the GM's) are kept, and the log shows the newest 30 overall. As GM you can **Clear the log** (two taps) and tick **Roll in secret** so your next rolls stay on your screen only.

**Apply.** When a logged attack has a target and damage, you see a button such as **Apply 22 to Foe A** (or to a player's Pokémon). Tapping it subtracts that damage from the target's HP and marks the roll as applied. Nothing is subtracted automatically.

## Giving Pokémon and the evolution log

**GM Desk → Give a Pokémon.** Pick a trainer, type a species (and optionally a nickname and where they got it) and tap **Give it**. The sheet is filled in from the handbook data (stats, types, passives, moves). It goes to the party, or to the box if the party already has six. A species the data does not know is still given, with basic numbers to edit.

**GM Desk → Evolution log.** Every evolution, by a player or by you, is listed with the trainer, the Pokémon, "from → to", and the date. Undoing an evolution removes its line. The list starts with evolutions made on this version; earlier ones were not recorded.

## Deleting trainers and Pokémon

- **A Pokémon:** open its card on the **Pokémon** page and tap **Delete Pokémon** twice.
- **A trainer:** at the bottom of the **Trainer** page, choose **Delete this trainer**, then type the trainer's name to confirm. This removes the sheet, all of its Pokémon, the honors recorded for it and (for the GM) the loyalty notes. It cannot be undone, so download a backup first if you are unsure.
- Players can delete their own. The GM can delete anyone's (open that trainer from the Overview first).
- Deleting a trainer does not remove the person's account or table access. They can make a new trainer from the **Trainer** page.

## Good to know

- **The repository contains** the app and the player-facing text for each place on the map. Nothing secret lives in it: no GM notes, no NPC secrets, no passwords, no map image. Those are in Firebase, and the rules keep players out of the GM-only parts.
- **Cost.** The Spark plan has daily limits (about 50,000 reads and 20,000 writes). They reset around midnight Pacific time. A table of a handful of players should stay far below them. If a limit is ever hit, the app stops loading data until the next day. Nothing is charged on the Spark plan.
- **What the Battle page keeps secret, and what it does not.** Foe sheets and NPC trainers are protected by the database itself (`gm/battle`, `gm/nt_…`), so players cannot read them even if they try. The roll log and the Mega and evolution approvals are different: they are stored where a determined player editing their own sheet could tamper with them, so they rely on trust at the table, as the Mega approvals already did.
- **The Pokédex needs the internet for one thing:** the in-game description in each entry is read from PokeAPI on GitHub when you open it. Everything else in it works from the page and your database. The lock hides things in the page; it is not a security feature.
- **Backups.** Every player has **Download my backup**. As GM, your backup contains the whole table. Do one now and then.
- **Removing someone.** **GM Desk → Table access → Remove** ends their access. Anyone who still knows the table code can join again, so change the code too if you want to keep someone out.
- **Forgotten passwords.** Players use **Forgot your password?** on the sign-in screen. The email comes from Firebase.
- **Changing a name.** **Account** in the menu.
- **Optional hardening.** In Google Cloud Console, under **APIs & Services → Credentials**, you can restrict the browser API key to `https://YOURNAME.github.io/*` (and `http://localhost:8000/*` if you test locally).

## If something goes wrong

| What you see | What to do |
|---|---|
| "Not connected to Firebase yet" | `firebase-config.js` still has the `PASTE_...` placeholders, or the file was not uploaded. |
| "This web address is not authorized for sign-in yet" | Add `YOURNAME.github.io` under Authentication → Settings → Authorized domains. |
| "This sign-in method is not turned on yet" | Turn on Email/Password (or Google) under Authentication → Sign-in method. |
| "Access was refused…" or "Could not open the table" | The rules are not published, or `firebase-config.js` points at a different project. Redo step 5 and check step 2. |
| "That table code did not work" | The code must match `config/invite` exactly, including capitals, and be at least 6 characters. Check it in the Firestore console. |
| You added `admins/…` but still see "Join the table" | The document ID must be exactly the account ID shown on that screen. Reload after saving. |
| The Map page has no picture | The GM has not uploaded one yet (step 8). |
| "Could not delete that trainer" (as a player) | The new `firestore.rules` have not been published yet. See **Updating the site**. |

## What is in this folder

| File | What it is |
|---|---|
| `index.html`, `app.js` | The tracker itself. |
| `backend.js` | Sign-in screen and the connection to Firebase. |
| `firebase-config.js` | Your project's settings. The one file you edit. |
| `firestore.rules` | The access rules you paste into Firebase. |
| `vendor/` | Google's Firebase browser library, unmodified, plus the three fonts in `vendor/fonts`, so the site does not depend on an outside CDN. |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are. Harmless if it did not upload. |
