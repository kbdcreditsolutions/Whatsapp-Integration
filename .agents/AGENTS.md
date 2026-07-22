<RULE[git_push_account]>
# GitHub Account Enforcement
For this project, all git pushes MUST happen from the `manojtyson-37` GitHub account only. 
Before pushing code, ensure the active GitHub CLI account is correctly set. If the push fails due to permission errors, you must switch the account by running:
`gh auth switch -u manojtyson-37`
and then configure git to use it:
`gh auth setup-git`
</RULE[git_push_account]>

<RULE[vercel_deployment_verification]>
After pushing code to the repository, ALWAYS verify whether the Vercel deployment succeeded by checking the deployment status (e.g., using `vercel ls` or checking the Vercel URL) before reporting back to the user.
</RULE[vercel_deployment_verification]>
