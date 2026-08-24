# Getting set up (one time)

This is for making design changes to the website yourself. You will never break the real
site doing this. Everything you change goes to a practice copy first, and only Zach can put
changes on the real site.

You need about 20 minutes and your Mac.

## What you are installing

Two free apps:

- **Claude Code**, which is the assistant you talk to in plain English to change the site.
- **GitHub Desktop**, which is the button that saves and sends your changes.

## Step 1: Install GitHub Desktop

1. Make a free account at https://github.com/signup if you do not have one. Write down the
   username you pick and send it to Zach, he needs it to give you access.
2. Download GitHub Desktop from https://desktop.github.com and install it.
3. Open it and sign in with the account from step 1.

## Step 2: Get the website onto your computer

1. In GitHub Desktop, go to File, then Clone Repository.
2. Pick **ZachsHacks/bitachon-judaica** from the list. If you do not see it, Zach has not
   added you yet, send him your username.
3. Click Clone. It will put a folder on your computer, usually in Documents/GitHub.

## Step 3: Install Claude Code

1. Open the **Terminal** app. Press Command and Space, type Terminal, press Return.
   A window with text will open. This is the only time you need it.
2. Copy this line, paste it into the Terminal window, and press Return:

   ```
   curl -fsSL https://claude.ai/install.sh | bash
   ```

3. Wait for it to finish, then close Terminal and open it again.
4. Type `claude` and press Return. It will ask you to sign in through your browser. Do that.

## Step 4: Start working

Every time you want to change the site:

1. Open Terminal.
2. Type this and press Return (adjust the folder if yours is somewhere else):

   ```
   cd ~/Documents/GitHub/bitachon-judaica && claude
   ```

3. Now just talk to it in normal English. For example:
   - "Make the homepage headline bigger and move it higher up."
   - "The category list on the shop page is too cramped, give it more room."
   - "Show me what the homepage looks like on a phone."

## Step 5: Publish your changes

When you like what you made:

1. Open GitHub Desktop. You will see a list of what changed.
2. In the box at the bottom left, type a short note about what you did, like
   "made the homepage headline bigger".
3. Click **Commit to main**, then click **Push origin** at the top.
4. About a minute later your practice site updates. Zach gets an email and can put it on the
   real site when you are both happy with it.

## Things worth knowing

- **Products, prices, and photos are not done here.** Those you add at
  https://bitachonjudaica.com/admin like you already do. This is only for the design and
  layout: colors, sizes, spacing, where things sit on the page.
- **You cannot break the real website.** Your changes go to a practice copy first.
- If something looks wrong, tell Claude "undo that" and it will put it back.
- If you get stuck, take a screenshot and send it to Zach.
