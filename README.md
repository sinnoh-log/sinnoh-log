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
| Loyalty scores, NPC secrets, GM place notes, foe sheets, NPC trainers' sheets, items, rosters and secrets, the battle map until you show it (and always its hidden markers, the terrain you keep to yourself, the shapes you have not shared, your saved formations and the library of saved maps), and where hidden foes stand | never sent to players | read and edit |
| Battle page: turn order, health, stages, status | see the order and what the GM reveals; change their own Pokémon | run the whole battle, change anyone's |
| Battle map: seeing it, the ruler, and moving tokens | only after the GM shows the map, with only the foes the GM shows; they move their own Pokémon | see and move everything, including hidden foes |
| Battle map: adding, aligning, showing, hiding and removing it; showing or hiding a foe | no | yes |
| Battle map: range shapes (burst, cone, line, blast) | draw their own, which only they see; see the ones the GM shares | draw, share, hide and remove |
| Battle map: painted terrain and markers | see the terrain and the markers the GM shows | paint, place, show, hide and delete |
| Battle map: walls (painted as terrain) stopping range shapes and tokens | stopped only by walls they can see; cannot go through | paint them; can go through with Shift, or switch the stopping off |
| Battle map: fog of war | see only the squares uncovered or in sight of their Pokémon; no controls | switch it on, set the sight range, uncover or cover squares, see everything |
| Battle map: saved formations and the library of saved maps | no | yes |
| Wild encounter tables (a weighted list of Pokémon on a place, and rolling it) | no access; the list is never sent to them | build, roll, and add the result to the battle |
| Contests page: the contest move list, keywords, appeal helper and guide | see and use; mark the contest type of a move that is not on the list | see and use |
| Shop page: buying with credits | buy several of an item at once from open shops, as far as stock and their credits allow; cannot sell back | the same, plus sell to any trainer |
| Shops: making and stocking them, prices, stock, opening and closing, hidden items, items that wait for a place, the purchase log | no access; they never receive hidden or locked items | build and run them, read the log |
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
2. If `firestore.rules` changed, open Firebase console → **Firestore → Rules**, paste in the new contents, and click **Publish**. Do this before players use the new version. The rules have not changed since the delete-your-own-trainer update, so if you already published those there is nothing to do for Mega Evolution, the handbook data, evolution, the Battle page, the combat reference, the Pokédex, NPC trainers (including their pictures and picture framing, stats, items and Mega Evolution) the battle map or its terrain, markers, shapes, formations and library of saved maps, contest moves, contest stats, Pokémon gender, shiny, Poké Ball, wild encounter tables or shops: they are all stored in documents the existing rules already cover (the secret foe sheets go in `gm/battle` and each NPC trainer in `gm/nt_…`, which only you can read; what the table is shown of an NPC goes in `meta/npcs`, which only you can write, and an NPC's shared picture goes in `mapimg/npc_…`, in the same collection as the map, which members can read and only you can write; a player's Seen and Caught marks go on their own trainer sheet; the Pokédex lock goes in `meta/mega`, which only you can write; the battle map's working copy, with where every foe stands and whether it is shown, goes in `gm/bmap` and `gm/bmi_…`, which only you can read; what the table sees of a shown map goes in `meta/bmap`, which only you can write, and its picture in `mapimg/bm_…`, in the same collection as the map; where a Pokémon stands goes on its own sheet, so its player can move it; the terrain, markers, shapes and formations are extra fields on those same two map documents, and the library of saved maps goes in `config/`, which only you can read or write; the contest move list goes in `meta/pta_contest`, next to the rest of the handbook data, which members can read and only you can write; the contest type a player picks for a move that is not on the list is a field on that move on their own sheet; a Pokémon's gender, shiny mark, Poké Ball and contest stats are more fields on its own sheet, and gender and shiny are also on an NPC's or foe's entry in the GM's own documents; what the table is told about a shiny foe goes in `meta/battle`, which only you can write; your shops, with every price, stock count, hidden item and locked item, go in `gm/shops`, which only you can read, and the shelves the players see go in `meta/shops`, which only you can write; a purchase is saved on the buyer's own trainer sheet).
3. GitHub Pages takes a minute or two to update (check the repository's **Actions** tab for a green tick). Each person should refresh the page once, holding Shift while clicking reload.
4. **Check that the new version is running.** The very bottom of every page says **Version** followed by a date and a name (this release: `Version 2026-10-24 · Shops`). If it is missing or shows something older, the browser is still using the old files. Reload with Shift held, or open the site in a private window. If a private window is also old, the upload did not replace the files: check that `app.js` and `index.html` are in the top level of the repository (not in a sub-folder) and that you pressed **Commit changes**.

Nothing in your database changes when you update the files. The handbook data is a separate step (see **Handbook data** below). The handbook data is now version 3 (`pta-handbook-data.json`). Version 2 added evolution lines and five species the first file missed (Bisharp, Heliolisk, Amoonguss, Stantler and Azumarill); version 3 adds the contest move list. **If you already imported the version 3 file from the contest-moves update, this release needs no new import.** If you have not, sign in as the GM and use **GM Desk → Handbook data → Import again** with the `pta-handbook-data.json` in this update. Until you do, everything else keeps working, but the Contests page says the list has not been imported yet and the contest line does not appear on Pokémon moves. (If you never imported the earlier versions, the same import brings in those too.)

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

**Moves and passives by name.** In a move row, type a move's name (the list of suggestions has all 527 battle moves in the book) and, if the row's **Effect** and **Damage** are still empty, its kind, type, range, uses, damage and effect fill in. In a passive row, typing a passive's name fills in its effect. A row with text you wrote is never overwritten.

**Mega Evolution numbers.** For the 43 Mega forms in the Players Handbook 2, the Mega panel uses the book's stat bonuses and Mega passive instead of an approximation. Mega details that were filled in automatically update by themselves the next time the owner opens the app after the import. Ones a player edited by hand are left alone.

## Pokémon gender

Every Pokémon sheet has a **Gender** box next to **Species**: **Not set**, **Male**, **Female** or **Genderless**. It is for writing down what the Pokémon is. The handbook data does not list genders, so nothing fills it in by itself, and the app does not change any numbers because of it.

- A Pokémon with a gender set shows **♂ Male** or **♀ Female** (or **Genderless**) next to its types at the top of its card, and in the party list on the **Overview** page. **Not set** shows nothing.
- Changing the species, for example when a Pokémon evolves, keeps the gender.
- Players set it on their own Pokémon, and everyone can see it. The GM can set it on anyone's.
- A few handbook entries have passives that depend on gender (Oinkologne and Indeedee list a Male and a Female version), so this is a handy place to see which one applies.
- **For the GM.** The Pokémon on **NPC Trainers** sheets and the foes in a **Battle** have a Gender box too. It goes with the Pokémon from the NPC's roster to the battle and, when you give or catch a foe, onto the trainer's new sheet. It is not part of what the table is shown about a hidden foe. The **Give a Pokémon** form in the GM Desk does not ask for it; set it on the sheet afterwards.
- No new import and no rules change are needed.

## Shiny and Poké Ball

Two more boxes on every Pokémon sheet, both for writing down what the Pokémon is.

- **Shiny ✦** (a tick box next to Gender). A shiny Pokémon shows a gold **✦ Shiny** mark beside its types, and its picture switches to the shiny sprite, here and in the Overview party list. If the shiny sprite is not available for a species, the normal one is shown.
- **Poké Ball** (suggestions include the standard balls). The ball's name and icon show under the Pokémon's name on its card, next to its species and held item.
- Players set them on their own Pokémon and everyone can see them; the GM can set them on anyone's.
- **For the GM.** NPC trainers' Pokémon and battle foes have a **Shiny ✦** box too, which goes with the Pokémon from the NPC's roster to the battle and onto the trainer's sheet when you give or catch a foe. The players see a foe as shiny only once you tick **Picture** for that foe (the table is told nothing before then). There is no Poké Ball box for foes, because the ball comes with the catch.
- No new import and no rules change are needed.

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

## Wild encounters

Each place on the map can have a **table of the Pokémon that turn up there**. Rolling it picks one and says how many, and you can drop the result straight into the battle as foes. It is for the moments when the party walks into tall grass and you would rather let the dice decide.

**Building a table (GM).** Open a place from the **Map** page and scroll to **Wild encounters** (under the GM notes; only you see it). Tap **Add a Pokémon**, type the species (the usual suggestions appear), and give it a **Weight**. The weights are relative: a Pokémon with weight 60 in a table whose weights add up to 100 turns up 60% of the time, and the percentage is shown on each row as you type. **Min** and **Max** say how many appear at once (1 to 8; a roll picks a number between them). A row with no species, or a weight of 0, shows "not used" and is skipped. Use the arrows to reorder rows and the × to delete one. A table holds up to 30 rows, and there is a small notes box for yourself ("Only in tall grass. Roll once every ten minutes.").

**Rolling.** **Roll an encounter** shows the result in a green box, for example **Starly ×2 · 60% chance**. **Roll again** rolls again. **Add to the battle** puts them in as foes and takes you to the Battle page.

**On the Battle page.** The **Who is fighting** panel (GM only) has a **Wild encounter** box under **Add a foe**. Pick a place (it lists only the places that have a usable table) and tap **Roll and add to the battle**, and the result goes straight in without visiting the place page.

**What the foes look like.** They are ordinary foes with full sheets (HP, stats, moves and passives filled in from the handbook data, as when you add a species by name), so everything else on the Battle page works on them. They start **hidden**, like every foe, with names "Foe A", "Foe B" and so on until you reveal them, and the note on each sheet says **Wild encounter at Route 201** (or wherever it was). If a species in your table is not in the handbook data, the foe is still added and you fill in its numbers by hand.

*Where it is kept:* the table is stored in the place's GM document (`gm/place_…`, next to the GM notes), which Firestore's rules let only you read. A player's browser never receives it, and the public battle never mentions where a foe came from. No new import and no rules change are needed.

## Shops

The **Shop** page (in the Table section of the menu) lets players spend their credits (P). You build as many shops as you like, put each one on a place on the map, and give it its own shelves, prices and limited stock.

**What players do.** They pick a shop, optionally search by name or effect or filter by kind, type how many they want (the box beside **Buy**; it stops at what is left and at 99) and tap **Buy**. The credits come off their trainer sheet, the items are added to their bag (a stack they already have just grows), and the sale is written to a short list of their recent purchases at the bottom of the page. A price that is more than they have shows in red, and the shop will not sell what they cannot afford. **There is no selling back.** A sold-out item sinks to the bottom and says **Sold out**.

**Building a shop (GM).** Open **Shop → Edit shops**.
- **Make the shop.** Give it a name, choose **Start with** (an empty shop, or a ready-made shelf: *Mart in a Pokémon Center*, *Poké Mart*, *Department store*, *Specialty shop*), and set **Stock of each** (a number, or leave it blank for unlimited). Up to 30 shops, 250 items each.
- **Where it is.** Choose a place from the map list. A shop with no place shows as *Travelling*.
- **Stock the shelves.** Type an item from the handbook and its price and description fill in: the list holds **436 goods with the prices printed in the Players Handbook and the second handbook** (balls, medicine, berries, held items, stones, TMs, vitamins, packs and kits, clothing and armor, tech, camping gear and general goods). Anything else you type becomes a custom item that you price yourself. Or pick a kind under **Or add a whole group** to add every priced item in it at once. A few things have no printed price (a Master Ball, for example); they show **Needs a price** and stay off the shelf until you give them one.
- **Edit anything.** Every row has editable name, price, stock, kind and description, arrows to reorder, and × to remove. Under each row you can see how many have **sold** and how many are **left**.
- **Open and close.** **Open shop / Close shop** on the list, on the shop's own editor, or on its place page. Players see only open shops. Once the party has reached the shop's place, a closed shop still shows there with a **Closed** sign and your note, but no shelves.
- **Hide items.** Tick **Hidden** on an item and players never see it, though it stays in your editor. Untick it to put it on sale.
- **Wait for a town.** Under **On sale once the party reaches**, choose a place. The item stays off the shelf until you mark that place as reached. Mark places under **Edit shops → Where the party has been**, or tick **The party has reached …** on the place's own page on the Map (a **Shops and the party** panel there also lists the shops in that place with Open/Close). Unticking a place takes its items off sale again.
- **A note players see.** A line such as "Back in ten minutes" appears on the open shop.
- **Delete the shop.** Two taps. Purchases already made stay in the players' logs.

**Limited stock.** The count left is what you set minus what the players have bought, and every player sees the same number. Editing the stock changes the count immediately (setting it to 10 after 4 sold leaves 6). Deleting a trainer returns that trainer's purchases to the shelf.

**The purchase log (GM).** **Shop → Purchase log** lists every sale, newest first, with the time, who bought, how many, the price each, the shop and the total, a running total of what is shown, and filters for shop and trainer. A sale you made with **Sell to** says *sold by the GM*. Each sheet keeps its last 300 purchases, which is the history the log is built from.

**Selling as the GM.** On the **Shop floor** you also get **Sell to**, a trainer picker. Buying then charges that trainer and puts the goods in that trainer's bag, which is handy for a player who is not at the table.

**Limits worth knowing.**
- *Two people buying the last one at the same moment* can both succeed, because there is no central counter. The log then shows a yellow note ("Sold more than the stock") and the item row says **Sold N too many**; fix it on the players' sheets or raise the stock.
- *This is bookkeeping, not an anti-cheat lock.* A player can edit their own credits and bag on their own sheet (as they always could), so a determined player could skip the shop. What the shop does protect is what players are shown: hidden items, items waiting for a place, the shelves of a closed shop and items with no price never reach their browsers.
- Prices are whole numbers of P. A shop document can hold roughly 800 KB of definitions; the app warns before it is full.

*Where it is kept:* your full shops (every price, stock number, hidden and locked item) are in `gm/shops`, which Firestore's rules let only you read. What the players see, plus the list of places the party has reached, is a copy in `meta/shops`, which only you can write; your browser refreshes that copy the moment you change a shop, so the players' shelves follow your edits right away (you need to make the change from your own signed-in page, which is the only place shops can be edited). A purchase changes only the buyer's own trainer sheet (credits, bag, a count of what they bought and a purchase record), which the rules already allow. No new import and no rules change are needed.

## Battle map

On the **Battle** page, the **Turn order | Map** switch above the battle opens a map of the fight: a picture or a blank grid, with a token for every Pokémon and foe in the battle. Players see the switch only while you are showing a map.

**Making a map (GM).** Tap **Map**, then **Upload a picture** (a photo or drawing of the area, shrunk to at most 1600 pixels on its longest side) or **Use a blank grid** (columns and rows, 4 to 80 each). Nothing is shown to the players yet. The settings stay open so you can finish setting up.

- **Lining the grid up with the picture.** A new picture starts with 24 squares across. If the picture has its own printed squares, type **Squares across** and tap **Set**, or tap **Mark one square** and then tap two opposite corners of one square on the map. Fine-tune with **Square size (pixels)** and **Offset across / down**. **Show the grid lines** can be unticked.
- A new map (or a new picture) puts everyone back in the **Not on the map yet** list, because squares on the old map mean nothing on the new one.

**Putting tokens down.** Everyone in the battle has a token: the Pokémon's picture in a ring (blue for Pokémon, red for foes), a health bar, a status tag when there is one, and a glowing gold ring on whoever's turn it is. Tiny, Small and Medium Pokémon cover one square, Large 2 × 2, Huge 3 × 3 and Gigantic 4 × 4 (a foe's size comes from the handbook, a Pokémon's from its **Size** field).

- Anyone not yet on the map waits under **Not on the map yet**. Tap a name, then tap a square.
- To move a token: **drag it** (it snaps to a square when you let go, and a small tag shows how many squares it has moved), or **tap it and then tap a square**, or use the arrow buttons under the map, or focus it and use the **arrow keys** (hold Shift for three squares). A token cannot be put partly off the map.
- Tap a token to see its name, health, types and status under the map. **Open details** goes to its row in the turn order. **Take off the map** puts it back in the waiting list.
- A token's name shows when it is selected or when it is its turn; hold the pointer over any token to see it.

**Who can move what.** A player moves only their own Pokémon (where it stands is saved on that Pokémon's own sheet, so they do not need you). You move everything, including other players' Pokémon and all foes.

**Walls stop tokens.** Once a map has **Wall** squares (see Terrain below), a token cannot be moved onto or through one. Dragging, tapping a square, the arrow buttons and the arrow keys all walk the token one square at a time and stop it in front of the first wall, and the note at the top right of the page says "A wall stopped it" (or "A wall is in the way" if it could not move at all). While you drag, the token follows your finger square by square, so you can steer it round the end of a wall; if your finger goes behind a wall, the token waits at the wall (its tag says "wall") until your finger comes back to somewhere it can reach. A token cannot squeeze diagonally between two walls that touch at a corner, but it can brush past the corner of a single wall. A large token needs room for its whole body: a Gigantic foe stops when any of its 16 squares would touch a wall. Tokens do not block each other, only walls do. A token that is already standing on a wall (you painted one under it) can always step out. **GM:** hold **Shift** while dragging, or tap a square with Shift held, to move a token through a wall; or untick **Walls stop tokens from moving onto or through them** in **Settings** to turn the stopping off for the whole map. Players can do neither, and a player is stopped only by walls she can see: if you keep the terrain from the players (**Show painted terrain to the players** off), her tokens move freely and you move them back yourself. **Put them there** (formations) leaves a token where it is if its saved square is now a wall, and says so.

**Ruler.** Tap **Ruler**, then drag across the map to see the distance in squares, a diagonal step counting as one. Anyone can use it. While the ruler, range shapes, paint terrain or fog of war is on, the map does not scroll under your finger, so tap the tool again to move around. Only one tool is on at a time.

**Range shapes.** Tap **Range shapes** (under the header), pick a **Burst**, **Cone**, **Line** or **Blast**, set its size with **−** and **+** (one square is 5 ft, and the size is shown in feet as well), then put it on the map. The list under the map says who is in it.

- **Burst:** everything within that many squares of the square you tap, so it is a square block, with a diagonal step counting as one square like the ruler (up to 10). **Blast:** a square area, that many squares on a side, centred on the square you tap, or as near the centre as a blast with an even width can be (up to 10). **Cone** (up to 20 long): starts beside the square where you press and fans out, as wide as it is long (1, 3, 3, 5, 5, 7… squares wide). **Line** (up to 20 long): a straight line out from that square, 1 to 5 squares wide (draw a beam with a width of one and a wave with a wider line).
- For a cone or a line, **press where it starts and drag the way it should point**: it snaps to one of eight directions and the note under the buttons shows what it covers as you go. A plain tap uses the direction pad instead. A burst or blast follows your finger and lands where you let go. **Start from** puts a shape on the token you have selected.
- Shapes are clipped at the edge of the map. **Walls stop them too**: a square is covered only if a straight line from the shape's starting square reaches it without crossing a Wall (a wall square itself is not covered, and the line cannot slip diagonally between two walls that touch at a corner). A cone fired at a wall therefore has a shadow behind it, and a burst beside a wall does not reach the other side. The list under the map says "Cut short by walls" and leaves out anyone shielded. Each shape can ignore walls: untick **Walls stop new shapes** (it appears once the map has a wall) before you place it. Cover and other terrain do not affect shapes: judge those yourself.
- Up to six shapes can be on the map; adding another drops the oldest. **Remove** takes one away; **Remove all** clears the lot.
- **Players** draw shapes too, but theirs exist only on their own screen: nothing is saved, and their list never names a foe you are hiding. **GM:** your shapes are saved with the map, so a reload does not lose them. They are private until you tap **Show to players** on one (the map must be shown for them to see it); a shared shape is dashed, and the list marks it "From the GM" for them, without Remove. **End battle** clears your shapes along with the tokens.

**Terrain (GM).** Tap **Paint terrain**, pick **Water**, **Rough ground**, **Wall**, **Hazard**, **Cover** or **Erase** and a brush of 1 × 1, 2 × 2 or 3 × 3, then drag across the map. Each kind has its own pattern, not only a colour, and a key under the map lists what is on it. A token standing on terrain says so under the map. **Wall** is the one kind the app acts on: it stops attack shapes and tokens (see **Walls stop tokens** above and **Range shapes**); a wall is the whole square, not an edge between squares. **Clear all terrain** takes two taps. The app does not apply movement costs or damage for the other kinds: their pattern is a reminder, and the rules are yours. **Show painted terrain to the players** (in **Settings**, on by default) controls whether the table sees it; with it off they see none, and you still do.

**Fog of war (GM).** Tick **Cover the map** under **Fog of war** in **Settings** (or open the **Fog of war** tool and tap **Turn fog of war on**) and the map starts covered for the players: solid black where nothing has been seen, a lighter shade where it was seen earlier but is out of sight now, and clear where they can see right now. You still see everything, with the covered squares hatched and a note under the map. Squares open up in two ways, and you can use either or both:

- **What the Pokémon can see.** With **The players' Pokémon uncover what they can see as they move** on (the default), every Pokémon of the party that is on the map and not fainted sees a number of squares around it (**Sight range**, 6 by default, up to 30; a Large or bigger Pokémon sees a little further). With **Walls block sight** on (also the default) a wall can be seen but not what is behind it, using the same straight-line rule as shapes. Squares a Pokémon has seen stay on the map, dimmed, after it moves on, so the party's map fills in as they explore.
- **By hand.** Open the **Fog of war** tool and drag across the map with **Uncover** (the squares are open for good), **Cover** (hidden, even from a Pokémon standing next to them: a dark room, say) or **Undo** (back to normal: hidden until a Pokémon sees it). Brushes are 1 × 1, 2 × 2 or 3 × 3. **Uncover everything** opens the lot; **Cover everything again** (two taps) wipes what has been seen and what you set by hand, and sight starts again from where the Pokémon stand.

What the fog hides from the players: a foe you have shown stays out of their copy of the map while it is in covered or only-seen-earlier squares, and appears when it is in view (its card tells you "In the fog: players cannot see it"); a marker or a wall in a covered square is not sent either (dim squares count as seen, so a marker there still shows). The players' Pokémon are always visible to the party. Shapes you share are drawn above the fog, because you chose to share them.

*Two limits.* The fog is a **cover over the picture**: the picture file is still sent to the players' devices (so a secret drawn into the picture is not protected: crop it out before you upload), but nothing else in a covered square is. And the table's copy is worked out on **your** device, so a player moving her Pokémon uncovers new squares only while your page is open (it catches up a moment after you open it or the Pokémon moves again).

**Markers (GM).** Tap **Add markers**, pick a kind (**Note**, **Trap**, **Item**, **Exit**, **Objective**, **Start**), type an optional note, then tap a square. A new marker is **hidden**: you see it dashed, the players do not. Select it to change its note or kind, **Show to players** or **Hide from players**, or **Delete marker**. Drag a marker (or use the arrow keys on it) to move it. Players tap a shown marker to read its kind and note. A map holds up to 40.

**Formations (GM).** In **Settings**, name a formation and tap **Save where everyone stands**; later, **Put them there** moves everyone back. Allies are matched by Pokémon, foes by their letter (Foe A, Foe B…), and a saved foe keeps whether it was shown. Anyone in the battle who is not in the formation stays where they are. A map keeps up to eight; formations belong to the map and travel with it into the library.

**Saved maps (GM).** In **Settings**, **Save to the library** keeps the current map with its picture, grid, terrain, markers, formations and fog settings (including the squares you uncovered or covered by hand, but not the ones your players' Pokémon had seen), under a name you choose (a name you have used already is replaced). **Use this map** puts a saved map in place of the current one (it asks for a second tap, because the current map's terrain and markers are replaced; save it first if you want to keep it). A map you bring back starts hidden from the players, with nobody on it and no shapes. The library holds six maps. It is yours alone: it lives in `config/`, next to the table code.

**Zoom.** **Fit**, **2×**, **3×** and **4×**. On a phone, drag on an empty part of the map to scroll it. Dragging a token you may move carries the token instead.

**What the table sees.** The map is private until you tap **Show the map to the players** (in **Settings**). Foes start **hidden**: you see them with a dashed outline and a "hidden" tag, the players do not see them at all. Select a foe and tap **Show to players** to put it on their map, or use **Show all foes** / **Hide all foes**. A shown foe appears as whatever the battle already shows of it (a question mark and "Foe A" until you show its picture and name), and its square and size are all the map adds. Moving a shown foe moves it for everyone within a second or two. **Hide the map from the players** takes the whole map, and everyone's tokens, off their screens.

*Where it is kept:* your working copy (the picture, the grid, the terrain, every marker, your shapes and formations, where every foe stands and which are shown) is in `gm/bmap` and `gm/bmi_…`, which Firestore's rules let only you read, so a hidden foe's square or a hidden marker's note is never on a player's device. When you show the map, the table's copy is a small document, `meta/bmap`, with the grid, the terrain (if you chose to share it, and without the walls in covered squares), whether walls stop tokens, which squares are in view if fog of war is on, only the markers and shapes you showed (a shape that walls cut short is sent as the squares it covers, so it looks the same to a player who cannot see the walls), and only the foes you showed, plus the picture in `mapimg/bm_…`. The library of saved maps is in `config/bsc_…` (settings) and `config/bsi_…_…` (pictures), which only you can read. Hiding the map deletes the picture copy again. Where a Pokémon stands is a `bpos` field on its own sheet.

**Ending.** **End battle** takes every token off the map; the map stays for next time. **Clear every token** does the same without ending the battle. **Remove the map** (two taps) deletes it and its picture.

**Good to know.**

- Showing the map sends the **whole picture** to the players, even with fog of war on: the fog is a cover, not a cut. If part of the picture is a secret, crop it before you upload it. (Terrain, markers and foes you keep hidden, or that are in covered squares, are not on their devices; a secret drawn into the picture itself is.)
- Token pictures are the same Pokémon sprites as elsewhere, so they need the internet to appear; a letter or question mark shows meanwhile.
- One map at a time. Two people dragging the same token at once: the last drop wins.
- Squares are counted for you, and walls stop shapes and tokens, but movement costs, the effects of other terrain, cover, doors and real line of sight are not applied: you judge those. A wall is a whole square, and "line of effect" is a straight line between square centres, so a corner case may need your ruling. The terrain, markers and shapes are there to show everyone what you decided.
- **Download my backup** includes the map's settings, terrain, markers and foe positions for the GM, but not the picture or the library. Keep the original picture files.

## NPC trainers

**Game Master → NPC Trainers** is where you make the people your table meets who have Pokémon of their own: a rival, a gym leader, a stranger on a route. Nothing you put there reaches the players until you decide to show it.

**Making one.** Tap **New NPC trainer** and fill in the name, role or title, where you met, **notes the table learns once you show them**, and a **secret** that only you ever see. Then use **Give this NPC a Pokémon**: type a species (and a name if you like) and tap **Add Pokémon**. Its types, stats, passives and moves fill in from the handbook data, like a foe. Tap **Edit** on a Pokémon to change anything: HP, stats (Base and Adj), held item, nature, moves (typing a move's name into an empty row fills in the rest), passives and your notes about it. **Fill from the handbook** (two taps) puts the handbook numbers back. **Remove Pokémon** and **Delete this NPC** also take two taps.

**Where it is kept.** Each NPC is one document, `gm/nt_…`, that Firestore's rules let only you read. A player's browser never receives it, so the secret, the notes and every sheet are not hidden "behind" the page: they are simply not there. What the table may see is a separate, small document, `meta/npcs`, that holds only the NPCs you have shown and, for each one, only what you ticked.

**Showing an NPC.** In **GM only · what the players see**, tick **Show this NPC to the table**. That alone shows just the name. Then tick any of **Role**, **Where you met**, **Your notes**, **Picture**, **Level and class**, **Stats** and **Items** to add those. The line below spells out what the players see right now. Players find them on the **People** page, under **Trainers you have met** (you see the same panel there, marked as what the players see). Untick **Show this NPC** and she disappears from their screens again; what you ticked is remembered for next time.

**Showing a Pokémon.** Every Pokémon starts fully hidden. On its sheet, tick **Name**, **Picture** and **Types** to show those on the NPC's card (**Show all** and **Hide all** do the lot). Tick **Held item** to show what it is holding ("holding Garchompite"). With the name hidden the card says "Unknown Pokémon" and the picture does not give the name away; the moves, stats, nature, passives and your notes are never shown. A Pokémon only appears on the card once the NPC herself is shown. A Pokémon with its picture shown on a card counts as **seen** in the Pokédex.

**In a battle.** On the NPC's page, **Add to battle** puts one Pokémon in and **Add the whole team to the battle** puts them all in. (The Battle page has the same buttons under **Who is fighting → NPC trainers**.) They join as **foes**, with the full sheet in `gm/battle`, so everything in **Foes the players cannot see** applies: they start as "Foe A", "Foe B" with no picture, types or health, and you show what you like. A foe remembers whose it is: you see "Foe · Cynthia" on its row and "Belongs to Cynthia" on its sheet. The players see her name on it only once you have shown her.

**Pictures.** On an NPC's page, **Upload picture** (beside her name) takes a photo or drawing from your device and keeps the whole of it, shrunk to at most 900 pixels on its longest side. **Change picture** and **Remove** appear once there is one. A small version also shows on her card in your list, and her first letter shows until you add one.

**Moving and zooming the picture.** Cards show the picture in a tall frame, so a wide picture would lose its sides. Under the picture on her page, **drag it** to move it inside the frame, use the **Zoom** slider to zoom in, or click it and use the **arrow keys** (hold Shift for bigger steps). The frame on her card in your list follows as you go. **Reset frame** centres it and sets the zoom back to 1. A new picture always starts centred.

**The full picture.** **View full picture** (under the picture on her page) opens all of it, uncropped, in front of the page. Players can do the same: on the NPC's card the picture has a "Tap to enlarge" label, and tapping it opens the whole picture. Tap anywhere, press **Escape** or use **Close** to put it away. Pictures saved by Update 9 keep working: they open at the size they were saved at, and you can add a new one to get a larger one.

**Showing it to the players.** The table sees nothing until she is shown **and** you tick **Picture**; then the portrait, in the frame you chose, appears beside her name under **People → Trainers you have met**. Unticking **Picture**, hiding the NPC, removing the picture or deleting her takes the table's copy away at once (an open full picture closes by itself). Moving or zooming while it is shared updates the table's frame within a second. The line under the picture says which state it is in.

*Where the picture is kept:* her own copy (the whole picture and its frame) sits on her private sheet (`gm/nt_…`), which only you can read. While it is shared, the table's copy is one small document, `mapimg/npc_…`, in the collection the map picture already uses (the existing rules let members read it and only you write it, so nothing needs republishing). The public NPC document, `meta/npcs`, never holds picture data.

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

## Contests

**Table → Contests** is a quick reference for the PTA 3.5 contest rules, with every contest move in the Players Handbook, 722 in all. It has four views:

- **Contest moves.** Your Pokémon's moves come first, each with its contest type, keyword and what the keyword does. Under them is the whole list, which you can search by name and filter by contest type, by keyword, or to show only moves your Pokémon know. The list shows 80 at a time with **Show more**.
- **Keywords.** All 22 keywords, with the Heart Points each one gives and what it does. The button under each one shows how many moves use it; tap it to see those moves in the Contest moves view.
- **Appeal helper.** Pick a move (type its name, or choose one of your Pokémon's moves), say what kind of contest it is, what Voltage the judge has, and whether you appealed first, repeated a move, followed Get Ready! or face an Electrified judge, and how many contest stat points you spend. It adds up the dice from the keyword, the contest type and your choices, tells you what happens to the judge's Voltage, and **Roll the appeal** rolls them and puts the result in the table's roll log. It is a memory aid: you still decide what is going on in the contest, and the handbook has the full rules. The helper keeps your choices until you press **Reset** (or reload the page), so clear the boxes between rounds. Only the keywords that need an extra choice show it.
- **How contests work.** A short plain-words guide: what a contest is, the five contest types and which ones get along or clash, the three stages, contest stats, variations, and what to do with a move that is not on the list.

**On your Pokémon.** When a Pokémon's move is on the contest list, a **Contest** line appears under it on its card with the move's contest type, keyword and effect, and an **Appeal** button that opens the helper with that move ready. A move that is not on the list (for example one taught by a tutor) is an Appeal move, and the tutor chooses its contest type. A **Contest type** box on that row lets you record the choice, and the helper then uses it. If the row is empty or a Pokémon has no moves, nothing extra shows.

**Contest stats.** Every Pokémon sheet has a **Contest stats** box near the bottom with the five stats (Cool, Beauty, Cute, Clever, Tough), a total shown as "N of 10", and room to write what Poffins and PokéBlocks have given it. More than 10 is flagged but not blocked, since the handbook says scarves can go past it. In the **Appeal helper**, choose the Pokémon (or tap **Appeal** on one of its moves) and the helper shows its points as left over written, and the **Contest stat points you spend** box only offers what is left in the stat that matches the move's contest type. An any-type move asks which stat to spend from. Each roll takes the points it used, as the handbook says they are used up during a contest, and the **New contest: restore all stat points** button gives every Pokémon its points back. The helper's memory of what was spent is not saved: reloading the page restores them. Without a Pokémon chosen, the box is 0 to 10 as before, and the roll log names the Pokémon when one is.

**The contest list is handbook text, so it is not on the public site.** Like the rest of the handbook data, it comes from `pta-handbook-data.json`. Import that file in **GM Desk → Handbook data** (see above) and the list is stored in your Firebase database, where only signed-in members of your table can read it. Do not upload the JSON file to GitHub. Until you import it, players see a message saying the list has not been imported yet, and the GM sees a note with the same steps. No new database rule is needed.

Things to know:

- A move's name has to match the book's (capitals and punctuation do not matter). If you changed the spelling of a move, the contest line will not appear; choose the contest type by hand instead.
- 193 of the 722 contest moves are not battle moves in the book's move list, so they cannot fill in a move row by name; they are in the contest list only.
- The helper never changes a Pokémon's sheet and nothing about a contest is saved or shared, except the roll in the roll log.
- The Voltage and Heart Point rules in the helper are written in the app's own words. Check the handbook if a contest ruling matters.

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
