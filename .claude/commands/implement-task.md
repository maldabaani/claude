Implement a task from the blog-scrum Notion board by name.

## Usage
/implement-task <task name>

Example: /implement-task Delete Post

---

## Notion config
- Token: `$NOTION_TOKEN`
- Notion-Version: `2022-06-28`
- Database ID: `c45ed9a6-cb4f-46a9-b598-23b0a73198ee`

---

## Workflow

### Step 1 — Find the task by name
Search the database for a page whose title exactly matches `$ARGUMENTS`:

```bash
curl -s -X POST "https://api.notion.com/v1/databases/c45ed9a6-cb4f-46a9-b598-23b0a73198ee/query" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" \
  -d '{"filter":{"property":"Task","title":{"equals":"$ARGUMENTS"}}}'
```

Extract the page `id` from the first result. If no result is found, tell the user the task was not found and stop.

### Step 2 — Mark as In Progress
```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/<page_id>" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" \
  -d '{"properties":{"Status":{"status":{"name":"In Progress"}}}}'
```

Tell the user: "Starting **<task name>** — marked as In Progress."

### Step 3 — Read task details and acceptance criteria
Fetch all blocks from the page:

```bash
curl -s "https://api.notion.com/v1/blocks/<page_id>/children" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28"
```

From the response:
- Read the **bulleted_list_item** blocks under "What Needs to Be Done" — these are your implementation guide.
- Collect every **to_do** block under the "Acceptance Criteria" heading — record each block's `id` and `plain_text`. These are the checkboxes you will tick off during implementation.

### Step 4 — Implement
Follow every bullet point from "What Needs to Be Done" precisely. Use the existing codebase conventions:
- Backend: Express + SQLite in `backend/`, CommonJS (`require` / `module.exports`)
- Frontend: React + Vite in `frontend/src/`, ES modules
- API functions go in `frontend/src/api/posts.js`
- New pages go in `frontend/src/pages/` with a co-located `.module.css`
- Routes are registered in `frontend/src/App.jsx`

After completing the work for each acceptance criterion, check it off immediately in Notion:

```bash
curl -s -X PATCH "https://api.notion.com/v1/blocks/<to_do_block_id>" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" \
  -d '{"to_do":{"checked":true}}'
```

Check off each criterion as soon as the corresponding code is written, not all at the end.

### Step 5 — Mark as Done
Once all acceptance criteria are checked:

```bash
curl -s -X PATCH "https://api.notion.com/v1/pages/<page_id>" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" \
  -d '{"properties":{"Status":{"status":{"name":"Done"}}}}'
```

### Step 6 — Notify the user
Tell the user the task is complete with:
- A bullet-point list of every file changed or created
- Confirmation that the Notion task is marked Done with all acceptance criteria checked
