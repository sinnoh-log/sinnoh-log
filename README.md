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
| Loyalty scores, NPC secrets, GM place notes | never sent to players | read and edit |
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
2. If `firestore.rules` changed, open Firebase console → **Firestore → Rules**, paste in the new contents, and click **Publish**. Do this before players use the new version. The rules have not changed since the delete-your-own-trainer update, so if you already published those there is nothing to do for Mega Evolution or the handbook data: both are stored in documents the existing rules already limit to you.
3. GitHub Pages takes a minute or two to update (check the repository's **Actions** tab for a green tick). Each person should refresh the page once, holding Shift while clicking reload.
4. **Check that the new version is running.** The very bottom of every page says **Version** followed by a date and a name (this release: `Version 2026-10-09 · Handbook data`). If it is missing or shows something older, the browser is still using the old files. Reload with Shift held, or open the site in a private window. If a private window is also old, the upload did not replace the files: check that `app.js` and `index.html` are in the top level of the repository (not in a sub-folder) and that you pressed **Commit changes**.

Nothing in your database changes when you update the files. The handbook data is a separate one-time step (see **Handbook data** below).

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

## Deleting trainers and Pokémon

- **A Pokémon:** open its card on the **Pokémon** page and tap **Delete Pokémon** twice.
- **A trainer:** at the bottom of the **Trainer** page, choose **Delete this trainer**, then type the trainer's name to confirm. This removes the sheet, all of its Pokémon, the honors recorded for it and (for the GM) the loyalty notes. It cannot be undone, so download a backup first if you are unsure.
- Players can delete their own. The GM can delete anyone's (open that trainer from the Overview first).
- Deleting a trainer does not remove the person's account or table access. They can make a new trainer from the **Trainer** page.

## Good to know

- **The repository contains** the app and the player-facing text for each place on the map. Nothing secret lives in it: no GM notes, no NPC secrets, no passwords, no map image. Those are in Firebase, and the rules keep players out of the GM-only parts.
- **Cost.** The Spark plan has daily limits (about 50,000 reads and 20,000 writes). They reset around midnight Pacific time. A table of a handful of players should stay far below them. If a limit is ever hit, the app stops loading data until the next day. Nothing is charged on the Spark plan.
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
