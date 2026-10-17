<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The landing sequence uses a head-level ScriptOnce bootstrap to capture input before hydration and visibility-only CSS to reveal the already-rendered form, then hands off to React's single conditionally mounted video and cleaned-up window listeners; this avoids dropped early input without changing sign-in styling.
- Sign-in visual roles are defined in global CSS and exposed through Button variants so the requested styling stays consistent without hardcoded page colors.
