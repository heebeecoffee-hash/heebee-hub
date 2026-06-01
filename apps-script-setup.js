/**
 * HEEBEE HUB — Google Apps Script Backend
 * ─────────────────────────────────────────
 * SETUP STEPS:
 * 1. Open your Google Sheet
 * 2. Create two tabs: "users" and "systems"
 *
 * "users" tab headers (Row 1):
 *    username | password | role | name
 *    role must be: "owner" or "employee"
 *
 * "systems" tab headers (Row 1):
 *    id | name | url | icon | added_by | created_at
 *
 * 3. Go to Extensions → Apps Script
 * 4. Paste this entire file, replacing any existing code
 * 5. Click Deploy → New Deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL
 * 7. Paste it into index.html where it says: YOUR_APPS_SCRIPT_URL_HERE
 */

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    if (action === 'login')             result = handleLogin(e.parameter);
    else if (action === 'getSystems')   result = handleGetSystems(e.parameter);
    else if (action === 'addSystem')    result = handleAddSystem(e.parameter);
    else if (action === 'deleteSystem') result = handleDeleteSystem(e.parameter);
    else result = { success: false, error: 'Unknown action' };

    const json = JSON.stringify(result);
    const origin = e.parameter.origin || '*';

    const html = `<!DOCTYPE html><html><body><script>
      (function(){
        var t = window.parent !== window ? window.parent : window.opener;
        if(t) t.postMessage(${json}, '${origin}');
      })();
    <\/script></body></html>`;

    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch(err) {
    const html = '<!DOCTYPE html><html><body><script>(function(){var t=window.parent!==window?window.parent:window.opener;if(t)t.postMessage({success:false,error:"' + err.message.replace(/"/g,"'") + '"},"*");})()</\script></body></html>';
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// ── AUTH ────────────────────────────────────────────────────────
function handleLogin(p) {
  const sheet = getSheet('users');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const [username, password, role, name] = rows[i];
    if (String(username).trim() === String(p.u).trim() &&
        String(password) === String(p.p)) {
      return { success: true, role: role, name: name };
    }
  }
  return { success: false };
}

// ── VERIFY OWNER ────────────────────────────────────────────────
function isOwner(username) {
  const sheet = getSheet('users');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(username).trim()) {
      return String(rows[i][2]).trim() === 'owner';
    }
  }
  return false;
}

// ── GET SYSTEMS ─────────────────────────────────────────────────
function handleGetSystems(p) {
  const sheet = getSheet('systems');
  const rows = sheet.getDataRange().getValues();
  const systems = [];

  for (let i = 1; i < rows.length; i++) {
    const [id, name, url, icon] = rows[i];
    if (id && name && url) {
      systems.push({ id: String(id), name: String(name), url: String(url), icon: String(icon || '◈') });
    }
  }
  return { success: true, systems };
}

// ── ADD SYSTEM ──────────────────────────────────────────────────
function handleAddSystem(p) {
  if (!isOwner(p.u)) return { success: false, error: 'Not authorized' };

  const sheet = getSheet('systems');
  const id = Date.now().toString();
  sheet.appendRow([id, p.name, p.url, p.icon || '◈', p.u, new Date().toISOString()]);
  return { success: true, id };
}

// ── DELETE SYSTEM ───────────────────────────────────────────────
function handleDeleteSystem(p) {
  if (!isOwner(p.u)) return { success: false, error: 'Not authorized' };

  const sheet = getSheet('systems');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(p.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'System not found' };
}

// ── HELPERS ─────────────────────────────────────────────────────
// ── SPREADSHEET ID ──────────────────────────────────────────────
// Paste your Google Sheet ID here (the long string in the sheet URL)
const SHEET_ID = '1mrM6GIohnS83Bg4UYlP2-5EZfRpaaq3VyeNtWkKI8QY';

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found. Create it first.`);
  return sheet;
}

