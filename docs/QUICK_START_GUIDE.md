# Gemma Setup - Copy/Paste 5 Times (2 Minutes)

You need to add 5 secret codes. It's just copy/paste. No technical knowledge needed.

---

## Step 1: Open This Link

**Click here**: https://supabase.com/dashboard/project/hdeeowrlzdzegleswxtn/settings/functions

(Opens in a new tab. You might need to log in first.)

---

## Step 2: Click "Secrets" Tab

At the top of the page, click the **Secrets** tab.

---

## Step 3: Add Secret #1

Click the **"Add new secret"** button (green, top right).

A popup appears with 2 boxes.

**Box 1 - Name:**
Copy this and paste it:
```
ANTHROPIC_API_KEY
```

**Box 2 - Value:**
Copy this long text and paste it:
```
your-anthropic-api-key-here
```

**Click "Save"**

---

## Step 4: Add Secret #2

Click **"Add new secret"** again.

**Name:**
```
LLM_PROVIDER
```

**Value:**
```
anthropic
```

**Click "Save"**

---

## Step 5: Add Secret #3

Click **"Add new secret"** again.

**Name:**
```
ANTHROPIC_MODEL
```

**Value:**
```
claude-3-5-sonnet-20241022
```

**Click "Save"**

---

## Step 6: Add Secret #4

Click **"Add new secret"** again.

**Name:**
```
LLM_TEMPERATURE
```

**Value:**
```
0.3
```

**Click "Save"**

---

## Step 7: Add Secret #5 (Last One!)

Click **"Add new secret"** one more time.

**Name:**
```
LLM_MAX_TOKENS
```

**Value:**
```
2000
```

**Click "Save"**

---

## Done! You Should See 5 Secrets Listed:

1. ✓ ANTHROPIC_API_KEY
2. ✓ LLM_PROVIDER
3. ✓ ANTHROPIC_MODEL
4. ✓ LLM_TEMPERATURE
5. ✓ LLM_MAX_TOKENS

---

## Now Test Gemma

1. Open your app
2. Sign up (use any email/password)
3. Go to "Today" tab
4. Type: **hey**
5. Click "Send"

**Before (what you saw):**
> "I hear you saying: 'hey'. As Gemma, I'm here to support your personal development journey..."

**After (what you'll see now):**
> "Hey. I'm here. How are you feeling today?"

Real Gemma! Calm, warm, intelligent.

---

## Stuck? Common Issues:

**"I can't find the Secrets tab"**
- Make sure you're logged into Supabase
- Make sure you clicked the link above
- Look at the very top of the page for tabs

**"The secret didn't save"**
- Copy the text exactly (no extra spaces)
- Secret names have CAPITAL LETTERS (they matter!)
- Try copying again

**"Still seeing the robot response"**
- Wait 30 seconds after saving all secrets
- Try sending another message
- Clear your browser cache and try again

---

That's it! Once you paste those 5 secrets, Gemma comes alive.
