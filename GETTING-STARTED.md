# Changing the website yourself

You change the site by chatting with Codex in ChatGPT, in plain English. No apps to install,
nothing to type into a Terminal.

## One time setup (about 5 minutes)

1. Make a free account at https://github.com/signup if you do not have one, and send Zach
   the username. He gives it access to the website.
2. Go to https://chatgpt.com/codex and click **Connect to GitHub**. Sign in with that account
   and allow access.
3. When it asks for an environment, pick **ZachsHacks/bitachon-judaica**.

## Every time you want a change

1. Go to https://chatgpt.com/codex and make sure **bitachon-judaica** is selected.
2. Type what you want, then click **Code**. For example:
   - "Make the homepage headline bigger and move it higher up."
   - "The category list on the shop page is too cramped, give it more room."
   - "Change the About page title color to the gold."
3. When it finishes, read what it says it did. If it is right, click **Create PR**.
   If not, tell it what to fix in the same chat.
4. Click **View PR**. About a minute later a link from **Vercel** appears on that page
   (Visit Preview). That is a practice copy with your change. Check it on your phone too.
5. Happy with it? Click the green **Merge pull request** button, then **Confirm merge**.
   About a minute later it is on the real site, bitachonjudaica.com. Hold Shift and click
   reload if you do not see it yet.

Not happy? Do not merge. Nothing on the real site changes until you click Merge.

## Things worth knowing

- **Products, prices, and photos are not done here.** Keep using
  https://bitachonjudaica.com/admin like you already do. Codex is for the design and the
  page wording: colors, sizes, spacing, where things sit.
- Regret a change after merging? Tell Codex "undo the last change", create the PR, and merge
  it. Or send Zach a message.
- Stuck? Take a screenshot and send it to Zach.
