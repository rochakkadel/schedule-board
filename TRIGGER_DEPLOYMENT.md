# How to Trigger a New Deployment

After adding GitHub Secrets, you need to trigger a new deployment for the changes to take effect.

## Option 1: Manual Workflow Trigger (Recommended)

1. Go to your repository on GitHub:
   - Visit: `https://github.com/xxxrkxxxrkxxx-ui/schedule-board`

2. Click on the **"Actions"** tab

3. In the left sidebar, click on **"Build and Deploy to GitHub Pages"**

4. Click the **"Run workflow"** button (top right)

5. Select **"main"** branch from the dropdown

6. Click the green **"Run workflow"** button

7. Wait for the workflow to complete (usually 2-3 minutes)

8. Check the deployment status - it will show a green checkmark when complete

## Option 2: Push a New Commit

1. Make a small change to any file (or just add a space)

2. Commit and push:
   ```bash
   git add .
   git commit -m "Trigger deployment with Firebase secrets"
   git push origin main
   ```

3. The workflow will automatically run on push

## Verify Deployment

After deployment completes:

1. Go to the **"Actions"** tab
2. Click on the latest workflow run
3. Check that the build step completed successfully
4. Visit your site: `https://xxxrkxxxrkxxx-ui.github.io/schedule-board/`

## Troubleshooting

**If build fails:**
- Check the workflow logs in the Actions tab
- Verify all 7 secrets are added correctly
- Make sure secret names match exactly (case-sensitive)

**If deployment succeeds but app still shows error:**
- Check browser console for Firebase errors
- Verify Firebase project has Firestore enabled
- Check Firebase project settings allow web app access

