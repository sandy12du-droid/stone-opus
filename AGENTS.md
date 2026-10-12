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

- Monetary displays, including sample copy and chart labels, use the shared location formatter during rendering and subscribe to LocationContext so switching locations updates them immediately; never preformat amounts at module initialization.
- Operating locations are persisted as company/warehouse records with explicit currency and a manual conversion rate; location codes scope business records and query cache keys, and non-HQ summaries use real scoped records rather than global demo widgets.
