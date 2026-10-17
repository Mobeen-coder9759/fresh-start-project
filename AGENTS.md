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

- The landing sequence uses one conditionally mounted intro video with window-level skip listeners cleaned up before the final form; this prevents playback and skip handlers from interfering with sign-in input.
- Sign-in visual roles are defined in global CSS and exposed through Button variants so the requested styling stays consistent without hardcoded page colors.
